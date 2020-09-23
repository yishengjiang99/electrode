"use strict";

/* eslint-disable max-statements */

const Fs = require("fs");
const Path = require("path");
const util = require("./util");
const subappUtil = require("subapp-util");
const _ = require("lodash");
const assert = require("assert");

module.exports = function setup(setupContext) {
  const cdnEnabled = _.get(setupContext, "routeOptions.cdn.enable");
  const distDir = process.env.NODE_ENV === "production" ? "../dist/min" : "../dist/dev";
  const clientJs = Fs.readFileSync(Path.join(__dirname, distDir, "subapp-web.js")).toString();
  const cdnJs = cdnEnabled
    ? Fs.readFileSync(Path.join(__dirname, distDir, "cdn-map.js")).toString()
    : "";
  const loadJs = Fs.readFileSync(require.resolve("loadjs/dist/loadjs.min.js"), "utf8");
  //
  // TODO: in webpack dev mode, we need to reload stats after there's a change
  //

  const metricReport = _.get(setupContext, "routeOptions.reporting", {});

  const { assets } = util.loadAssetsFromStats(setupContext.routeOptions.stats);
  assert(assets, `subapp-web unable to load assets from ${setupContext.routeOptions.stats}`);
  setupContext.routeOptions.__internals.assets = assets;

  const cdnJsBundles = util.getCdnJsBundles(assets, setupContext.routeOptions);

  const bundleAssets = {
    jsChunksById: cdnJsBundles,
    // md === mapping data for other assets
    md: util.getCdnOtherMappings(setupContext.routeOptions),
    entryPoints: assets.entryPoints,
    basePath: ""
  };

  let inlineRuntimeJS = "";
  let runtimeEntryPoints = [];
  if (process.env.NODE_ENV === "production") {
    runtimeEntryPoints = Object.keys(assets.chunksById.js).filter(ep =>
      assets.chunksById.js[ep].startsWith("runtime.bundle")
    );
    inlineRuntimeJS =
      "/*rt*/" +
      runtimeEntryPoints
        .map(ep => Path.resolve("dist", "js", Path.basename(cdnJsBundles[ep])))
        .filter(fullPath => Fs.existsSync(fullPath))
        .map(fullPath => Fs.readFileSync(fullPath))
        .join(" ")
        .replace(/\/\/#\ssourceMappingURL=.*$/, "") +
      "/*rt*/";

    inlineRuntimeJS += `\nwindow.xarcV1.markBundlesLoaded(${JSON.stringify(runtimeEntryPoints)});`;
  }

  const webSubAppJs = `<script id="bundleAssets" type="application/json">
${JSON.stringify(bundleAssets)}
</script>
<script>/*LJ*/${loadJs}/*LJ*/
${clientJs}
${cdnJs}
${inlineRuntimeJS}
</script>`;

  // check if any subapp has server side code with initialize method and load them
  const { subApps } = setupContext.routeOptions.__internals;
  const subAppServers = subApps
    .map(({ subapp }) =>
      subappUtil.loadSubAppServerByName(subapp.name, false)
    )
    .filter(x => x && x.initialize);

  return {
    process: context => {
      context.user.assets = assets;
      context.user.includedBundles = {};
      runtimeEntryPoints.forEach(ep => {
        context.user.includedBundles[ep] = true;
      });

      if (metricReport.enable && metricReport.reporter) {
        context.user.xarcSSREmitter = util.getEventEmiiter(metricReport.reporter);
      }
      // invoke the initialize method of subapp's server code
      if (subAppServers.length > 0) {
        for (const server of subAppServers) {
          server.initialize(context);
        }
      }

      return webSubAppJs;
    }
  };
};
