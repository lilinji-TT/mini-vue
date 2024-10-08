import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}
export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context, []));
}

function parseChildren(context, ancestors) {
  const nodes: any[] = [];
  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(context.source[1])) {
        node = parseElement(context, ancestors);
      } else if (context.source[1] === "/") {
        // 判断缺少开始标签的情况
        // [div,lack span so that is udefined when find] </span></div>
        const tagName = context.source.slice(2, context.source.indexOf(">"));
        const el = ancestors.find((e) => e.tag === tagName);

        if (!el) {
          throw new Error("Invalid tag: " + context.source);
        }
      }
    }

    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, ancestors) {
  // 1. source 有值
  // 2. 当遇到结束标签
  const source = context.source;
  if (source.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(source, tag)) {
        return true;
      }
    }
  }

  return !source;
}

function parseElement(context, ancestors) {
  const element: any = parseTag(context, TagType.Start);
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw new Error(`缺少结束标签：</${element.tag}>`);
  }

  return element;
}

function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function parseTag(context, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );
  advanceBy(context, openDelimiter.length);
  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();
  advanceBy(context, closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function advanceBy(context, length) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT,
  };
}

function createParseContext(content: string) {
  return {
    source: content,
  };
}

function parseText(context: any) {
  let endIndex = context.source.length;
  let endTokens = ["<", "{{"];

  for (const endToken of endTokens) {
    const index = context.source.indexOf(endToken);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context: any, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, content.length);
  return content;
}
