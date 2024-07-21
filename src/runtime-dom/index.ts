import { createRenderer } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, value) {
  const isOn = (key) => /^on[A-Z]/.test(key);
  const getEvent = (event) => event.slice(2).toLowerCase();
  if (isOn(key)) {
    const e = getEvent(key);
    el.addEventListener(e, value);
  } else {
    el.setAttribute(key, value);
  }
}

function insert(el, parent) {
  parent.append(el);
}

const renderer: any = createRenderer({ createElement, patchProp, insert });

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
