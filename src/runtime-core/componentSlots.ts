import { hasOwn, isArray } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
  const { vnode } = instance;

  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

export function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    if (hasOwn(children, key)) {
      const value = children[key];
      slots[key] = (props) => normalizeSlotValue(value(props));
    }
  }
}

function normalizeSlotValue(value) {
  return isArray(value) ? value : [value];
}
