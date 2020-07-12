"use strict";

/* eslint-disable no-console, no-magic-numbers, max-statements */
/* eslint-disable max-params, prefer-template, complexity, global-require */

const Path = require("path");
const Fs = require("fs");
const webpack = require("webpack");
const hotHelpers = require("webpack-hot-middleware/helpers");
const Url = require("url");
const queryStr = require("querystring");
const { getWebpackStartConfig } = require("@xarc/webpack/lib/util/custom-check");
const { getLogs, getLogEventAsHtml } = require("./log-reader");
const { fullDevServer, controlPaths } = require("../../config/dev-proxy");
const { formUrl } = require("../utils");
const isomorphicLoaderConfig = require("isomorphic-loader/lib/config");

hotHelpers.pathMatch = (url, path) => {
  try {
    return Url.parse(url).pathname === Url.parse(path).pathname;
  } catch (e) {
    return false;
  }
};

const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const serveIndex = require("serve-index-fs");
const ck = require("chalker");
const _ = require("lodash");
const statsUtils = require("../stats-utils");
const statsMapper = require("../stats-mapper");
const xsh = require("xsh");
const shell = xsh.$;

function urlJoin() {
  if (arguments.length < 1) return undefined;

  const base = arguments[0];

  if (!base) return undefined;

  const ix = base.indexOf("://");
  let saved = "";

  if (ix > 0) {
    arguments[0] = base.substr(ix + 3);
    saved = base.substring(0, ix + 3);
  }

  return saved + Path.posix.join.apply(null, arguments);
}

//
// skip webpack-dev-middleware if
//
// - http header FORCE_WEBPACK_DEV_MIDDLEWARE is not "true"
// AND
// - request is from https://github.com/hapijs/shot
// - or if http header SKIP_WEBPACK_DEV_MIDDLEWARE is set to true
//
// Param: req is the Node HTTP raw request (framework agnostic)
//
const skipWebpackDevMiddleware = req => {
  const h = req.headers || {};
  return (
    h.FORCE_WEBPACK_DEV_MIDDLEWARE !== "true" &&
    (h["user-agent"] === "shot" || h.SKIP_WEBPACK_DEV_MIDDLEWARE === "true")
  );
};
class Middleware {
  constructor(options) {
    this._options = options;
    this.canContinue = Symbol("webpack dev middleware continue");
    this._instanceId = Date.now();
  }

