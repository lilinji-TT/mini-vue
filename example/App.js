import { h, createTextVNode } from "../lib/guide-mini-vue.esm.js";
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
    return {
      msg: "mini-vue",
    };
  },
};
