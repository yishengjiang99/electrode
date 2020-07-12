import * as _ from "lodash";
import * as Path from "path";
import * as assert from "assert";
import { TagRenderer } from "@xarc/tag-renderer";
import { JsxRenderer } from "@xarc/jsx-renderer";
import { resolvePath } from "./react/utils";

import {
  getOtherStats,
  getOtherAssets,
  resolveChunkSelector,
  loadAssetsFromStats,
  getStatsPath,
  invokeTemplateProcessor,
  makeDevBundleBase
} from "./react/utils";

const otherStats = getOtherStats();

/*eslint-disable max-statements*/
function initializeTemplate(
  { htmlFile, templateFile, tokenHandlers, cacheId, cacheKey, options },
  routeOptions
) {
  const tmplFile = templateFile || htmlFile;
  cacheKey = cacheKey || (cacheId && `${tmplFile}#${cacheId}`) || tmplFile;

  let asyncTemplate = routeOptions._templateCache[cacheKey];
  if (asyncTemplate) {
    return asyncTemplate;
  }

  if (options) {
    routeOptions = Object.assign({}, routeOptions, options);
  }

  const userTokenHandlers = []
    .concat(tokenHandlers, routeOptions.tokenHandler, routeOptions.tokenHandlers)
    .filter(x => x);

  let finalTokenHandlers = userTokenHandlers;

  // Inject the built-in react/token-handlers if it is not in user's handlers
  // and replaceTokenHandlers option is false
  if (!routeOptions.replaceTokenHandlers) {
    const reactTokenHandlers = Path.join(__dirname, "react/token-handlers");
    finalTokenHandlers =
      userTokenHandlers.indexOf(reactTokenHandlers) < 0
        ? [reactTokenHandlers].concat(userTokenHandlers)
        : userTokenHandlers;
  }

  if (!templateFile) {
    asyncTemplate = new TagRenderer({
      htmlFile,
      tokenHandlers: finalTokenHandlers.filter(x => x),
      insertTokenIds: routeOptions.insertTokenIds,
      routeOptions
    });

    invokeTemplateProcessor(asyncTemplate, routeOptions);
    asyncTemplate.initializeRenderer();
  } else {
    const templateFullPath = resolvePath(tmplFile);
    const template = require(templateFullPath); //  eslint-disable-line
    asyncTemplate = new JsxRenderer({
      templateFullPath: Path.dirname(templateFullPath),
      template: _.get(template, "default", template),
      tokenHandlers: finalTokenHandlers.filter(x => x),
      insertTokenIds: routeOptions.insertTokenIds,
      routeOptions
    });
    asyncTemplate.initializeRenderer();
  }

  return (routeOptions._templateCache[cacheKey] = asyncTemplate);
}

function makeRouteHandler(routeOptions) {
  routeOptions._templateCache = {};
  let defaultSelection;

  if (routeOptions.templateFile) {
    defaultSelection = {
      templateFile:
        typeof routeOptions.templateFile === "string"
          ? Path.resolve(routeOptions.templateFile)
          : Path.join(__dirname, "../template/index")
    };
  } else {
    defaultSelection = { htmlFile: routeOptions.htmlFile };
  }

  const render = (options, templateSelection) => {
    let selection = templateSelection || defaultSelection;
    if (templateSelection && !templateSelection.templateFile && !templateSelection.htmlFile) {
      selection = Object.assign({}, templateSelection, defaultSelection);
    }
    const asyncTemplate = initializeTemplate(selection, routeOptions);
    return asyncTemplate.render(options);
  };

  return options => {
    if (routeOptions.selectTemplate) {
      const selection = routeOptions.selectTemplate(options.request, routeOptions);

      if (selection && selection.then) {
        return selection.then(x => render(options, x));
      }

      return render(options, selection);
    }

    const asyncTemplate = initializeTemplate(defaultSelection, routeOptions);
    return asyncTemplate.render(options);
  };
}

