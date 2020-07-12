/* eslint-disable max-statements, max-depth */
import * as groupScripts from "../group-scripts";

import {
  getIconStats,
  getCriticalCSS,
  getDevCssBundle,
  getDevJsBundle,
  getProdBundles,
  processRenderSsMode,
  getCspNonce,
  getBundleJsNameByQuery,
  isReadableStream
} from "./utils";

import {
  getContent,
  transformOutput,
  htmlifyScripts,
  loadElectrodeDllAssets,
  makeElectrodeDllScripts
} from "./content";

import prefetchBundles from "./handlers/prefetch-bundles";

const CONTENT_MARKER = "SSR_CONTENT";
const HEADER_BUNDLE_MARKER = "WEBAPP_HEADER_BUNDLES";
const BODY_BUNDLE_MARKER = "WEBAPP_BODY_BUNDLES";
const DLL_BUNDLE_MARKER = "WEBAPP_DLL_BUNDLES";
const TITLE_MARKER = "PAGE_TITLE";
const PREFETCH_MARKER = "PREFETCH_BUNDLES";
const META_TAGS_MARKER = "META_TAGS";
const CRITICAL_CSS_MARKER = "CRITICAL_CSS";
const APP_CONFIG_DATA_MARKER = "APP_CONFIG_DATA";
const WEBAPP_START_SCRIPT_MARKER = "WEBAPP_START_SCRIPT";

/**
 * @param handlerContext
 */
