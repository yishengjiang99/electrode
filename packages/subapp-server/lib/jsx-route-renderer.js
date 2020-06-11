const { JsxRenderer } = require("@xarc/jsx-renderer");
const { updateFullTemplate } = require("./utils");
const { getSrcDir, setupRouteRender, searchRoutesFromFile } = require("./setup-hapi-routes");
const Path = require("path");
const subAppUtil = require("subapp-util");
async function start() {
  const server = await require("@xarc/fastify-server")({
    deferStart: true,
    connection: { port: 3002, host: "localhost" }
  });

  const opt = {
    srcDir: Path.join(__dirname, "../test/data/fastify-plugin-test"),
    loadRoutesFrom: "routes.js",
    //    templateFile: "_document.js",
    stats: Path.join(__dirname, "../test/data/fastify-plugin-test/stats.json")
  };
  const srcDir = getSrcDir(opt);
  const { routes, topOpts } = searchRoutesFromFile(srcDir, opt);

  const subApps = await subAppUtil.scanSubAppsFromDir(srcDir);
  console.log(subApps);
  const subAppsByPath = subAppUtil.getSubAppByPathMap(subApps);
  console.log(opt);
  console.log(subAppsByPath);
  for (const path in routes) {
    const route = routes[path];
    const routeOptions = Object.assign({}, topOpts, route);
    // const routeRenderer = setupRouteRender({ subAppsByPath, srcDir, routeOptions });
    updateFullTemplate(routeOptions.dir, routeOptions);

    const chunkSelector = resolveChunkSelector(routeOptions);
    routeOptions.__internals = { chunkSelector };
    function updateSubappPaths() {
      if (routeOptions.subApps) {
        routeOptions.__internals.subApps = [].concat(routeOptions.subApps).map(x => {
          let options = {};
          if (Array.isArray(x)) {
            options = x[1];
            x = x[0];
          }
          // absolute: use as path
          // else: assume dir under srcDir
          // TBD: handle it being a module
          return {
            subapp: subAppsByPath[Path.isAbsolute(x) ? x : Path.resolve(srcDir, x)],
            options
          };
        });
      }
    }
    updateSubappPaths();
    const finalTokenHandlers = []
      .concat([], routeOptions.tokenHandler, routeOptions.tokenHandlers)
      .filter(x => x);

    const templateFile =
      (routeOptions.templateFile && Path.resolve(routeOptions.templateFile)) ||
      Path.join(__dirname, "../template/index");

    console.log(templateFile);

    var jsxRend = new JsxRenderer({
      templateFullPath: templateFile,
      template: require(templateFile),
      tokenHandlers: finalTokenHandlers,
      insertTokenIds: routeOptions.insertTokenIds,
      routeOptions
    });
    jsxRend.render();
  }
}

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

  [HEADER_BUNDLE_MARKER]: context => {
    const manifest = bundleManifest();
    const manifestLink = manifest ? `<link rel="manifest" href="${manifest}" />\n` : "";
    const css = [].concat(WEBPACK_DEV ? context.user.devCSSBundle : context.user.cssChunk);

    const cssLink = css.reduce((acc, file) => {
      file = WEBPACK_DEV ? file : prodBundleBase + file.name;
      return `${acc}<link rel="stylesheet" href="${file}" />`;
    }, "");

    const htmlScripts = htmlifyScripts(
      groupScripts(routeOptions.unbundledJS.enterHead).scripts,
      context.user.scriptNonce
    );

    return `${manifestLink}${cssLink}${htmlScripts}`;
  },

  [BODY_BUNDLE_MARKER]: context => {
    context.user.query = context.user.request.query;
    const js = bundleJs(context.user);
    const jsLink = js ? { src: js } : "";

    const ins = routeOptions.unbundledJS.preBundle.concat(
      jsLink,
      routeOptions.unbundledJS.postBundle
    );
    const htmlScripts = htmlifyScripts(groupScripts(ins).scripts, context.user.scriptNonce);

    return `${htmlScripts}`;
  },

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
// const Template = (
//     <IndexPage DOCTYPE="html">
//       <Token _id="INITIALIZE" />
//       <html lang="en">
//         <head>
//           <meta charset="UTF-8" />
//           <meta name="viewport" content="width=device-width, initial-scale=1.11" />
//           <ReserveSpot saveId="headEntries" />
//           <Require _id="subapp-web/lib/polyfill" />
//           <Token _id="META_TAGS" />
//           <Token _id="PAGE_TITLE" />
//           <Require _id="subapp-web/lib/init" />

//           <Token _id="CRITICAL_CSS" />
//         </head>
//         <Token _id="HEAD_CLOSED" />
//         <body>
//           <noscript>
//             <h4>JavaScript is Disabled</h4>
//             <p>Sorry, this webpage requires JavaScript to function correctly.</p>
//             <p>Please enable JavaScript in your browser and reload the page.</p>
//           </noscript>
//           <RenderSubApps />
//           <Require _id="subapp-web/lib/start" />
//         </body>
//         <Token _id="BODY_CLOSED" />
//       </html>
//       <Token _id="HTML_CLOSED" />
//     </IndexPage>
//   );

function resolveChunkSelector(options) {
  if (options.bundleChunkSelector) {
    return require(Path.resolve(options.bundleChunkSelector)); // eslint-disable-line
  }

  return () => ({
    css: "main",
    js: "main"
  });
}
start();

// function makeRouteHandler(routeOptions) {
//   routeOptions._templateCache = {};
//   let defaultSelection;

//   if (routeOptions.templateFile) {
//     defaultSelection = {
//       templateFile:
//         typeof routeOptions.templateFile === "string"
//           ? Path.resolve(routeOptions.templateFile)
//           : Path.join(__dirname, "../template/index")
//     };
//   } else {
//     defaultSelection = { htmlFile: routeOptions.htmlFile };
//   }

//   const render = (options, templateSelection) => {
//     let selection = templateSelection || defaultSelection;
//     if (templateSelection && !templateSelection.templateFile && !templateSelection.htmlFile) {
//       selection = Object.assign({}, templateSelection, defaultSelection);
//     }
//     const asyncTemplate = initializeTemplate(selection, routeOptions);
//     return asyncTemplate.render(options);
//   };

//   return options => {
//     // if (routeOptions.selectTemplate) {
//     //   const selection = routeOptions.selectTemplate(options.request, routeOptions);

//     //   if (selection && selection.then) {
//     //     return selection.then(x => render(options, x));
//     //   }

//     //   return render(options, selection);
//     // }
//     const templateFile =
//       (routeOptions.templateFile && Path.resolve(routeOptions.templateFile)) ||
//       Path.join(__dirname, "../template/index");

//       function initializeTemplate(
//         { htmlFile, templateFile, tokenHandlers, cacheId, cacheKey, options },
//         routeOptions
//       ) {

//       return asyncTemplate.render(options);
//   };
// }

// function routeRender(srcDir, topOpts) {
//   updateFullTemplate(srcDir, routeOptions);
// }
// export function setupRouteRenderer({ subAppsByPath, srcDir, routeOptions }) {
//   updateFullTemplate(routeOptions.dir, routeOptions);
// }

// var jj = new JsxRenderer({});
