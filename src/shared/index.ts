export const extend = Object.assign;

export const isObject = (value) => {
  return value !== null && typeof value === "object";
};

export const isFunction = (val) => {
  return Object.prototype.toString.call(val) === "[object Function]";
};

export const hasChanged = (oldValue, newValue) => {
  return !Object.is(oldValue, newValue);
};
