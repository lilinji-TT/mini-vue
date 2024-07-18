import { track, trigger } from "./effect";
import { ReactiveFlags } from "./reactive";
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
  return function (target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    //TODO: 依赖收集
    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}

function createSetter() {
  return function (target, key, value) {
    const res = Reflect.set(target, key, value);

    // TODO: 触发依赖
    trigger(target, key);
    return res;
  };
}

export const mutableHandlers = {
  get,
  set,
};
export const readOnlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn("Readonly don't support set");
    return true;
  },
};