  setup() {
    const options = this._options;

    const config = require(getWebpackStartConfig("webpack.config.dev.js"));

    this._hmrPath = controlPaths.hmr;

    const webpackHotOptions = _.merge(
      {
        log: false,
        path: formUrl({ ...fullDevServer, path: this._hmrPath }),
        heartbeat: 2000
      },
      options.hot
    );

    this._webpackHotOptions = webpackHotOptions;

    const encodeHmrPath = encodeURIComponent(webpackHotOptions.path);

    const hmrClient = [`webpack-hot-middleware/client?path=${encodeHmrPath}`];
    if (typeof config.entry === "object") {
      Object.keys(config.entry).forEach(k => {
        config.entry[k] = hmrClient.concat(config.entry[k]);
      });
    } else {
      config.entry = hmrClient.concat(config.entry);
    }

    config.plugins = [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin()
    ].concat(config.plugins);

    const compiler = webpack(config);

    if (options.progress !== false) {
      compiler.apply(new webpack.ProgressPlugin({ profile: options.progressProfile }));
    }

    const webpackDevOptions = _.merge(
      {
        // https: false,
        // disableHostCheck: true,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        // port: archetype.webpack.devPort,
        // host: archetype.webpack.devHostname,
        quiet: false,
        lazy: false,
        watchOptions: {
          aggregateTimeout: 2000,
          poll: false
        },
        stats: {
          colors: true
        },
        publicPath: "/js",
        serverSideRender: false,
        clientLogLevel: "info"
      },
      options.common,
      options.dev
    );

    let defaultReporter; // eslint-disable-line
    webpackDevOptions.reporter = (a, b) => defaultReporter(a, b);

    this.devMiddleware = webpackDevMiddleware(compiler, webpackDevOptions);
    this.hotMiddleware = webpackHotMiddleware(compiler, webpackHotOptions);
    this.publicPath = webpackDevOptions.publicPath || "/";
    this.listAssetPath = urlJoin(this.publicPath, "/");

    this.memFsCwd = this.devMiddleware.fileSystem.existsSync(process.cwd()) ? process.cwd() : "/";
    this.cwdMemIndex = serveIndex(this.memFsCwd, {
      icons: true,
      hidden: true,
      fs: this.devMiddleware.fileSystem,
      path: Path.posix
    });

    this.cwdIndex = serveIndex(process.cwd(), { icons: true, hidden: true });
    this.devBaseUrl = urlJoin(options.devBaseUrl || controlPaths.dev);
    this.devBaseUrlSlash = urlJoin(this.devBaseUrl, "/");
    this.cwdBaseUrl = urlJoin(this.devBaseUrl, "/cwd");
    this.cwdContextBaseUrl = urlJoin(this.devBaseUrl, "/memfs");
    this.reporterUrl = urlJoin(this.devBaseUrl, "/reporter");
    this.logUrl = urlJoin(this.devBaseUrl, "/log");
    this.logEventsUrl = urlJoin(this.devBaseUrl, "/log-events");
    this.dllDevUrl = urlJoin(this.devBaseUrl, "/dll");

    const LOADABLE_STATS = "loadable-stats.json";
    const LOADABLE_STATS_DEV = "loadable-stats.dev.json";

    const isoLockfile = Path.resolve(isomorphicLoaderConfig.lockFile);
    const isoConfigFile = Path.resolve(isomorphicLoaderConfig.configFile);

    // Must wait for isomorphic-loader to complete saving its config
    // file before continuing and do hot reload in the app server.
    // In webpack dev mode, isomorphic-loader use config.assets instead
    // of loading them from config.assetsFile, so no need to transfer that
    // from Mem FS to physical disk.
    const waitIsoLock = cb => {
      if (!process.send && (Fs.existsSync(isoLockfile) || !Fs.existsSync(isoConfigFile))) {
        return setTimeout(() => waitIsoLock(cb), 50);
      } else {
        return cb();
      }
    };

    const transferMemFsFiles = (fileSystem, cb) => {
      // always operate in custom fs with posix conventions
      const loadableStats = Path.posix.join(this.memFsCwd, `server/${LOADABLE_STATS}`);
      if (fileSystem.existsSync(loadableStats)) {
        const source = fileSystem.readFileSync(loadableStats);
        const dir = Path.resolve("./dist/server");
        if (!Fs.existsSync(dir)) shell.mkdir("-p", dir);
        Fs.writeFileSync(Path.join(dir, LOADABLE_STATS), source);
        Fs.writeFileSync(Path.join(dir, LOADABLE_STATS_DEV), source);
      }

      process.nextTick(() => cb(true));
    };

    this.webpackDev = {
      lastReporterOptions: undefined,
      hasErrors: false,
      valid: false,
      compileTime: 0
    };

    this.returnReporter = undefined;

    defaultReporter = (middlewareOptions, reporterOptions) => {
      if (reporterOptions.state) {
        const stats = reporterOptions.stats;
        const error = stats.hasErrors() ? "<red> ERRORS</>" : "";
        const warning = stats.hasWarnings() ? "<yellow> WARNINGS</>" : "";
        const notOk = Boolean(error || warning);
        const but = (notOk && "<yellow> but has</>") || "";
        const showError = Boolean(error);
        console.log(ck`webpack bundle is now <green>VALID</>${but}${error}${warning}`);

        this.webpackDev.valid = true;
        this.webpackDev.hasErrors = stats.hasErrors();
        this.webpackDev.compileTime = Date.now();

        const baseUrl = this._options.baseUrl;

        const update = () => {
          if (notOk) {
            console.log(ck`<cyan.underline>${urlJoin(baseUrl(), this.reporterUrl)}</> \
- View status and errors/warnings from your browser`);
          }

          if (this.webpackDev.lastReporterOptions === undefined) {
            this.returnReporter = showError;
          } else {
            // keep returning reporter until a first success compile
            this.returnReporter = this.returnReporter ? showError : false;
          }

          const refreshModules = [];
          if (!this.webpackDev.hasErrors) {
            const cwd = process.cwd() + "/";
            const bundles = statsMapper.getBundles(reporterOptions.stats);
            bundles.forEach(b => {
              b.modules.forEach(m => {
                if (m.indexOf("node_modules") >= 0) return;
                if (m.indexOf("(webpack)") >= 0) return;
                if (m.startsWith("multi ")) return;
                // webpack4 output like "./routes.jsx + 9 modules"
                const plusIx = m.indexOf(" + ");
                if (plusIx > 0) m = m.substring(0, plusIx);
                refreshModules.push(m.replace(cwd, ""));
              });
            });
          }

          this.webpackDev.lastReporterOptions = reporterOptions;

          process.send({
            name: "webpack-report",
            valid: true,
            hasErrors: stats.hasErrors(),
            hasWarnings: stats.hasWarnings(),
            refreshModules
          });
        };

        waitIsoLock(() => transferMemFsFiles(this.devMiddleware.fileSystem, update));
      } else {
        process.send({
          name: "webpack-report",
          valid: false
        });
        console.log(ck`webpack bundle is now <magenta>INVALID</>`);
        this.webpackDev.valid = false;
        this.webpackDev.lastReporterOptions = false;
      }
    };
  }