export default function setup(handlerContext /*, asyncTemplate*/) {
  const routeOptions = handlerContext.user.routeOptions;

  const WEBPACK_DEV = routeOptions.webpackDev;
  const RENDER_JS = routeOptions.renderJS;
  const RENDER_SS = routeOptions.serverSideRendering;
  const assets = routeOptions.__internals.assets;
  const otherAssets = routeOptions.__internals.otherAssets;
  const devBundleBase = routeOptions.__internals.devBundleBase;
  const prodBundleBase = routeOptions.prodBundleBase;
  const chunkSelector = routeOptions.__internals.chunkSelector;
  const iconStats = getIconStats(routeOptions.iconStats);
  const criticalCSS = getCriticalCSS(routeOptions.criticalCSS);

  const routeData = {
    WEBPACK_DEV,
    RENDER_JS,
    RENDER_SS,
    assets,
    otherAssets,
    devBundleBase,
    prodBundleBase,
    chunkSelector,
    iconStats,
    criticalCSS
  };

  handlerContext.user.routeData = routeData;

  const bundleManifest = () => {
    if (!assets.manifest) {
      return "";
    }

    return WEBPACK_DEV
      ? `${devBundleBase}${assets.manifest}`
      : `${prodBundleBase}${assets.manifest}`;
  };

  const bundleJs = data => {
    if (!data.renderJs) {
      return "";
    }
    if (WEBPACK_DEV) {
      return data.devJSBundle;
    } else if (data.jsChunk) {
      const bundleJsName = getBundleJsNameByQuery(data, otherAssets);
      return `${prodBundleBase}${bundleJsName}`;
    } else {
      return "";
    }
  };

  const INITIALIZE = context => {
    const options = context.options;
    const request = options.request;
    const mode = options.mode;
    const renderSs = processRenderSsMode(request, RENDER_SS, mode);

    return getContent(renderSs, options, context).then(content => {
      if (content.render === false || content.html === undefined) {
        return context.voidStop(content);
      }

      const chunkNames = chunkSelector(request);

      const devCSSBundle = getDevCssBundle(chunkNames, routeData);
      const devJSBundle = getDevJsBundle(chunkNames, routeData);

      const { jsChunk, cssChunk } = getProdBundles(chunkNames, routeData);
      const { scriptNonce, styleNonce } = getCspNonce(request, routeOptions.cspNonceValue);

      const renderJs = RENDER_JS && mode !== "nojs";

      context.user = {
        request: options.request,
        response: {
          headers: {}
        },
        routeOptions,
        routeData,
        content,
        mode,
        renderJs,
        renderSs,
        scriptNonce,
        styleNonce,
        chunkNames,
        devCSSBundle,
        devJSBundle,
        jsChunk,
        cssChunk
      };

      if (content.useStream || isReadableStream(content.html)) {
        context.setStandardMunchyOutput();
      }

      context.setOutputTransform(transformOutput);

      return context;
    });
  };

  const windowConfigKey = routeOptions.uiConfigKey || "_config";

  const tokenHandlers = {
    [CONTENT_MARKER]: context => {
      return (context.user.content && context.user.content.html) || "";
    },

    [TITLE_MARKER]: () => {
      return `<title>${routeOptions.pageTitle}</title>`;
    },

    [APP_CONFIG_DATA_MARKER]: context => {
      const { webappPrefix } = context.user.routeOptions.uiConfig;
      const key = `${webappPrefix}${windowConfigKey}`;

      return `<script>window.${key} = window.${key} || {};
window.${key}.ui = ${JSON.stringify(routeOptions.uiConfig)};
</script>`;
    },

    //TODO: below to templats were diabled temporily for throwing error in typescript.
    //      reminder to find resolution on this
    //**** */
    // [HEADER_BUNDLE_MARKER]: context => {
    //   const manifest = bundleManifest();
    //   const manifestLink = manifest ? `<link rel="manifest" href="${manifest}" />\n` : "";
    //   const css = [].concat(WEBPACK_DEV ? context.user.devCSSBundle : context.user.cssChunk);

    //   const cssLink = css.reduce((acc, file) => {
    //     file = WEBPACK_DEV ? file : prodBundleBase + file.name;
    //     return `${acc}<link rel="stylesheet" href="${file}" />`;
    //   }, "");

    //   const htmlScripts = htmlifyScripts(
    //     groupScripts(routeOptions.unbundledJS.enterHead).scripts,
    //     context.user.scriptNonce
    //   );

    //   return `${manifestLink}${cssLink}${htmlScripts}`;
    // },

    // [""]: context => {
    //   context.user.query = context.user.request.query;
    //   const js = bundleJs(context.user);
    //   const jsLink = js ? { src: js } : "";

    //   const ins = routeOptions.unbundledJS.preBundle.concat(
    //     jsLink,
    //     routeOptions.unbundledJS.postBundle
    //   );
    //   const htmlScripts = htmlifyScripts(groupScripts(ins).scripts, context.user.scriptNonce);

    //   return `${htmlScripts}`;
    // },

    [DLL_BUNDLE_MARKER]: context => {
      if (WEBPACK_DEV) {
        return makeElectrodeDllScripts(loadElectrodeDllAssets(context.user.routeOptions));
      }

      if (context.user.routeData.dllAssetScripts === undefined) {
        context.user.routeData.dllAssetScripts = makeElectrodeDllScripts(
          loadElectrodeDllAssets(context.user.routeOptions),
          context.user.scriptNonce
        );
      }

      return context.user.routeData.dllAssetScripts;
    },

    [PREFETCH_MARKER]: prefetchBundles,

    [META_TAGS_MARKER]: iconStats,

    [CRITICAL_CSS_MARKER]: context => {
      return criticalCSS ? `<style${context.user.styleNonce}>${criticalCSS}</style>` : "";
    },

    [WEBAPP_START_SCRIPT_MARKER]: context => {
      const { webappPrefix } = context.user.routeOptions.uiConfig;
      /* istanbul ignore next */
      const startFuncName = webappPrefix ? `${webappPrefix}WebappStart` : "webappStart";
      return `<script>
if (window["${startFuncName}"]) window["${startFuncName}"]();
</script>`;
    },

    INITIALIZE,
    HEAD_INITIALIZE: null,
    HEAD_CLOSED: null,
    AFTER_SSR_CONTENT: null,
    BODY_CLOSED: null,
    HTML_CLOSED: null
  };

  return {
    name: "electrode-react-token-handlers",
    routeOptions,
    routeData,
    tokens: tokenHandlers
  };
}
