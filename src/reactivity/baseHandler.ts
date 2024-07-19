import { extend, isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function (target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    if (shallow) return res;

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

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
  set() {
    console.warn("Readonly don't support set");
    return true;
  },
};

export const shallowReadonlyHandlers = extend({}, readOnlyHandlers, {
  get: shallowReadonlyGet,
});
