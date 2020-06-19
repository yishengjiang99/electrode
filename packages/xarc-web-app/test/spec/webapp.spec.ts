import * as Path from "path";
import * as Fs from "fs";
import { JsxRenderer, IndexPage, createElement } from "@xarc/jsx-renderer"
import WebApp from './src/web-app'
import Template from "../jsx-templates/test1";
describe("webapp", function() {
webappc  describe("resolveContent", function() {
    it("should require module with relative path", () => {
      const f = "./test/data/foo.js";
      expect(WebApp.resolveContent({ module: f }).content).to.equal("hello");
    });
  )
);