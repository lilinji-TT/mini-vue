import { extend } from "../shared";

let activeEffect: ReactiveEffect;
let shouldTrack: boolean;
export class ReactiveEffect {
  private _fn: Function;
  deps: Set<any>[] = [];
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

// WeakMap => obj      Map => key    Set => fn (effect)
// targetMap      =>   key      =>   deps
const targetMap = new WeakMap();

export function isTracking() {
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
  trackEffects(deps);
}

export function trackEffects(deps) {
  // 记录数据对应那些副作用函数，后续trigger时方便触发这些effect重新执行
  deps.add(activeEffect);
  // 记录副作用函数与deps之间的关系，后续stop掉effct的时候，需要从所有它之前注册过的 deps 集合中移除自己
  // 也就是我（effect）不在有用了，我就需要通知之前引用我的人（deps里记录了effect）我们一刀两断了！
  activeEffect.deps.push(deps);
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key);

  triggerEffects(deps);
}

export function triggerEffects(deps) {
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
