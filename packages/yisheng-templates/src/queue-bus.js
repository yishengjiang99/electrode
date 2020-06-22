import { PriorityQueue } from "./priority-queue";
import { EventBusUI, canvasRefs, UIProps, drawRect } from "./queue-bus-ui";

export function EventBus(opts) {
  let activeEvents = {};
  let closedEvents = [];
  let eventStart;
  let playbackStart;
  let lastNoteTime = null;
  let currentBar = 0;
  let rx1 = [];
  const options = {
    ...opts,
    output: (eventData) =>
      window.postMessage({ from: "qbus", data: eventData }),
    listen: () => {
      window.onmessage = (e) => processNote(e.data);
    },
    logs: (str) => {
      rx1.push(str);
    },
  };

  function processNote(data) {
    if (data.to != "qbus" && data.FROM !== "piano") return true;
    const { type, note, time } = data;
    switch (type) {
      case "trigger":
        openEvent(note, time);
        break;
      case "hold":
        sustainEvent(note, time);
        break;
    }
  }
  function openEvent(note, time) {
    let event = {
      note: note,
      open: time,
      hold: [],
      close: null,
      relativeDistance: function () {
        this.open - eventStart - (new Date().getTime() / 1000 - playbackStart);
      },
    };
    activeEvents[note] = event;
    drawRect(event.open, note);
    if (!eventStart) eventStart = event.time;
    return event;
  }
  function sustainEvent(note, time) {
    const evt = activeEvents[note];
    evt.hold.push(time);
  }
  function closeEvent(note, time) {
    const evt = activeEvents[note];
    evt.close = time;
    delete activeEvents[note];
    closedEvents.push(evt);
  }
  let queue = PriorityQueue((a, b) => a.time < b.time);
  return {
    activeEvents,
    closedEvents,
    playback: function (output) {
      closedEvents.forEach((event) => {
        queue.push({ note: event.note, time: event.open, type: "trigger" });
        event.hold.forEach((holdtime) => {
          queue.push({ note: event.note, time: holdtime, type: "hold" });
        });
        queue.push({
          note: event.note,
          time: event.close,
          type: "triggerReleaser",
        });
      });

      this.playbackStart = new Date();

      function loop() {
        while (!queue.empty() && queue.data[0].relativeTime() < 0.05) {
          let nexty = queue.pop();
          output(nexty);
        }
        if (queue.empty()) {
          return;
        }
        requestAnimationFrame(loop);
      }
      loop();
    },
    reactComponent: React.createComponent("QueueBusUI"),
  };
}
