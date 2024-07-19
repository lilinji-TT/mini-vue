import { extend } from "../shared";

let activeEffect: ReactiveEffect;
let shouldTrack: boolean;
class ReactiveEffect {
  private _fn: Function;
  deps: any[] = [];
  public scheduler: Function | undefined;
  onStop?: () => void;
  active: boolean = true;

  constructor(fn: Function, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  run() {
    if (!this.active) {
      return this._fn();
    }

    shouldTrack = true;
    activeEffect = this;

    const res = this._fn();
    shouldTrack = false;

    return res;
  }
  stop() {
    if (this.active) {
      cleanUpEffect(this);

      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanUpEffect(effect: ReactiveEffect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });

  effect.deps.length = 0;
}

// WeakMap      Map    Set
// targetMap => key => deps
const targetMap = new WeakMap();

function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}
export function track(target, key) {
  if (!isTracking()) return;

  let depsMap = targetMap.get(target);

  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }

  if (deps.has(activeEffect)) return;
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key);

  for (const effect of deps) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  extend(_effect, options);
  _effect.run();

  const runner: any = _effect.run.bind(_effect);

  runner.effect = _effect;

  return runner;
}

export function stop(runner: any) {
  runner.effect.stop();
}
