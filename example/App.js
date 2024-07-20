import { h } from "../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  render() {
    return h(
      "div",
      {
        class: "lg-text red",
      },
      //   [
      //     h("p", { class: "blue" }, "this is a blue"),
      //     h("p", { class: "yellow" }, "mini-vue"),
      //   ]
      [
        h("div", {}, `Hi! ${this.msg}`),
        h(Foo, {
          onAdd(a, b) {
            console.log("on add", a, b);
          },
          onAddFoo(a, b) {
            console.log("on-add-foo", a, b);
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
