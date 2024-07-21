import { render } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 先vNode
      // component => vNode
      // 所有操作基于vNode实现处理

      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    },
  };
}
