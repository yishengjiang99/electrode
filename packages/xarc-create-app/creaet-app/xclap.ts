
const xclap = require("@xarc/run") || require("xclap");
const xarcOptions: XarcOptions = {
  host: 'localhost',
  port: 3000,
  appServerPort: 3100,
  adminPort: 8991,
  adminLogLevel: 2,
  httpsPort: null,
  addOnFeatures: {
    "reactLib": "react",
    "karma": true,
    "sass": false,
    "mocha": true
  },
  webpackOptions: {
    webpackDev: true,
    devArtifactsPath: ".etmp",
    cssModuleSupport: true
  },
  babel: {
    enableTypeScript: true,
    enableFlow: false,
    proposalDecorators: false,
    transformClassProps: false
  }
}

require("@xarc/app-dev")(xclap, xarcOptions);

/**
 * configurable options related to transpiler (babel)
 */
export declare type BabelOptions = {
  /**
   * enable support for typescript types using `@babel/preset-typescript`
   *
   * @remarks
   *  transpile only, no type checking
   *
   * - **Default: true**
   * - if not set, then we check env `ENABLE_BABEL_TYPESCRIPT`
   */
  enableTypeScript?: boolean;
  /**
   * Enable support for stripping flow.js types using `@babel/plugin-transform-flow-strip-types`
   *
   * @remarks
   *  transpile only, no type checking
   *
   * - **Default: `false`**
   * - if not set, then we check env `ENABLE_BABEL_FLOW`
   *
   * requireDirective behavior (defaulted to **NOT** required):
   *
   * - When this plugin is enabled, it's defaulted to not require the `@flow` directive in source.
   * - To change this behavior, set this option to `{ requireDirective: true }`
   */
  enableFlow?: boolean | {
    requireDirective: boolean;
  };
  /**
   * Add `@babel/plugin-proposal-decorators`
   * - **Default: `false`**
   * - if not set, then we check env `BABEL_PROPOSAL_DECORATORS`
   *
   * legacyDecorators behavior (default to enabled):
   *
   * - When this plugin is enabled, it's defaulted to legacy decorators behavior.
   * - To change this behavior, set this option to `{ legacy: false }`
   */
  proposalDecorators?: boolean | {
    legacy: boolean;
  };
  /**
   * Add `@babel/plugin-proposal-class-properties` for class properties support
   * - **Default: `false`**
   * - if not set, then we check env `BABEL_CLASS_PROPS`
   *
   * looseClassProps behavior (default to enabled):
   *
   * - When this plugin is enabled, it's defaulted to loose class props setting, which compile to
   *   assignment expression instead of `Object.defineProperty`
   * - To change loose class props behavior, set this option to `{ loose: false }`,
   */
  transformClassProps?: boolean | {
    loose: boolean;
  };
};

/**
 * User configurable options that are related to Webpack
 */
export declare type WebpackOptions = {
  /**
   * Enable webpack dev mode.  **Default: `false`**
   *  - If not set, then will check env `WEBPACK_DEV`
   */
  webpackDev?: boolean;
  /**
   * Host name to use for webpack dev URL.  **Default: `localhost`**
   *  - If not set, then check env `WEBPACK_HOST`, then `WEBPACK_DEV_HOST`, and finally `HOST`
   */
  devHostname?: string;
  /**
   * Port to use for webpack dev URL.  **Default: 2992**
   * - If not set, then check env `WEBPACK_DEV_PORT`
   */
  devPort?: number;
  /**
   * Using a built-in reverse proxy, the webpack dev assets are served from the
   * same host and port as the app.  In that case, the URLs to assets are relative
   * without protocol, host, port.
   *
   * However, user can simulate CDN server with the proxy and have assets URLs
   * specifying different host/port from the app.  To do that, the following
   * should be defined.
   *
   * - If not set, then check env `WEBPACK_DEV_CDN_PROTOCOL`
   */
  cdnProtocol?: string;
  /**
   * Host name to use for CDN simulation, see option `cdnProtocol` for more info.
   *
   * - If not set, then check env `WEBPACK_DEV_CDN_HOST`
   */
  cdnHostname?: string;
  /**
   * Host name to use for CDN simulation, see option `cdnProtocol` for more info.
   *
   * - If not set, then check env `WEBPACK_DEV_CDN_PORT`
   */
  cdnPort?: number;
  /**
   * in dev mode, all webpack output are saved to memory only, but some files like
   * stats.json are needed by different uses and the stats partial saves a copy to
   * disk.  It will use this as the path to save the file.
   * - **Default: `.etmp`**
   * - If not set, then check env `WEBPACK_DEV_ARTIFACTS_PATH`
   */
  devArtifactsPath?: string;
  /**
   * Set to true to explicitly enable CSS module support for all style files
   * - **Default: `undefined` (auto detect)**
   * - If not set, then check env `CSS_MODULE_SUPPORT`
   */
  cssModuleSupport?: boolean;
  /**
   * Enable loading `@babel/polyfill` for application
   * - **Default: `false`**
   */
  enableBabelPolyfill?: boolean;
  /**
   * Enable webpack's NodeSourcePlugin to simulate node.js libs in browser
   * - **Default: `false`**
   * - If not set, then check env `ENABLE_NODESOURCE_PLUGIN`
   * @remarks
   *  This will bundle 100K+ of JavaScript to simulate node.js env
   */
  enableNodeSourcePlugin?: boolean;
  /**
   * Support hot module reload for your web app code
   * - **Default: `true`**
   * - if not set, then we check env `WEBPACK_HOT_MODULE_RELOAD`
   */
  enableHotModuleReload?: boolean;
  /**
   * If hot module reload is enabled, then if you make a change that has error,
   * then an overlay on top of the browser page will show the error.
   * - **Default: `true`**
   * - if not set, then we check env `WEBPACK_DEV_WARNINGS_OVERLAY`
   */
  enableWarningsOverlay?: boolean;
  /**
   * Size limit to prevent inlining woff fonts data
   * - **Default: `1000`**
   * - if not set, then we check env `WOFF_FONT_INLINE_LIMIT`
   */
  woffFontInlineLimit?: number;
  /**
   * https://webpack.js.org/configuration/resolve/#resolve-symlinks
   * - **Default: `false`**
   * - if not set, then we check env `WEBPACK_PRESERVE_SYMLINKS`, then `NODE_PRESERVE_SYMLINKS`
   */
  preserveSymlinks?: boolean;
  /**
   * If CSS module is used, then use a shorten class name for CSS in production mode
   * - **Default: `true`**
   * - if not set, then we check env `ENABLE_SHORTEN_CSS_NAMES`
   */
  enableShortenCSSNames?: boolean;
  /**
   * Code splitting should optimize to minimize the number of JS chunks are generated.
   *
   * **Default: `false`**
   * - if not set, then we check env: `MINIMIZE_SUBAPP_CHUNKS`
   */
  minimizeSubappChunks?: boolean;
  /**
   * Custom options for optimizing critical CSS
   * - if not set, then we check env: `OPTIMIZE_CSS_OPTIONS` (which should be a JSON string)
   * - TBD: define type for it
   */
  optimizeCssOptions?: object;
  /**
   * Custom object with list of webpack DLLs to load
   * - **Default: `{}`**
   * - if not set, then we check env: `ELECTRODE_LOAD_DLLS` (which should be a JSON string)
   * - TBD: define type for it
   */
  loadDlls?: object;
  /**
   * Should webpack minify code output in production mode?
   * - **Default: `true`**
   * - Useful if you want to build production without minifying for debugging
   */
  minify?: boolean;
};

