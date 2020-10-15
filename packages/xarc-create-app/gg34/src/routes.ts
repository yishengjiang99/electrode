const isDocker = require("is-docker");
export const favicon = isDocker()
  ? "dist/static/favicon.png"
  : "static/favicon.png";

export default {
  "/": {
    pageTitle: "Welcome to Electrode",
    subApps: [["./home", { serverSideRendering: false }], "./demo1", "./demo2"]
  }
};
