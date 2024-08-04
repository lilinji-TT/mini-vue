import { NodeTypes } from "./ast";
import { helperMapName, TO_DISPLAY_STRING } from "./runtimeHelp";

export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;

  genFunctionPreamble(ast, context);

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");
  push(`function ${functionName} (${signature}) {`);

  genNode(ast.codegenNode, context);
  push("};");

  return {
    code: context.code,
  };
}

function genFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBinging = "Vue";
  const aliasHelper = (s: string) =>
    `${helperMapName[s]}: _${helperMapName[s]}`;
  if (ast.helpers.length > 0) {
    push(
      `const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`
    );
  }
  push("\n");
  push("return ");
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(context, node);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(context, node);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(context, node);
      break;

    default:
      break;
  }
}

function genText(context: any, node: any) {
  const { push } = context;
  push(`return '${node.content}';`);
}

function genInterpolation(context: any, node: any) {
  const { push, help } = context;
  push(`_${help(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}

function genExpression(context, node: any) {
  const { push } = context;
  push(`${node.content}`);
}

function createCodegenContext() {
  const context = {
    code: "",
    push(source: string) {
      context.code += source;
    },
    help(key) {
      return `${helperMapName[key]}`;
    },
  };

  return context;
}
