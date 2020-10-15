import { XarcOptions } from '@xarc/app-dev/config/opt2/xarc-options';

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
  babelOptions: {
    enableTypeScript: true,
    enableFlow: false,
    proposalDecorators: false,
    transformClassProps: false
  }
}
const xrun = require('@xarc/run');
require("@xarc/app")(xrun, xarcOptions);