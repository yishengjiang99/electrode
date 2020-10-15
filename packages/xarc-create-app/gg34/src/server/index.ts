"use strict";
import * as support from "@xarc/app/support";
import * as electrodeServer from '@xarc/fastify-server';


const config = {
  connection: {
    host: process.env.HOST || "localhost",
    port: parseInt(process.env.APP_SERVER_PORT || process.env.PORT || "3000")
  },
  plugins: {
    "@xarc/app-dev": {
      priority: -1,
      enable: process.env.WEBPACK_DEV === "true"
    },
    "subapp-server": {
      options: {
        cdn: {
          enable: process.env.NODE_ENV === "production"
        }
      }
    }
  }
};

async function start() {
  await support.load();
  await electrodeServer(config);
}

start();
