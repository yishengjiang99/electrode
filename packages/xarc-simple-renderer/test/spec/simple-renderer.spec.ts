import {
  RenderContext,
  TokenModule,
  loadTokenModuleHandler,
  TOKEN_HANDLER,
  TEMPLATE_DIR
} from "@xarc/render-context";
import { expect } from "chai";
import { SimpleRenderer } from "../../src/simple-renderer";
// const { SimpleRenderer } = require("../../src/simple-renderer");
describe("simple renderer", function () {
  let output = "";

  afterEach(function () {
    output = "";
  });

  it("requires htmlFile in the constructor", function () {
    const renderer = new SimpleRenderer({
      htmlFile: "./test/data/template1.html",
      tokenHandlers: "./test/fixtures/token-handler",
      routeOptions: {}
    });
    expect(renderer._tokens[0].str).to.equal("<html>\n\n<head>");
    expect(renderer._tokens[1].id).to.equal("ssr-content");
    expect(renderer._tokens[2].isModule).to.be.false;

    let intercept;

    afterEach(() => {
      if (intercept) {
        intercept.restore();
      }
      intercept = undefined;
    });
    const expected = [
      { str: "<html>\n\n<head>" },
      {
        id: "ssr-content",
        isModule: false,
        pos: 17,
        custom: undefined,
        wantsNext: undefined,
        props: {}
      },
      {
        id: "webapp-header-bundles",
        isModule: false,
        pos: 41,
        custom: undefined,
        wantsNext: undefined,
        props: {}
      },
      {
        id: "webapp-body-bundles",
        isModule: false,
        pos: 75,
        custom: undefined,
        wantsNext: undefined,
        props: {}
      },
      {
        id: "page-title",
        isModule: false,
        pos: 107,
        custom: undefined,
        wantsNext: undefined,
        props: {}
      },
      {
        id: "prefetch-bundles",
        isModule: false,
        pos: 130,
        custom: undefined,
        wantsNext: undefined,
        props: {}
      },
      { str: `<script>\n    console.log("test")\n  </script>` },
      {
        id: "meta-tags",
        isModule: false,
        pos: 206,
        custom: undefined,
        wantsNext: undefined,
        props: {}
      },
      {
        id: "#critical-css",
        isModule: true,
        modPath: "critical-css",
        pos: 228,
        custom: undefined,
        wantsNext: false,
        props: {}
      },
      { str: "</head>\n\n</html>" }
    ];
    const criticalCssToken = renderer._tokens[8];
    expect(criticalCssToken.custom.process()).to.equal(
      `\ntoken process module critical-css not found\n`
    );
    expect(renderer.tokens).to.deep.equal(expected);
  });
});
