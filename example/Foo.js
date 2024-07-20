import { h } from "../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup(props, { emit }) {
    console.log(props);

    const emitAdd = () => {
      console.log("add");
      emit('emit')
    };

    return {
      emitAdd,
    };
  },

  render() {
    const btn = h("button", { onClick: this.emitAdd }, "emitAdd");
    const foo = h("p", {}, "foo");
    return h("div", {}, [foo, btn]);
  },
};
