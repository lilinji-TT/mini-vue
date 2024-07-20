import { isFunction } from "../shared";
import { ReactiveEffect } from "./effect";

interface ComputedRefImplOptions {
  get: (value: any) => any;
  set: (value: any) => void;
}

type Getter = (value: any) => any;

type CombineType = ComputedRefImplOptions & Getter;
class ComputedRefImpl {
  private _dirty: boolean = true;
  private _value: any;
  private _effect: ReactiveEffect;
  private _setter: (value: any) => void;
  constructor(options: CombineType) {
    let getter;
    let setter;

    if (isFunction(options)) {
      getter = options as Function;
    } else {
      getter = options.get;
      setter = options.set;
    }

    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });

    this._setter = setter;
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
      return this._value;
    }

    return this._value;
  }

  set value(newValue: any) {
    if (this._setter) {
      this._setter(newValue);
      // 标记为dirty以确保重新计算
      this._dirty = true;
    } else {
      console.error("Computed property is read-only.");
      throw new Error("Computed property is read-only.");
    }
  }
}
export function computed(getter) {
  return new ComputedRefImpl(getter);
}