  process(req, res, cycle) {
    const isHmrRequest =
      req.url === this._hmrPath ||
      (req.url.startsWith(this.publicPath) && req.url.indexOf(".hot-update.") >= 0);

    if (skipWebpackDevMiddleware(req)) {
      return Promise.resolve(cycle.skip());
    }

    if (!this.webpackDev.lastReporterOptions && !isHmrRequest) {
      return Promise.resolve(
        cycle.replyHtml(`<html><body>
<div style="margin-top: 50px; padding: 20px; border-radius: 10px; border: 2px solid red;">
<h2>Waiting for webpack dev middleware to finish compiling</h2>
</div><script>function doReload(x){ if (!x) location.reload(); setTimeout(doReload, 1000); }
doReload(1); </script></body></html>`)
      );
    }

    const serveStatic = (baseUrl, fileSystem, _serveIndex, cwd, isMemFs) => {
      req.originalUrl = req.url; // this is what express saves to, else serve-index nukes
      req.url = req.url.substr(baseUrl.length) || "/";
      const PathLib = isMemFs ? Path.posix : Path;
      const fullPath = PathLib.join(cwd || process.cwd(), req.url);

      return new Promise((resolve, reject) => {
        fileSystem.stat(fullPath, (err, stats) => {
          if (err) {
            return reject(err);
          } else if (stats.isDirectory()) {
            res.once("end", resolve);
            return _serveIndex(req, res, reject);
          } else {
            return fileSystem.readFile(fullPath, (err2, data) => {
              if (err2) {
                return reject(err);
              } else {
                return resolve(cycle.replyStaticData(data));
              }
            });
          }
        });
      });
    };

    const sendStaticServeError = (msg, err) => {
      return cycle.replyHtml(
        `<html><body>
<div style="margin-top:50px;padding:20px;border-radius:10px;border:2px solid red;">
<h2>Error ${msg}</h2>
<div style="color: red;">${err.message}</div>
<h3>check <a href="${this.reporterUrl}">webpack reporter</a> to see if there're any errors.</h3>
</div></body></html>`
      );
    };

    const serveReporter = reporterOptions => {
      const stats = reporterOptions.stats;
      const jsonData = stats.toJson({}, true);
      const html = statsUtils.jsonToHtml(jsonData, true);
      const jumpToError =
        html.indexOf(`a name="error"`) > 0 || html.indexOf(`a name="warning"`) > 0
          ? `<script>(function(){var t = document.getElementById("anchor_warning") ||
document.getElementById("anchor_error");if (t) t.scrollIntoView();})();</script>`
          : "";
      return Promise.resolve(
        cycle.replyHtml(`<html><body>
<div style="border-radius: 10px; background: black; color: gray; padding: 10px;">
<pre style="white-space: pre-wrap;">${html}</pre></div>
${jumpToError}</body></html>
`)
      );
    };

    const serveLogEvents = async () => {
      const query = queryStr.parse(Url.parse(req.url).query);
      let start = parseInt(query.start, 10) || 0;
      const id = parseInt(query.id, 10);
      if (id !== this._instanceId) {
        start = 0;
      }

      const htmlLogs = [];
      const allLogs = await getLogs();
      for (let ix = start; ix < allLogs.length; ix++) {
        const event = allLogs[ix];
        htmlLogs.push({
          ...event,
          message: getLogEventAsHtml(event)
        });
      }
      const data = {
        start,
        logs: htmlLogs,
        total: allLogs.length,
        instanceId: this._instanceId
      };
      return Promise.resolve(cycle.replyStaticData(JSON.stringify(data)));
    };

    const serveLog = () => {
      const file = require.resolve("@xarc/app-dev/lib/dev-admin/log.html");
      return Promise.resolve(cycle.replyFile(file));
    };

    if (isHmrRequest) {
      // do nothing and continue to webpack dev middleware
      return Promise.resolve(this.canContinue);
    } else if (req.url === this.publicPath || req.url === this.listAssetPath) {
      const outputPath = this.devMiddleware.getFilenameFromUrl(this.publicPath);
      const filesystem = this.devMiddleware.fileSystem;

      const listDirectoryHtml = (baseUrl, basePath) => {
        return (
          filesystem.readdirSync(basePath).reduce((a, item) => {
            const p = `${basePath}/${item}`;
            if (filesystem.statSync(p).isFile()) {
              return `${a}<li><a href="${baseUrl}${item}">${item}</a></li>\n`;
            } else {
              return `${a}<li>${item}<br>` + listDirectoryHtml(`${baseUrl}${item}/`, p) + "</li>\n";
            }
          }, "<ul>") + "</ul>"
        );
      };
      const html = `<html><head><meta charset="utf-8"/></head><body>
${listDirectoryHtml(this.listAssetPath, outputPath)}
</body></html>`;
      return Promise.resolve(cycle.replyHtml(html));
    } else if (req.url.startsWith(this.cwdBaseUrl)) {
      return serveStatic(this.cwdBaseUrl, Fs, this.cwdIndex).catch(err => {
        return sendStaticServeError(`reading file under CWD`, err);
      });
    } else if (req.url.startsWith(this.cwdContextBaseUrl)) {
      const isMemFs = true;
      return serveStatic(
        this.cwdContextBaseUrl,
        this.devMiddleware.fileSystem,
        this.cwdMemIndex,
        this.memFsCwd,
        isMemFs
      ).catch(err => sendStaticServeError("reading webpack mem fs", err));
    } else if (req.url.startsWith(this.logEventsUrl)) {
      return serveLogEvents();
    } else if (req.url.startsWith(this.logUrl)) {
      return serveLog();
    } else if (req.url.startsWith(this.reporterUrl) || this.returnReporter) {
      return serveReporter(this.webpackDev.lastReporterOptions);
    } else if (req.url.startsWith(this.dllDevUrl)) {
      // App is requesting for Electrode DLL JS bundle
      // extract DLL module and bundle name
      const dllParts = req.url
        .substr(this.dllDevUrl.length + 1)
        .split("/")
        .filter(x => x);
      // module name is first
      const modName = decodeURIComponent(dllParts[0]);
      // bundle name is second
      const bundle = require.resolve(`${modName}/dist/${dllParts[1]}`);
      return Promise.resolve(cycle.replyFile(bundle));
    } else if (req.url === this.devBaseUrl || req.url === this.devBaseUrlSlash) {
      const html = `<html><head><meta charset="utf-8"/></head><body>
<h1>Electrode Development Dashboard</h1>
<h3><a href="${this.cwdBaseUrl}">View current working directory files</a></h3>
<h3><a href="${this.cwdContextBaseUrl}">View webpack dev memfs files</a></h3>
<h3><a href="${this.logUrl}">View your app server console logs</a></h3>
</body></html>`;
      return Promise.resolve(cycle.replyHtml(html));
    }

    return Promise.resolve(this.canContinue);
  }
}

module.exports = Middleware;
