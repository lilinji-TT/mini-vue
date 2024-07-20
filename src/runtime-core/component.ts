import { PublicInstanceHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const componentInstance = {
    vnode,
    type: vnode.type,
  };

  return componentInstance;
}

export function setupComponent(instance) {
  // TODO:
  // initProps()
  // initSlots()

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  instance.proxy = new Proxy({ _: instance }, PublicInstanceHandlers);

  const { setup } = Component;
  if (setup) {
    // function or object
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  // function or object
  // TODO: function

  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
}
