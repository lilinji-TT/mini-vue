import {
  h,
  createTextVNode,
  getCurrentInstance,
  provide,
} from "../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  render() {
    return h(
      "div",
      {
        class: "lg-text red",
      },
      [
        h("div", {}, `Hi! ${this.msg}`),
        h(
          Foo,
          {},
          {
            header: ({ count }) => [
              createTextVNode("hello world!"),
              h("p", {}, "header" + count),
            ],
            footer: ({ count }) => h("p", {}, "footer" + count),
          }
        ),
      ]
    );
  },

  setup() {
    const instance = getCurrentInstance();

    provide("App", "this is App component");
    return {
      msg: "mini-vue",
    };
  },
};
