import { generate } from "../src/generate";
import { baseParse } from "../src/parse";
import { transformElement } from "../src/tranforms/transformElement";
import { transformExpression } from "../src/tranforms/transformExpression";
import { transformText } from "../src/tranforms/transformText";
import { transform } from "../src/transform";

describe("generate", () => {
  it("string", () => {
    const ast = baseParse("hi");
    transform(ast);
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("{{message}}");
    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("element", () => {
    const ast = baseParse("<div>hi, {{message}}</div>");
    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
    });
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });
});
