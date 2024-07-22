import { h, ref } from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  render() {
    return h(
      "div",
      {
        class: "lg-text red",
        ...this.props,
      },
      [
        h("div", {}, `Hi! ${this.count}`),
        h(
          "button",
          {
            onClick: this.onClick,
          },
          "add"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo1,
          },
          "修改某个属性"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo2,
          },
          "重置为undefined"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo3,
          },
          "修改整个值"
        ),
      ]
    );
  },
  setup() {
    const count = ref(0);
    const onClick = () => {
      count.value++;
    };

    const props = ref({
      foo: "foo",
      bar: "bar",
    });

    const onChangePropsDemo1 = () => {
      props.value.foo = "new-foo";
    };

    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };

    const onChangePropsDemo3 = () => {
      props.value = {
        bar: "bar",
      };
    };
    return {
      count,
      props,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    };
  },
};
