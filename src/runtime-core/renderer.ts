import { effect } from "../reactivity/effect";
import { hasOwn, isEmptyObject } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createAppAPI } from "./createApp";
import { queueJobs } from "./shceduler";
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
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);

    if (shouldUpdateComponent(n1, n2)) {
      instance.next = null;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function updateComponentPreRender(instance, nextVNode) {
    nextVNode.component = instance;

    instance.vnode = nextVNode;
    instance.next = null;

    instance.props = nextVNode.props;
  }

  function mountComponent(
    initialVNode: any,
    container,
    parentComponent,
    anchor
  ) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
    // 此处是对应收集effect，对应具体的某个状态，通过deps对应
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          const { proxy } = instance;
          const subTree = (instance.subTree = instance.render.call(proxy));
          patch(null, subTree, container, instance, anchor);
          // 处理 element 完成，得到实例对应的 el 在 subTree 上，赋值给 vnode.el
          initialVNode.el = subTree.el;
          instance.isMounted = true;
        } else {
          const { proxy, next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }
          const subTree = instance.render.call(proxy);
          const prevTree = instance.subTree;
          instance.subTree = subTree;

          patch(prevTree, subTree, container, instance, anchor);
        }
      },
      {
        shceduler() {
            queueJobs(instance.update)
        },
      }
    );
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
      // 中间对比
      let s1 = i;
      let s2 = i;
      // 记录需要处理的元素总个数，
      const toBePatched = e2 - s2 + 1;
      // 已处理的个数
      let patched = 0;

      // 标记是否需要移动
      let moved = false;
      // 目前为止记录的最大下标
      let maxNewIndexSoFar = 0;

      // 创建一个key to inde 的 Map 做映射
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      for (let j = s2; j <= e2; j++) {
        const nextChild = c2[j];
        keyToNewIndexMap.set(nextChild.key, j);
      }

      for (let j = s1; j <= e1; j++) {
        const prevChild = c1[i];
        // 判断已处理的个数是否超过了最大需要处理数，超过的直接移除掉
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        // 如果前一个元素的key存在，那么从map中取出
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 如果key没有，那么就遍历找一下有没有相同的child元素，找到后退出循环，并将对应下标赋值给newIndex
          for (let k = s2; k <= e2; k++) {
            if (isSameVNodeType(prevChild, c2[k])) {
              newIndex = k;
              break;
            }
          }
        }

        // 如果newIndex不存在代表，该元素已经不存在，需要移除
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          // 存在的时候
          // 判断是否需要移动，记录最大newIndex
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          // 更新映射数组
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          // 递归对比
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      // 得到最长递增子序列，判断是否需要移动
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;
      // 移动操作
      for (let i = toBePatched; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1] : null;

        // 映射对应等于0，说明不存在，直接更新
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          // 移动插入
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
