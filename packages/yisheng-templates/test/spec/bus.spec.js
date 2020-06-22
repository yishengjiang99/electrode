"use strict";

const { expect } = require("chai");
const EventBus = require("../../src/queue-bus.js");

describe("queue buss", () => {
  var bus = new EventBus();
  it("has a bus stop", function () {
    expect(bus.activeEvents).to.equal(0);

    bus.processNote({
      FROM: "piano",
      trigger: 3,
      time: 2
    });
    expect(bus.activeEvents).to.equal(1);

    bus.processNote({
      FROM: "piano",
      trigger: 3,
      time: 2.2
    });
    expect(bus.activeEvents).to.equal(2);
  });
});
