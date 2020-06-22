/* eslint-disable no-debugger */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import Envelope from "./envelope.js";
const keys = ["z", "a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
const blackKeys = ["w, e, t, y, u"];
const notes = [
  1,
  261.63,
  277.18,
  293.66,
  311.13,
  329.63,
  349.23,
  369.99,
  392,
  415.3,
  440,
  466.16,
  493.88,
];
const isblack = (key) => ["w", "e", "t", "y", "u"].indexOf(key) >= 0;

const freqmultiplierindex = [0, 0.25, 0.5, 1, 2, 4];
const css = `:host{box-sizing:border-box;} 
ul{
  height:12em;
  position:relative;
  border:1px solid #160801;
  border-radius:1em;
  background-color:black
  max-width:100em;
} 
li {margin:0;padding:0;list-style:none;position:relative;float:left} 
ul .white{height:12em;width:2.9em;z-index:1;border-left:1px solid #bbb;border-bottom:1px solid #bbb;border-radius:0 0 5px 5px;box-shadow:-1px 0 0 rgba(255,255,255,.8) inset,0 0 5px #ccc inset,0 0 3px rgba(0,0,0,.2);background:linear-gradient(to bottom,#eee 0,#fff 100%);margin:0 0 0 -1em}
ul .white:active{border-top:1px solid #777;border-left:1px solid #999;border-bottom:1px solid #999;box-shadow:2px 0 3px rgba(0,0,0,.1) inset,-5px 5px 20px rgba(0,0,0,.2) inset,0 0 3px rgba(0,0,0,.2);background:linear-gradient(to bottom,#fff 0,#e9e9e9 100%)}
ul .white.pressed{border-top:1px solid #777;border-left:1px solid #999;border-bottom:1px solid #999;box-shadow:2px 0 3px rgba(0,0,0,.1) inset,-5px 5px 20px rgba(0,0,0,.2) inset,0 0 3px rgba(0,0,0,.2);background:linear-gradient(to bottom,#fff 0,#e9e9e9 100%)}
.black {height:8em;width:2em;margin:0 0 0 -1em;z-index:2;border:1px solid #000;border-radius:0 0 3px 3px;box-shadow:-1px -1px 2px rgba(255,255,255,.2) inset,0 -5px 2px 3px rgba(0,0,0,.6) inset,0 2px 4px rgba(0,0,0,.5);background:linear-gradient(45deg,#222 0,#555 100%)}
.black:active {box-shadow:-1px -1px 2px rgba(255,255,255,.2) inset,0 -2px 2px 3px rgba(0,0,0,.6) inset,0 1px 2px rgba(0,0,0,.5);background:linear-gradient(to right,#444 0,#222 100%)}.a,.c,.d,.f,.g{margin:0 0 0 -1em}ul li:first-child{border-radius:5px 0 5px 5px}ul li:last-child{border-radius:0 5px 5px 5px}
.black.pressed {box-shadow:-1px -1px 2px rgba(255,255,255,.2) inset,0 -2px 2px 3px rgba(0,0,0,.6) inset,0 1px 2px rgba(0,0,0,.5);background:linear-gradient(to right,#444 0,#222 100%)}.a,.c,.d,.f,.g{margin:0 0 0 -1em}ul li:first-child{border-radius:5px 0 5px 5px}ul li:last-child{border-radius:0 5px 5px 5px}`;

export class PianoKeyboard extends HTMLElement {
  static get attack() {
    return this.getAttribute("attack");
  }
  static set attack(val) {
    this.setAttribute("attack", val);
  }

  static get observedAttributes() {
    return [
      "attack",
      "release",
      "decay",
      "sustain",
      "params",
      "waveshaper",
      "trackDispatch",
    ];
  }

  constructor() {
    super();
    this.ctx = window.gctx;
    this.adsr = {
      attack: 0.02,
      decay: 0.04,
      sustain: 0.4,
      release: 0.5, //0.01
    };
    this.params = {
      min: 0,
      max: 1,
      octave: 3,
    };

    this.waveshaper = null;
    this.keyDomelements = {};
    this.cached = {};
    this.initialized = false;
    function _key(note, key) {
      return `<li
      id='${note}' 
      data-note='${note}' 
      class="${isblack(key) ? "black" : "white"}"> ${key}</li>`;
    }
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>${css}</style>
    <div id=rx></div>`;
    const list = document.createElement("ul");
    [2, 3, 4].forEach((octave) => {
      keys.forEach((key, index) => {
        list.innerHTML += _key(notes[index] * freqmultiplierindex[octave], key);
      });
    });
    this.shadowRoot.appendChild(list);

    this.rx = this.shadowRoot.getElementById("rx");
  }

  connectedCallback() {
    var self = this;

    this.shadowRoot.querySelectorAll("li").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        if (!e.target.dataset.note) return false;
        playNote(note);
      });

      el.addEventListener("mouseup", (e) => {
        const note = parseFloat(e.target.dataset.note);
        releaseNote(note);
      });
    });
    window.onkeydown = this._onkeydown.bind(this);
    window.onkeyup = this._onkeyup.bind(this);
  }
  async _onkeydown(e) {
    if (!this.ctx) {
      this.ctx = await new AudioContext();
    }
    if (e.isComposing) return false;
    const index = keys.indexOf(e.key);

    if (index < 0) return;
    let self = this;
    const note = notes[index];
    this.shadowRoot.getElementById(note).classList.toggle("pressed");
    if (!this.adsrs[index]) {
      this.adsrs[index] = this._getNote(note);
    }
    if (e.repeat) {
      window.postMessage({
        from: "piano",
        time: this.ctx.currentTime,
        type: "hold",
        noteIndex: index,
      });

      // this.adsrs[index].hold(this.ctx.currentTime);
    } else {
      this.adsrs[index].trigger(this.ctx.currentTime);
      window.postMessage({
        from: "piano",
        time: this.ctx.currentTime,
        type: "trigger",
        noteIndex: index,
      });
    }
  }
  _onkeyup(e) {
    const index = keys.indexOf(e.key);
    if (index > -1) {
      const note = notes[index];
      if (this.adsrs[index])
        this.adsrs[index].triggerRelease(this.ctx.currentTime);
      this.shadowRoot.getElementById(note).classList.toggle("pressed");

      window.postMessage({
        from: "piano",
        time: this.ctx.currentTime,
        type: "release",
        noteIndex: index,
      });
    }
  }

  attributeChangedCallback(name, oldval, newval) {
    if (oldval === newval) return;
    switch (name) {
      case "attack":
      case "decay":
      case "sustain":
      case "release":
        this.adsr[name] = parseFloat(newval);
        this.rx.innerHTML = JSON.stringify(this.adsr, null, "1");
        this.adsrs = {};

        break;
      default:
        break;
    }
  }

  render() {
    return `<ul>
      ${keys.map(
        (value, index) =>
          `<li data-note='${notes[index]}' class="${
            isblack(value) ? "black" : "white"
          }"></li>`
      )}
      </ul>
      
      <div id=debug>${Object.values(this.adsrs).map((env) =>
        [attack, decay, release, sustain].join(",")
      )}</div>
      `;
  }

  _getNote(note) {
    let ctx = this.ctx;
    this.masterGain = this.masterGain || new GainNode(this.ctx);
    this.masterGain
      .connect(new DynamicsCompressorNode(ctx, { threshold: -80 }))
      .connect(ctx.destination);
    const { attack, decay, sustain, release } = this.adsr;
    const { min, max } = this.params;
    var freq_multiplier = freqmultiplierindex[this.params.octave];

    var offfreq_attenuator = new GainNode(ctx, { gain: 0.5 });
    var osc1 = ctx.createOscillator();

    osc1.frequency.value = note * freq_multiplier;
    osc1.type = "square";

    var osc2 = ctx.createOscillator();
    osc2.frequency.value = note * freq_multiplier * 2;
    osc2.type = "sine";

    var gain = new GainNode(ctx, { gain: 0 });

    if (this.waveShaper) {
      osc1.setPeriodicWave(this.waveShaper);
      osc2.setPeriodicWave(this.waveshaper);
    }
    osc1.connect(gain);
    osc2.connect(offfreq_attenuator).connect(gain);
    var gainEnvelope = new Envelope(attack, decay, sustain, release, gain.gain);
    osc1.start(0);
    osc2.start(0);

    gain.connect(this.masterGain);

    return gainEnvelope;
  }
}

window.customElements.define("piano-keyboard", PianoKeyboard);
