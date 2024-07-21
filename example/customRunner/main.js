import { createRenderer } from "../../lib/guide-mini-vue.esm.js";
import { App } from "./App.js";

const game = new PIXI.Application();
await game.init({ width: 640, height: 360 });
document.body.appendChild(game.canvas);

const renderer = createRenderer({
  createElement(type) {
    if (type === "rect") {
      const rect = new PIXI.Graphics();
      rect.beginFill(0xff0000);
      rect.drawRect(0, 0, 100, 100);
      rect.endFill();

      return rect;
    }
  },
  patchProp(el, key, value) {
    el[key] = value;
  },
  insert(el, parent) {
    parent.addChild(el);
  },
});

renderer.createApp(App).mount(game.stage);