const setupOptions = options => {
  const https = process.env.WEBPACK_DEV_HTTPS && process.env.WEBPACK_DEV_HTTPS !== "false";

  const pluginOptionsDefaults = {
    pageTitle: "Untitled Electrode Web Application",
    webpackDev: process.env.WEBPACK_DEV === "true",
    renderJS: true,
    serverSideRendering: true,
    htmlFile: Path.join(__dirname, "index.html"),
    devServer: {
      protocol: https ? "https" : "http",
      host: process.env.WEBPACK_DEV_HOST || process.env.WEBPACK_HOST || "localhost",
      port: process.env.WEBPACK_DEV_PORT || "2992",
      https
    },
    unbundledJS: {
      enterHead: [],
      preBundle: [],
      postBundle: []
    },
    paths: {},
    stats: "dist/server/stats.json",
    otherStats,
    iconStats: "dist/server/iconstats.json",
    criticalCSS: "dist/js/critical.css",
    buildArtifacts: ".build",
    prodBundleBase: "/js/",
    cspNonceValue: undefined
  };

  const pluginOptions = _.defaultsDeep({}, options, pluginOptionsDefaults);
  const chunkSelector = resolveChunkSelector(pluginOptions);
  const devBundleBase = makeDevBundleBase(pluginOptions.devServer);
  const statsPath = getStatsPath(pluginOptions.stats, pluginOptions.buildArtifacts);

  const assets = loadAssetsFromStats(statsPath);
  const otherAssets = getOtherAssets(pluginOptions);
  pluginOptions.__internals = _.defaultsDeep({}, pluginOptions.__internals, {
    assets,
    otherAssets,
    chunkSelector,
    devBundleBase
  });

  return pluginOptions;
};

const pathSpecificOptions = [
  "htmlFile",
  "templateFile",
  "insertTokenIds",
  "pageTitle",
  "selectTemplate",
  "responseForBadStatus",
  "responseForError"
];

const setupPathOptions = (routeOptions, path) => {
  const pathData = _.get(routeOptions, ["paths", path], {});
  const pathOverride = _.get(routeOptions, ["paths", path, "overrideOptions"], {});
  const pathOptions = pathData.options;
  return _.defaultsDeep(
    _.pick(pathData, pathSpecificOptions),
    {
      tokenHandler: [].concat(routeOptions.tokenHandler, pathData.tokenHandler),
      tokenHandlers: [].concat(routeOptions.tokenHandlers, pathData.tokenHandlers)
    },
    pathOptions,
    _.omit(pathOverride, "paths"),
    routeOptions
  );
};

//
// The route path can supply:
//
// - a literal string
// - a function
// - an object
//
// If it's an object:
//   -- if it doesn't contain content, then it's assume to be the content.
//
// If it contains content, then it can contain:
//
// - method: HTTP method for the route
// - config: route config (applicable for framework like Hapi)
// - content: second level field to define content
//
// content can be:
//
// - a literal string
// - a function
// - an object
//
// If content is an object, it can contain module, a path to the JS module to require
// to load the content.
//
const resolveContent = (pathData, xrequire = null) => {
  const resolveTime = Date.now();

  let content = pathData;

  // If it's an object, see if contains content field
  if (_.isObject(pathData) && pathData.hasOwnProperty("content")) {
    content = pathData.content;
  }

  if (!content && !_.isString(content)) return null;

  // content has module field, require it.
  if (!_.isString(content) && !_.isFunction(content) && content.module) {
    const mod = content.module.startsWith(".") ? Path.resolve(content.module) : content.module;

    xrequire = xrequire || require;

    try {
      return {
        fullPath: xrequire.resolve(mod),
        xrequire,
        resolveTime,
        content: xrequire(mod)
      };
    } catch (error) {
      const msg = `electrode-react-webapp: load SSR content ${mod} failed - ${error.message}`;
      console.error(msg, "\n", error); // eslint-disable-line
      return {
        fullPath: null,
        error,
        resolveTime,
        content: msg
      };
    }
  }

  return {
    fullPath: null,
    resolveTime,
    content
  };
};

const getContentResolver = (registerOptions, pathData, path) => {
  let resolved;

  const resolveWithDev = (webpackDev, xrequire) => {
    if (!webpackDev.valid) {
      resolved = resolveContent("<!-- Webpack still compiling -->");
    } else if (webpackDev.hasErrors) {
      resolved = resolveContent("<!-- Webpack compile has errors -->");
    } else if (!resolved || resolved.resolveTime < webpackDev.compileTime) {
      if (resolved && resolved.fullPath) {
        delete resolved.xrequire.cache[resolved.fullPath];
      }
      resolved = resolveContent(pathData, xrequire);
    }

    return resolved.content;
  };

  return (webpackDev, xrequire) => {
    if (webpackDev && registerOptions.serverSideRendering !== false) {
      return resolveWithDev(webpackDev, xrequire);
    }

    if (resolved) return resolved.content;

    if (registerOptions.serverSideRendering !== false) {
      resolved = resolveContent(pathData);
      assert(resolved, `You must define content for the webapp plugin path ${path}`);
    } else {
      resolved = {
        content: {
          status: 200,
          html: "<!-- SSR disabled by options.serverSideRendering -->"
        }
      };
    }

    return resolved.content;
  };
};

export { setupOptions, setupPathOptions, makeRouteHandler, resolveContent, getContentResolver };
