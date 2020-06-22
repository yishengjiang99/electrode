import React from "react";
import { Container } from "@material-ui/core";

const { useCallback, createRef, useState } = require("react");
const canvasRefs = [createRef(), createRef(), createRef()];
const stageLayer = () => canvasRefs[1].current;

export const UIProps = {
  beats_per_minute: 90, //1.5 bear per second * 3
  resolutionz: 1 / 16,
  width: 720,
  height: 480,
  barWidth: 30,
  pixelPersSecond: 45,
  barHeight: 5,
  gridFromCoord: (x, y) => [
    ~~(y / UIProps.barHeight),
    ~~(x / UIProps.barWidth),
  ],
  toCoord: (bar, noteIndex) => [
    UIProps.barWidth * bar,
    UIProps.barHeight * noteIndex + 5,
  ],
};

export function drawRect(time, noteIndex) {
  var bar = Math.floow(time / UIProps.pixelPersSecond);
  const canvas = stageLayer();
  const ctx = canvas.getContext("2d");
  const [x, y] = UIProps.toCoord(bar, noteIndex);
  ctx.clearRect(x, y, UIProps.barWidth, UIProps.barHeight);
  ctx.fillStyle = "blue";
  ctx.fillRect(x, y, UIProps.barWidth, UIProps.barHeight);
}
const style = {
  width: UIProps.width,
  height: UIProps.height,
  position: "absolute",
  x: 0,
  y: 0,
  backgroundColor: "black",
};

export const EventBusUI = (UIProps) => {
  return (
    <div style={{ position: "relative" }}>
      {[0, 1, 2].map((idx) => (
        <canvas
          onMouseDown={(e) => {
            console.log(e.mouseX, e.mouseY);
          }}
          style={{ ...style, zIndex: idx }}
          ref={canvasRefs[idx]}
        ></canvas>
      ))}
    </div>
  );
};
