import { proxyRefs } from "../reactivity";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode, parent) {
  const componentInstance = {
    vnode,
    next:null,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    isMounted: false,
    subTree: {},
    emit: () => {},
  };

  componentInstance.emit = emit.bind(null, componentInstance) as any;

  return componentInstance;
}

export function setupComponent(instance) {
  // TODO:
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  instance.proxy = new Proxy({ _: instance }, PublicInstanceHandlers);

  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);
    // function or object
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });

    setCurrentInstance(null);

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  // function or object
  // TODO: function

  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
}

let currentInstance: any = null;
export function getCurrentInstance() {
  return currentInstance;
}

function setCurrentInstance(instance) {
  currentInstance = instance;
}
