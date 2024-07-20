import { h } from "../lib/guide-mini-vue.esm.js";

window.self = null;
export const App = {
  render() {
    window.self = this;
    return h(
      "div",
      {
        class: "lg-text red",
      },
      //   [
      //     h("p", { class: "blue" }, "this is a blue"),
      //     h("p", { class: "yellow" }, "mini-vue"),
      //   ]
      `Hi! ${this.msg}`
    );
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
