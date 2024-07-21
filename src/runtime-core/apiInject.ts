import { hasProperty, isFunction } from "../shared/index";
import { getCurrentInstance } from "./component";

export function provide(key, value) {
  const currentInstance = getCurrentInstance();

  if (currentInstance) {
    let { provides, parent } = currentInstance;

    // 如果当前组件没有父组件（即为根组件）
    if (parent) {
      const parentProvides = parent.provides;

      // 如果provides与父组件的相同，则创建一个新的对象，并将父组件的provides作为其原型
      if (provides === parentProvides) {
        provides = currentInstance.provides = Object.create(parentProvides);
      }
    }

    // 设置provide的值
    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  const currentInstance = getCurrentInstance();

  if (currentInstance) {
    const { parent } = getCurrentInstance();
    const parentProviders = parent.provides;

    if (hasProperty(parentProviders, key)) {
      return parentProviders[key];
    } else if (defaultValue) {
      if (isFunction(defaultValue)) {
        return defaultValue();
      }
      return defaultValue;
    }
  }

  return null;
}
