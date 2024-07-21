import {
  h,
  createTextVNode,
  getCurrentInstance,
  inject,
} from "../../lib/guide-mini-vue.esm.js";

export const FooTwo = {
  name: "FooTwo",
  render() {
    return h("div", {}, "this FooTwo");
  },

  setup() {
    const instance = getCurrentInstance();
    console.log("FooTwo:", instance);

    const msg_1 = inject("App");
    console.log("from App", msg_1);
    const msg_2 = inject("Foo");
    console.log("from Foo", msg_2);
    return {
      msg: "mini-vue",
    };
  },
};
