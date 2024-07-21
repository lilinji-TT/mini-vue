import {
  h,
  renderSlots,
  getCurrentInstance,
  inject,
  provide,
} from "../lib/guide-mini-vue.esm.js";
import { FooTwo } from "./FooTwo.js";

export const Foo = {
  name: "Foo",
  setup(props, { emit }) {
    const emitAdd = () => {
      emit("add", 11, 12);
      emit("add-foo", 110, 120);
    };

    const instance = getCurrentInstance();
    provide("Foo", "this is Foo Component");
    provide("App", "this is Foo App");
    const AppMsg = inject("App");
    console.log("Foo recived:", AppMsg);
    return {
      emitAdd,
    };
  },

  render() {
    const foo = h("p", {}, "foo");
    const fooTwo = h(FooTwo, {}, "fooTwo");

    const count = 18;

    return h("div", {}, [
      renderSlots(this.$slots, "header", { count }),
      foo,
      renderSlots(this.$slots, "footer", { count }),
      fooTwo,
    ]);
  },
};
