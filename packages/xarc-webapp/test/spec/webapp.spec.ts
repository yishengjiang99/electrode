import { Component } from "../../src/Component";
import { expect } from "chai";
import { WebApp } from "../../src/WebApp.ts";

describe("@xarc/web-app has a constructor", function () {
  it("must contain dictionar of routeOptions", function () {
    const webapp = new WebApp({});
  });
});
