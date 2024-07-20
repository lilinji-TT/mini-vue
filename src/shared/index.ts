export const extend = Object.assign;

export const isObject = (value) => {
  return value !== null && typeof value === "object";
};

export const isFunction = (val) => {
  return Object.prototype.toString.call(val) === "[object Function]";
};

export const isArray = Array.isArray;

export const hasChanged = (oldValue, newValue) => {
  return !Object.is(oldValue, newValue);
};

export const hasOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target, key);

export const camelize = (str: string) =>
  str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : "";
  });

export const capitallize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const toHandleKey = (str: string) =>
  str ? `on${capitallize(str)}` : "";
