import {
  RenderContext,
  TokenModule,
  loadTokenModuleHandler,
  TOKEN_HANDLER,
  TEMPLATE_DIR
} from "@xarc/render-context";
import { expect } from "chai";
import * as SimpleRenderer from "../../src/simple-renderer";

describe("simple renderer", function () {
  it("requires htmlFile in the constructor", function () {
    const simpleRenderer = new SimpleRenderer({
      htmlFile: "../fixtures/dynamic-index-1.html"
    });
  });
});
