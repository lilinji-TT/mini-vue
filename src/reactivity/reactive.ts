import { mutableHandlers, readOnlyHandlers } from "./baseHandler";

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObject(raw, readOnlyHandlers);
}

function createActiveObject(raw: any, baseHandler) {
  return new Proxy(raw, baseHandler);
}
