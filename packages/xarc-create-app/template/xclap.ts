
import { XarcOptions } from "@xarc/app-dev";
const xclap = require("@xarc/run") || require("xclap")

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