import { effect } from "../reactivity/effect";
import { hasOwn, isEmptyObject } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode, container) {
    patch(null, vnode, container, null, null);
  }

  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
    }
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(
    initialVNode: any,
    container,
    parentComponent,
    anchor
  ) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance, anchor);
        // 处理 element 完成，得到实例对应的 el 在 subTree 上，赋值给 vnode.el
        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevTree = instance.subTree;
        instance.subTree = subTree;

        patch(prevTree, subTree, container, instance, anchor);
      }
    });
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    //TODO: patch diff
    const oldProps = n1.props || {};
    const newProps = n2.props || {};

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const shapeFlag = n2.shapeFlag;
    const c2 = n2.children;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRARY_CHILDREN) {
        // 1. clear old children
        unmountChildren(n1.children);
      }

      // 2. set the text node
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    let i = 0;
    let l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    // 左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      i++;
    }

    //右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    // 新的比旧的多，进行创建
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      let s1 = i;
      let s2 = i;
      const toBePatched = e2 - s2 + 1;
      let patched = 0;

      let moved = false;
      let maxNewIndexSoFar = 0;

      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      for (let j = s2; j <= e2; j++) {
        const nextChild = c2[j];
        keyToNewIndexMap.set(nextChild.key, j);
      }

      for (let j = s1; j <= e1; j++) {
        const prevChild = c1[i];
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let k = s2; k <= e2; k++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        if (newIndex !== undefined) {
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          newIndexToOldIndexMap[newIndex - s2] = i + 1;

          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;
      for (let i = toBePatched; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1] : null;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function getSequence(nums) {
    if (nums.length === 0) {
      return [];
    }

    // 初始化 dp 数组和 prev 数组
    const dp = new Array(nums.length).fill(1);
    const prev = new Array(nums.length).fill(-1);

    let maxLength = 1;
    let maxIndex = 0;

    // 遍历数组中的每个元素
    for (let i = 1; i < nums.length; i++) {
      for (let j = 0; j < i; j++) {
        // 如果当前元素大于之前的某个元素，更新 dp[i]
        if (nums[i] > nums[j]) {
          if (dp[i] < dp[j] + 1) {
            dp[i] = dp[j] + 1;
            prev[i] = j;
          }
        }
      }
      // 更新最长长度和对应的索引
      if (dp[i] > maxLength) {
        maxLength = dp[i];
        maxIndex = i;
      }
    }

    // 回溯得到下标集合
    const indices: number[] = [];
    for (let i = maxIndex; i >= 0; i = prev[i]) {
      indices.push(i);
      if (prev[i] === -1) break;
    }

    // 下标集合是从末尾开始记录的，所以需要反转
    return indices.reverse();
  }

  function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      // remove
      hostRemove(el);
    }
  }

  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];

        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }

      if (!isEmptyObject(oldProps)) {
        for (const key in oldProps) {
          if (!hasOwn(newProps, key)) {
            const oldProp = oldProps[key];
            hostPatchProp(el, key, oldProp, null);
          }
        }
      }
    }
  }

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props, shapeFlag } = vnode;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRARY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor);
    }

    for (const key in props) {
      if (hasOwn(props, key)) {
        const value = props[key];

        hostPatchProp(el, key, null, value);
      }
    }

    hostInsert(el, container, anchor);
  }

  function mountChildren(
    children: any,
    container: any,
    parentComponent,
    anchor
  ) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }
  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2;

    const textNode = (n2.el = document.createTextNode(children));

    container.append(textNode);
  }

  return {
    createApp: createAppAPI(render),
  };
}
