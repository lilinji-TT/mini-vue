import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from "./runtimeHelp";

export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;

  genFunctionPreamble(ast, context);

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");
  push(`function ${functionName} (${signature}) {`);
  push("return");
  push(" ");

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
    case NodeTypes.ELEMENT:
      genElement(context, node);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    default:
      break;
  }
}

function genCompoundExpression(node: any, context: any) {
  const children = node.children;
  const { push } = context;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}

function genElement(context, node) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);

  genNodeList(genNullable([tag, props, children]), context);

  push(")");
}

function genNodeList(nodes, context) {
  const { push } = context;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }

    if(i<nodes.length - 1) {
        push(", ")
    }
  }
}

function genNullable(args: any) {
  return args.map((arg) => arg || "null");
}

function genText(context: any, node: any) {
  const { push } = context;
  push(`'${node.content}'`);
}

function genInterpolation(context: any, node: any) {
  const { push, helper } = context;
  push(`_${helper(TO_DISPLAY_STRING)}(`);
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
    helper(key) {
      return `${helperMapName[key]}`;
    },
  };

  return context;
}
