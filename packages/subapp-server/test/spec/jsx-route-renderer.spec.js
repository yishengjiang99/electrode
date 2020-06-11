const {
  getSrcDir,
  setupRouteRender,
  searchRoutesFromFile
} = require("../../lib/setup-hapi-routes");
const Path = require("path");
const subAppUtil = require("subapp-util");

describe("jsx-router-renderer renders subapp src folders in fastify request handlers", async () => {
  var server;

  server = await require("@xarc/fastify-server")({
    deferStart: true,
    connection: { port: 3002, host: "localhost" }
  });

  const opt = {
    srcDir: Path.join(__dirname, "../data/fastify-plugin-test"),
    loadRoutesFrom: "routes.js",
    stats: Path.join(__dirname, "../data/fastify-plugin-test/stats.json")
  };

  const srcDir = getSrcDir(opt);
  const { routes, topOpts } = searchRoutesFromFile(srcDir, opt);
  const subApps = await subAppUtil.scanSubAppsFromDir(srcDir);
  const subAppsByPath = subAppUtil.getSubAppByPathMap(subApps);

  for (const path in routes) {
    const route = routes[path];
    // const handler = makeRouteHandler(path, route);
    console.log(route, path);
  }

  console.table(routes);
  console.table(topOpts);
  console.table(subAppsByPath);
});
