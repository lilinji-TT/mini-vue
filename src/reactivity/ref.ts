import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

/**
 * 针对基于proxy来实现响应式系统的依赖追踪，ref定位是接收一个具体的值也就是 1 "1" true 这种，但是proxy代理
 * 针对的是对象，所以需要包一层，然后使用.value的方式来匹配Proxy
 */
class RefImpl {
  private _value: any;
  private _rawValue: any;
  public deps: Set<any>;
  public __v_isRef = true;
  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
    this.deps = new Set();
  }

  get value() {
    trackRefValue(this);

    return this._value;
  }

  set value(value) {
    if (hasChanged(this._rawValue, value)) {
      this._rawValue = value;
      this._value = convert(value);
      triggerEffects(this.deps);
    }
  }
}

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.deps);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
