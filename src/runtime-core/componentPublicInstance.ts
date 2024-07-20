const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
};

export const PublicInstanceHandlers = {
  get({ _: instance }, key) {
    const { setupState } = instance;
    if (key in setupState) {
      return setupState[key];
    }

    if (key === "$el") {
      // 这里的 vnode 还没到 element 那一步，直接获取的 el 是 null
      return instance.vnode.el;
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter();
    }
  },
};
