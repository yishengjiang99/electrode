import { expect } from "chai";
const xstdout = require("xstdout");
import { describe } from "mocha";
import * as Path from "path";
import { Webapp } from "../../src/index";
console.log(Webapp);
describe("resolveContent", function () {
  it("should require module with relative path", () => {
    const f = "./test/data/foo.js";
    expect(Webapp.resolveContent({ module: f }).content).to.equal("hello");
  });

  it("should log error if resolving content fail", () => {
    const intercept = xstdout.intercept(true);
    const f = "./test/data/bad-content.js";
    const content = Webapp.resolveContent({ module: f });
    intercept.restore();
    expect(content.content).includes("test/data/bad-content.js failed");
    expect(intercept.stderr.join("")).includes("Error: Cannot find module 'foo-blah'");
  });
  it("should require module", () => {
    let mod;
    const fooRequire = x => (mod = x);
    fooRequire.resolve = x => x;
    const f = "test";
    const content = Webapp.resolveContent({ module: f }, fooRequire);
    expect(content.content).to.equal(f);
    expect(content.fullPath).to.equal(f);
    expect(mod).to.equal(f);
  });
  it("should require module", () => {
    let mod;
    const fooRequire = x => (mod = x);
    fooRequire.resolve = x => x;
    const f = "test";
    const content = Webapp.resolveContent({ module: f }, fooRequire);
    expect(content.content).to.equal(f);
    expect(content.fullPath).to.equal(f);
    expect(mod).to.equal(f);
  });
});

describe("makeRouteHandler", () => {
  it("should not add default handler if it's already included in options", () => {
    const htmlFile = Path.resolve("nano");
    const defaultReactHandler = Path.join(__dirname, "../../src/react/token-handlers");
    const intercept = xstdout.intercept(false);
    const handleRoute = Webapp.makeRouteHandler({
      htmlFile,
      tokenHandlers: [
        {
          name: "internal-test-handler",
          beforeRender: context => {
            console.log(context);
            debugger;
            expect(typeof context).to.equal("undefined");
            context.handleError = () => {};
          },
          afterRender: context => {
            expect(context.user, "should have context.user").to.not.equal(false);
          },
          tokens: {
            "internal-test": () => "\ninternal-test",
            "test-not-found": () => "\nnot found",
            "non-func-token": ""
          }
        },
        defaultReactHandler
      ],
      __internals: { assets: {}, chunkSelector: () => ({}) }
    });

    const promise = handleRoute({ request: {}, content: { status: 200, html: "" } });

    return promise
      .then(context => {
        intercept.restore();
        const expected = `
from wants next module
from async ok module
from async error module
from string only module
internal-test
from async error module
from wants next module
not found
from string only module
from async ok module`;
        expect(context.result).to.equal(expected);
      })
      .catch(err => {
        intercept.restore();
        throw err;
      });
  });
});
