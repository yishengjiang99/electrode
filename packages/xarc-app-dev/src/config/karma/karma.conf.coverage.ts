/* eslint-disable @typescript-eslint/no-var-requires */
export {};

process.env.KARMA_RUN_TYPE = "coverage";

/*
 * Karma Configuration: "coverage" version.
 *
 * This configuration is the same as basic one-shot version, just with coverage.
 */
const karmaConf = require("./karma.conf");
const loadUserConfig = require("./util/load-user-config");
const Path = require("path");
const customCheck = require("@xarc/webpack/lib/util/custom-check");
const webpackCovCfg = require(customCheck.getWebpackStartConfig(
  "../webpack/webpack.config.coverage",
  false
));

module.exports = function(config) {
  karmaConf(config);
  const settings = {
    reporters: ["spec", "sonarqubeUnit", "coverage"],
    webpack: webpackCovCfg,
    coverageReporter: {
      reporters: [
        { type: "json", subdir: ".", file: "coverage.json" },
        { type: "lcov", subdir: "." },
        { type: "text", subdir: "." }
      ],
      dir: Path.resolve("coverage", "client")
    },
    sonarQubeUnitReporter: {
      sonarQubeVersion: "5.x",
      outputFile: "gunit.xml",
      outputDir: Path.resolve("coverage", "client"),
      useBrowserName: false
    }
  };

  loadUserConfig(Path.basename(__filename), config, settings);
};
