/* eslint-disable no-unreachable */
/* eslint-disable no-case-declarations */
import { createContext, useContext, useReducer, useState, useEffect } from "react";
export const notes = [
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
  493.88
];
export const beats_per_page = 30;

export const initialState = {
  events: [],
  bar: 0,
  page: 0,
  isPlaying: false,
  bpm: 120,
  sequenceStart: 0,
  lastEvent: null,
  bitmap: new Uint16Array(beats_per_page)
};

const _events = [];

export const trackReducer = (state, action) => {
  switch (action.type) {
    case "trigger":
      var bitmap = state.bitmap;
      const page = state.bar >= beats_per_page - 1 ? state.page + 1 : state.page;
      const bar = state.bar >= beats_per_page - 1 ? 0 : state.bar + 1;
      bitmap[bar] |= 1 << action.noteIndex;
      return {
        ...state,
        bitmap,
        page,
        bar
      };
      break;

    // case "hold":
    // activeNotes || 1 << action.noteIndex;
    // return state;

    // case "release":
    // const timeOn = activeNotes[action.noteIndex];
    // break;
    case "set_var":
      return {
        ...state,
        [action.varname]: action.payload
      };
    default:
      return state;
  }
};
