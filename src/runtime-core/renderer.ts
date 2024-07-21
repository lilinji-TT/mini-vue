import { hasOwn } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
  patch(vnode, container);
}

export function patch(vnode, container) {
  const { type, shapeFlag } = vnode;
  switch (type) {
    case Fragment:
      processFragment(vnode, container);
      break;
    case Text:
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
      }
  }
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(initialVNode: any, container) {
  const instance = createComponentInstance(initialVNode);
  setupComponent(instance);
  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);

  patch(subTree, container);

  // 处理 element 完成，得到实例对应的 el 在 subTree 上，赋值给 vnode.el
  initialVNode.el = subTree.el;
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type));
  const { children, props, shapeFlag } = vnode;

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRARY_CHILDREN) {
    mountChildren(vnode, el);
  }

  const isOn = (key) => /^on[A-Z]/.test(key);
  const getEvent = (event) => event.slice(2).toLowerCase();
  for (const key in props) {
    if (hasOwn(props, key)) {
      const value = props[key];

      if (isOn(key)) {
        const e = getEvent(key);
        el.addEventListener(e, value);
      } else {
        el.setAttribute(key, value);
      }
    }
  }

  container.append(el);
}

function mountChildren(vnode: any, container: any) {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}
function processFragment(vnode: any, container: any) {
  mountChildren(vnode, container);
}

function processText(vnode: any, container: any) {
  const { children } = vnode;

  const textNode = (vnode.el = document.createTextNode(children));

  container.append(textNode);
}
