import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  private _rawValue: any;
  public deps: Set<any>;
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

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.deps);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
