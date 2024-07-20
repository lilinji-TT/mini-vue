import { h } from "../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  render() {
    return h(
      "div",
      {
        class: "lg-text red",
        onClick() {
          console.log("Hello Click");
        },
      },
      //   [
      //     h("p", { class: "blue" }, "this is a blue"),
      //     h("p", { class: "yellow" }, "mini-vue"),
      //   ]
      [
        h("div", {}, `Hi! ${this.msg}`),
        h(Foo, {
          onAdd() {
            console.log("on add");
          },
        }),
      ]
    );
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
