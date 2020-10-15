"use strict";

const Path = require("path");
const pkg = require("../package.json");
const optionalRequire = require("optional-require")(require);
const constants = require("./constants");
const utils = require("../lib/utils");
require("../typedef");

function checkOptArchetypeInAppDep(dependencies, isDev) {
  const options = dependencies
    .filter(x => x.startsWith("electrode-archetype-opt-"))
    .reduce((acc, name) => {
      //
      // In dev mode, when all dev deps are installed, we can safely load
      // opt packages and find the feature flag name to enable.
      //
      // In production mode, dep could've been pruned for prod, and dev only
      // opt packages would not even exist.
      // note 1: we don't expect dev only opt packages to have any effect
      //   in production runs.
      //
      const optPkg = optionalRequire(name, {
        notFound(err) {
          //
          // if in dev mode, or if in production but looking for
          //  opt pkg _not_ within devDependencies:
          // then always expect opt pkg to be installed.
          //
          if (process.env._ELECTRODE_DEV_ || (process.env.NODE_ENV === "production" && !isDev)) {
            throw err;
          }
        }
      });

      if (optPkg) {
        const optPkgFlag = optPkg();
        if (optPkgFlag.pass) {
          acc[optPkgFlag.optionalTagName] = optPkgFlag.expectTag;
        }
      }
      return acc;
    }, {});

  return { options };
}

const getUserConfigOptions = (packageNames, devPackageNames) =>
  Object.assign(
    { reactLib: "react", karma: true, sass: false, options: {} },
    optionalRequire(Path.resolve("archetype/config"), { default: {} }).options,
    //
    // Check for any optional archetype in application's devDependencies or dependencies
    //
    checkOptArchetypeInAppDep(devPackageNames, true).options,
    checkOptArchetypeInAppDep(packageNames).options
  );

/**
 * @param {CreateXarcOptions} createXarcOptions - configure default archetype options
 * @returns {object} options
 */
function getDefaultArchetypeOptions(createXarcOptions) {
  const appPkg = optionalRequire(Path.resolve("package.json")) || {
    dependencies: {},
    devDependencies: {}
  };
  const packageNames = [
    ...Object.keys(appPkg.dependencies),
    ...createXarcOptions.electrodePackages
  ];
  const devPackageNames = [
    ...Object.keys(appPkg.devDependencies),
    ...createXarcOptions.electrodePackagesDev
  ];

  return {
    dir: Path.resolve(__dirname, ".."),
    pkg,
    options: getUserConfigOptions(packageNames, devPackageNames),
    prodDir: constants.PROD_DIR,
    eTmpDir: constants.ETMP_DIR,
    prodModulesDir: Path.join(constants.PROD_DIR, "modules"),
    checkUserBabelRc: utils.checkUserBabelRc,
    devArchetypeName: "@xarc/app-dev"
  };
}

module.exports = {
  checkOptArchetypeInAppDep,
  getUserConfigOptions,
  getDefaultArchetypeOptions
};
