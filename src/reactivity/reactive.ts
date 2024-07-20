import { isObject } from "../shared/index";
import {
  mutableHandlers,
  readOnlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandler";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadOnly",
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObject(raw, readOnlyHandlers);
}

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}
export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

function createActiveObject(raw: any, baseHandler) {
  if (!isObject(raw)) {
    console.warn(`You must provide an object to create proxy, now: ${raw}`);
    return raw;
  }

  return new Proxy(raw, baseHandler);
}