/**
 * Optional features to support
 */
export declare type AddOnFeatures = {
  /** Enable flow.js support? **Default: `false`** */
  flow?: boolean;
  /**
   * Enable xarc's built-in eslint checks
   *  - This is enabled if you add `@xarc/opt-eslint` to your devDependencies
   */
  eslint?: boolean;
  /**
   * Enable support for running function tests with Karma
   * - **Default: `false`**
   * - This is enabled if you add `@xarc/opt-karma` to your devDependencies
   */
  karma?: boolean;
  /**
   * Enable support for running test with jest
   *  - This is enabled if you add `@xarc/opt-jest` to your devDependencies
   */
  jest?: boolean;
  /**
   * Enable support for running tests with mocha
   *  - This is enabled if you add `@xarc/opt-mocha` to your devDependencies
   */
  mocha?: boolean;
  /**
   * Select an implementation of the React UI framework  **Default: `react`**
   */
  reactLib?: "react" | "preact" | "inferno";
  /** Enable support for using TypeScript */
  typescript?: boolean;
  /**
   * Enable support for sass styling
   *  - This is enabled if you add `@xarc/opt-sass` to your devDependencies
   */
  sass?: boolean;
};

export declare type XarcOptions = {
  /**
   * hostname to listen on for serving your application
   *
   * - **Default: `localhost`**
   * - If not set, then check env `HOST`
   */
  host?: string;
  /**
   * port to listen on for serving your application
   *
   * @remarks
   *  This is what the dev proxy listens on.  Your app server
   *  listens on a different port that the proxy forwards to.
   *
   * - **Default: `3000`**
   * - If it's 443, then automatically enable HTTPS.
   * - If not set, then check env `PORT`
   */
  port?: number;
  /**
   * In case you want to serve your app with https on a port other
   * than 443, then you can set it with this.
   *
   * - if not set, then check env `ELECTRODE_DEV_HTTPS`, then `XARC_DEV_HTTPS`
   *
   * @remarks
   * If this is set, it cannot be the same as `port`, which then will be
   * forced to be HTTP only.
   */
  httpsPort?: number;
  /**
   * Port number for your app server to listen on so the dev proxy
   * can forward request to it.
   *
   * - **Default: `3100`**
   * - If not set, then check env `APP_PORT_FOR_PROXY`, then `APP_SERVER_PORT`
   */
  appServerPort?: number;
  /**
   * Dev admin log level
   *
   * - if not set, then check env `ELECTRODE_ADMIN_LOG_LEVEL`, `DEV_ADMIN_LOG_LEVEL`, then `XARC_ADMIN_LOG_LEVEL`
   * - TBD: list levels
   */
  adminLogLevel?: number;
  /**
   * Port number the dev admin listens to serve its pages.
   *
   * - **Default: 8991**
   * - if not set, then check env `ELECTRODE_ADMIN_PORT`
   *
   */
  adminPort?: number;
  /**
   * Additional optional features to enable
   */
  addOnFeatures?: AddOnFeatures;
  /**
   * options related to webpack
   */
  webpackOptions?: WebpackOptions;
  /**
   * options related to babel transpiler
   */
  babel?: BabelOptions;
};
