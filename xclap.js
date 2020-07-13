"use strict";

const assert = require("assert");
const xclap = require("xclap");
const xsh = require("xsh");
const shell = xsh.$;
const exec = xsh.exec;
const fs = require("fs");
const Path = require("path");
const yoTest = require("yeoman-test");
const _ = require("lodash");
const { serial } = require("xclap");

const isWin32 = process.platform.startsWith("win32");
const packagesDir = Path.join(__dirname, "packages");

const removeNpmScope = name => {
  if (name.startsWith("@")) {
    const parts = name.split("/");
    if (parts.length === 2) {
      if (parts[1] === "create-app") {
        return parts[1];
      }
      return parts[0].substr(1) + "-" + parts[1];
    }
  }

  return name;
};

const pullLocalPackages = dir => {
  dir = Path.isAbsolute(dir) ? dir : Path.join(__dirname, dir);
  const localPkgs = [
    "@xarc/app",
    "electrode-react-webapp",
    "electrode-redux-router-engine",
    "electrode-auto-ssr",
    "electrode-cookies",
    "electrode-ui-config",
    "subapp-redux",
    "subapp-server",
    "subapp-web"
  ];
  const localDevPkgs = ["@xarc/app-dev"];
  const localPackagesDir = Path.relative(dir, packagesDir);

  const appPkgFile = Path.join(dir, "package.json");
  const appPkgData = fs.readFileSync(appPkgFile).toString();
  const appPkg = JSON.parse(appPkgData);

  const updateToLocalPkgs = (section, pkgs) => {
    if (appPkg[section]) {
      pkgs.forEach(pkg => {
        if (appPkg[section][pkg]) {
          _.set(
            appPkg,
            ["fyn", section, pkg],
            Path.join(localPackagesDir, removeNpmScope(pkg)).replace(/\\/g, "/")
          );
        }
      });
    }
  };

  updateToLocalPkgs("dependencies", localPkgs);
  updateToLocalPkgs("devDependencies", localDevPkgs);
  fs.writeFileSync(appPkgFile, `${JSON.stringify(appPkg, null, 2)}\n`);

  return appPkgData;
};

const runAppTest = (dir, forceLocal) => {
  const appPkgData =
    (forceLocal || process.env.BUILD_TEST || process.env.CI) && pullLocalPackages(dir);

  const restore = () => {
    if (appPkgData) {
      const appPkgFile = Path.join(dir, "package.json");
      fs.writeFileSync(appPkgFile, appPkgData);
    }
  };

  const localClap = Path.join("node_modules", ".bin", "clap");
  return exec({ cwd: dir }, `fyn --pg simple -q v i && ${localClap} ?fix-generator-eslint`)
    .then(() => exec({ cwd: dir }, `npm test`))
    .then(() => exec({ cwd: dir }, `${localClap} build`));
};

const testCreateApp = async (testDir, name, clean, runTest, prompts) => {
  name = name || "my-app";
  const testAppDir = Path.join(testDir, name);

  if (!clean) {
    shell.mkdir("-p", testAppDir);
  }

  shell.pushd(testAppDir);
  await require("./packages/create-app/src/create")();
  shell.popd();
};

const testGenerator = (testDir, name, clean, runTest, prompts) => {
  name = name || "test-app";
  const yoApp = Path.join(packagesDir, "generator-electrode/generators/app/index.js");
  const defaultPrompts = {
    name,
    description: "test test",
    homepage: "http://test",
    serverType: "HapiJS",
    authorName: "John Smith",
    authorEmail: "john@smith.com",
    authorUrl: "http://www.test.com",
    keywords: ["test", "electrode"],
    pwa: true,
    autoSsr: true,
    createDirectory: false,
    githubAccount: "test",
    license: "Apache-2.0"
  };
  prompts = _.extend({}, defaultPrompts, prompts || {});

  const testAppDir = Path.join(testDir, name);

  if (!clean) {
    shell.mkdir("-p", testAppDir);
  }

  const yoRun = yoTest.run(yoApp);
  return (clean ? yoRun.inDir(testAppDir) : yoRun.cd(testAppDir))
    .withOptions({
      "skip-install": true
    })
    .withPrompts(prompts)
    .then(() => {
      return runTest ? runAppTest(testAppDir, true) : pullLocalPackages(testAppDir);
    });
};

