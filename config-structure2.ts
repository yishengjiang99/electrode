export type XarcUserConfigs = {
  /* Optional features that user select */
  optionalFeatures: {
    flow?: boolean;
    eslint?: boolean;
    karma?: boolean;
    jest?: boolean;
    mocha?: boolean;
    reactLib?: "react" | "preact";
    typescript?: boolean;
    sass?: boolean;
    /* file path for custom configuration file */
    configPaths?: {
      babel?: string;
      eslint?: string;
      karma?: string;
      mocha?: string;
      webpack?: string;
      jest?: string;
    };
  },
  webpack?: { 
    /* Webpack dev-sever configuration */
    webpackDev?: boolean;
    devHostname?: string;
    devPort?: number;
    cdnProtocol?: string;
    cdnHostname?: string;
    cdnPort?: number;
 
    devArtifactsPath?: string;
    cssModuleSupport?: boolean;
    enableBabelPolyfill?: boolean;
    enableNodeSourcePlugin?: boolean;
    enableHotModuleReload?: boolean;
    enableWarningsOverlay?: boolean;
    woffFontInlineLimit?: number;
    preserveSymlinks?: boolean;
    enableShortenCSSNames?: boolean;
    minimizeSubappChunks?: boolean;
    optimizeCssOptions?: {
      zindex: boolean;
    };
    loadDlls?: {};
    minify?: boolean;
  },
  babel?: {
    enableTypeScript?: boolean;
    enableDynamicImport?: boolean;
    enableFlow?: boolean;
    flowRequireDirective?: boolean;
    proposalDecorators?: boolean;
    legacyDecorators?: boolean;
    transformClassProps?: boolean;
    looseClassProps?: boolean;
    envTargets?: {
      default?: {};
      node?: {};
    };
    target?: string;
    extendLoader?: {};
  },
  karma?: {
    browser: AutomatedBrowsers;
  },
  AppMode:{
    lib: {
      dir: string;
      client: string;
      server: string;
    };
    src: {
      dir: string;
      client: string;
      server: string;
    };
  },
  createXarcOptions:{
    enableCssModule?: boolean;
    electrodePackages?: string[];
    electrodePackagesDev?: string[];
    enableFeatures?: boolean;
    assertNoGulpExecution?: boolean;
    assertDevArchetypePresent?: boolean;
  },
  additionalProcessEnvVariables: {
      KARMA_BROWSER?: AutomatedBrowsers;
      SERVER_ES6?: boolean;
      ELECTRODE_DEV_OPEN_BROWSER?: boolean;
      _ELECTRODE_DEV_?: boolean;
      STATIC_FILES?: boolean;
      ENABLE_KARMA_COV?: boolean;
      NODE_ENV?: string;
      WEBPACK_DEV?: boolean;
      HOST?: string;
      PORT?: number;
    }
};

export type AutomatedBrowsers =
  | "Chrome"
  | "ChromeCanary"
  | "ChromeHeadless"
  | "PhantomJS"
  | "Firefox"
  | "Opera"
  | "IE"
  | "Safari";
