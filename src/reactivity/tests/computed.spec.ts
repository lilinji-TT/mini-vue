import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
  it("happy path", () => {
    const user = reactive({
      age: 1,
    });
    const age = computed(() => {
      return user.age;
    });

    expect(age.value).toBe(1);
  });

  it("shuould computed lazily", () => {
    const value = reactive({ foo: 1 });
    const getter = jest.fn(() => {
      return value.foo;
    });

    const cValue = computed(getter);

    // lazy
    expect(getter).not.toHaveBeenCalled();
    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // should not computed again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute until needed
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // now it should be compute
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not computed again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });

  it("it should update reactive only", () => {
    const original = {
      count: 1,
    };

    const cValue = computed(() => {
      return original.count;
    });

    // not reactive
    expect(cValue.value).toBe(1);
    original.count++;
    expect(cValue.value).toBe(1);

    // reactive
    const user = reactive({ age: 1 });
    const cUserAge = computed(() => user.age);

    expect(cUserAge.value).toBe(1);
    user.age++;
    expect(cUserAge.value).toBe(2);
  });

  it("should update when set", () => {
    const user = reactive({ firstName: "Zhang", lastName: "San" });

    const setFn = jest.fn((value: string) => {
      [user.firstName, user.lastName] = value.split(" ");
    });

    const cUser = computed({
      get() {
        return user.firstName + " " + user.lastName;
      },

      set: setFn,
    });

    expect(cUser.value).toBe("Zhang San");
    cUser.value = "Li Si";
    expect(cUser.value).toBe("Li Si");
    expect(user.firstName).toBe("Li");
    expect(user.lastName).toBe("Si");
  });
});
