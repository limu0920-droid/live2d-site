# Live2D 模型放置说明

把客户提供的 Live2D 模型完整目录放在这里，例如：

```text
assets/live2d/model/model.model3.json
assets/live2d/model/textures/texture_00.png
assets/live2d/model/motions/idle.motion3.json
```

然后在 `assets/js/live2d-init.js` 中确认：

```js
const MODEL_PATH = 'assets/live2d/model/model.model3.json';
```

注意：当前项目先保留容器和初始化脚本。只有模型文件和运行时库都准备好后，页面才会显示 Live2D。