xclap.load({
  ".lerna.coverage":
    "~$lerna run --ignore ignite-core --ignore electrode-ignite --ignore generator-electrode --stream coverage",
  bootstrap: "~$fynpo --ignore ignite-core electrode-ignite generator-electrode electrode-ui-config",
  test: ["bootstrap", ".lerna.coverage", "build-test"],
  "test-generator": [".test-generator --all"],
  "test-create-app": [".test-create-app"],
  "gen-hapi-app": [".test-generator --hapi --no-test"],
  "gen-express-app": [".test-generator --express --no-test"],
  "gen-koa-app": [".test-generator --koa --no-test"],
  "test-demo-component": [
    `~$cd ${Path.join(__dirname, "samples/demo-component")} && fyn --pg none install && npm test`
  ],
  "test-boilerplate": [".test-boilerplate"],
  "test-stylus-sample": [".test-stylus-sample"],
  "update-changelog": ["~$node tools/update-changelog.js"],
  "gitbook-serve": ["~$gitbook serve --no-watch --no-live"],
  "build-test": {
    desc: "Run CI test",
    task: () => {
      process.env.BUILD_TEST = "true";
      process.env.NODE_PRESERVE_SYMLINKS = "1";
      const tasks = ["test-boilerplate", "test-stylus-sample", ".test-jest-sample"];
      let updated;
      return exec("lerna updated")
        .then(output => {
          updated = output.stdout
            .split("\n")
            .filter(x => x.startsWith("- "))
            .map(x => x.substr(2));

          const updatedStr = updated.join(" ");

          // if (updatedStr.indexOf("generator-electrode") >= 0) {
          //   tasks.push("test-generator");
          // }

          if (
            updatedStr.indexOf("electrode-archetype-react-component") >= 0 ||
            updatedStr.indexOf("@xarc/app") >= 0
          ) {
            tasks.push([".", "test-demo-component", ".test-tree-shaking"]);
          }

          return tasks;
        })
        .catch(err => {
          if (err.output.stderr.indexOf("No packages need updating") < 0) {
            throw err;
          }
        });
    }
  },
  ".xarc-clean-build": () => {
    [
      "xarc-render-context",
      "xarc-jsx-renderer",
      "xarc-tag-renderer",
      "xarc-index-page",
      "subapp-server",
      "subapp-web",
      "subapp-react"
    ].forEach(pkg => {
      console.log("installing " + pkg);
      `~$cd ${Path.join(
        __dirname,
        "packages",
        pkg
      )} && rm -rf node_modules && fyn && npm run build && cd ../..`;
    });
  },
  ".clear-ports": () => {
    return exec(
      `lsof -iTCP -sTCP:LISTEN -P -n |grep '2992\|3000\|3100' |awk '{print $2}' | xargs kill -9`
    );
  },
  "run-sample": {
    desc: "compile and run a sample",
    dep: [".xarc-clean-build", ".clear-ports"],
    task: () => {
      const localClap = Path.join("node_modules", ".bin", "clap");
      const dir = `samples/${process.execArgv[2] || "poc-subapp-min-fastify"}`;
      return exec({ cwd: dir }, `fyn --pg simple -q v i && ${localClap} dev`);
    }
  },
  ".build-sample-dll": () => {
    return runAppTest(Path.join(__dirname, "samples/react-vendor-dll"));
  },

  ".test-boilerplate": {
    desc: "Run tests for the boilerplage app universal-react-node",
    dep: [".build-sample-dll"],
    task: () => {
      return runAppTest(Path.join(__dirname, "samples/universal-react-node"));
    }
  },

  ".test-tree-shaking": {
    desc: "Run tests for the demo-tree-shaking sample app",
    task: () => {
      return runAppTest(Path.join(__dirname, "samples/demo-tree-shaking"));
    }
  },

  ".test-stylus-sample": {
    desc: "Run tests for the boilerplage app stylus-sample",
    task: () => {
      return runAppTest(Path.join(__dirname, "samples/stylus-sample"));
    }
  },

  ".test-jest-sample": {
    desc: "Run tests for the boilerplage app react-jest-app",
    task: () => {
      return runAppTest(Path.join(__dirname, "samples/react-jest-app"));
    }
  },

  "samples-local": {
    desc: "modify all samples to pull electrode packages from local",
    task: () => {
      [
        "electrode-demo-index",
        "stylus-sample",
        "universal-material-ui",
        "universal-react-node",
        "react-jest-app"
      ].forEach(a => {
        pullLocalPackages(Path.join(__dirname, "samples", a));
      });
    }
  },

  ".test-create-app": {
    async task() {
      const testDir = Path.join(__dirname, "tmp");
      await testCreateApp(testDir, "my-app");
      const testAppDir = Path.join(testDir, "my-app");
      pullLocalPackages(testAppDir);
    }
  },

  ".test-generator": {
    desc: "Run tests for the yeoman generators",
    task() {
      const all = this.argv.length < 2 || this.argv.indexOf("--all") >= 0;
      const express = all || this.argv.indexOf("--express") >= 0;
      const hapi = all || this.argv.indexOf("--hapi") >= 0;
      const koa = all || this.argv.indexOf("--koa") >= 0;
      const runTest = this.argv.indexOf("--no-test") < 0;
      const clean = this.argv.indexOf("--no-clean") < 0;
      const testDir = Path.join(__dirname, "tmp");

      return Promise.resolve(
        hapi && testGenerator(testDir, "hapi-app", clean, runTest, { serverType: "HapiJS" })
      )
        .then(
          () =>
            express &&
            testGenerator(testDir, "express-app", clean && !hapi, runTest, {
              serverType: "ExpressJS"
            })
        )
        .then(
          () =>
            koa &&
            testGenerator(testDir, "koa-app", clean && !hapi && !express, runTest, {
              serverType: "KoaJS"
            })
        )
        .then(() => undefined);
    }
  }
});
