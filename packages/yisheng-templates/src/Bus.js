import react from "react";
import Envelope from "./Envelope";
import { genericConfig } from "../components/envelop-config";

export class Bus {
  constructor(ctx, props) {
    const defaults = {
      lfoFreq: 10,
      hpFreq: 30,
      lpFreq: Math.pow(2, 16),
      gain: 1,
      compress: {
        threshold: -60,
        knee: 30,
        ratio: 12,
        attack: 0.1,
        release: 12,
      },
    };
    this.state = {
      ...defaults,
      ...props,
      ctx,
    };

    const { lfoFreq, lpFreq, hpFreq, gain, compress } = this.state;
    this.input = new GainNode(ctx);
    this.output = new GainNode(ctx);
    this.lfo = new OscillatorNode(ctx, {
      frequency: lfoFreq,
      type: "sine",
    });
    this.hpf = new BiquadFilterNode(ctx, {
      frequency: hpFreq,
      type: "highpass",
    });
    this.lpf = new BiquadFilterNode(ctx, {
      frequency: lpFreq,
      type: "lowpass",
    });
    this.lfo.connect(this.output.gain);
    this.compression = new DynamicsCompressorNode(ctx, this.state.compress);
    this.input
      .connect(this.hpf)
      .connect(this.compression)
      .connect(this.lpf)
      .connect(this.output);
  }

  attachSource(sourceNode) {
    sourceNode.connect(this.input);
  }
  connect(output) {
    this.output;
  }
}

export const BusUI = () => {};



class Conductor {
  constructor(prop){
    
  }
  // const BAR_PER_SECOND = 2;
  this.ticker = ticker;
  // const n_cols = 50;
  // const bpm = 120;
  this.trackevents=[];
  // var current_page_bitmap = Array(n_cols).fill(Array(12).fill(0));
  // var page = 0;
  // var start = 0;
  // var current_time = 0;
  // const time_to_bar = (t) => (bpm * 60) / 1000 / BAR_PER_SECOND;
  var activekeys = {};
  console.log("starting conductor");

  window.onmessage = function (e) {
    console.log("window omsg');")
    const { evt, note, time } = e.data;
    if (!time || e.data.relay) return;


    if (evt === "trigger") {
      self.trackevents.push(e.data);
      activekeys[note] = time;
      // current_page_bitmap[ctx.currentTime - ctx.currentTime time_to_bar(time) )]
    } else if (evt === "release") {
      //}.release) {
        self.trackevents.push(e.data);
      activekeys[note] && delete activekeys[note];
    } else {
      this.trackevents.push(e.data);
    }
    window.log("track events "+this.trackevents.length)
    window.postMessage({ ...e.data, relay: 1 });
  };

  //ticker.onload = (e) => ticker.postMessage({ interval: (bpm / 60) * 1000 });
}

Conductor.prototype.playback = function () {
  this.ticker.postMessage("start");
  //and 3 .. 2.. 1?
  const queue = this.trackevents;
  this.ticker.onmessage = function ({ data }) {
    if (data.type === "interval") {
      const now = data.time;

      while (queue.length > 0 && queue[0].time < now + 5) {
        var nextNote = queue[0];
        var note =
          this.piano.adsrs[nextNote.note] || this.piano._getNote(nextNote.note);
        switch (note.eventType) {
          case "trigger":
            console.log("pop event", note);
            note.trigger(now + 0.001);
            break;
          case "hold":
            note.hold(now);
            break;

          case "release":
            note.triggerRelease(now);
            break;
        }
      }
    }
  };
};