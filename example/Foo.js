import { h, renderSlots } from "../lib/guide-mini-vue.esm.js";

export const Foo = {
  name: "Foo",
  setup(props, { emit }) {
    console.log(props);

    const emitAdd = () => {
      console.log("add");
      emit("add", 11, 12);
      emit("add-foo", 110, 120);
    };

    return {
      emitAdd,
    };
  },

  render() {
    const foo = h("p", {}, "foo");

    console.log(this.$slots);
    const count = 18;
    return h("div", {}, [
      renderSlots(this.$slots, "header", { count }),
      foo,
      renderSlots(this.$slots, "footer", { count }),
    ]);
  },
};
