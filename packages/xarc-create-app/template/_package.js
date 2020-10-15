"use strict";

module.exports = (base, merge) => {
  const pkg = {
    name: "my-x-app",
    version: "0.0.1",
    description: "Web application using Electrode X",
    homepage: "",
    scripts: {
      dev: "clap -q dev",
      test: "echo 'ok'",
      "cp-static": "shx cp -r static/ dist/static/",
      build: "clap -n -s electrode/build cp-static",
      start: "node lib/server"
    },
    author: {
      name: "",
      email: "",
      url: ""
    },
    contributors: [],
    main: "lib/server/index.js",
    keywords: ["electrode", "web"],
    repository: {
      type: "git",
      url: ""
    },
    license: "UNLICENSED",
    engines: {
      node: ">= 10",
      npm: ">= 6"
    },
    dependencies: {
      "@xarc/app": "^8.1.16",
      "@xarc/fastify-server": "^2.0.0",
      "react-dom": "^16.13.1",
      "react-redux": "^7.2.0",
      "subapp-react": "^0.0.23",
      "subapp-redux": "^1.0.32",
      "subapp-server": "^1.3.1",
      react: "^16.13.1",
      redux: "^4.0.5",
      shx: "^0.3.2"
    },
    devDependencies: {
      "@xarc/app-dev": "^8.1.16"
    }
  };

  return merge({}, base, pkg);
};
