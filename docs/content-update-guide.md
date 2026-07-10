# 内容更新指南

## 更新图片

1. 将新图片放入 `assets/images/` 下对应目录。
2. 如果替换同名文件，HTML 不需要修改。
3. 如果使用新文件名，需要修改对应 HTML 的 `src`。
4. 同步检查 `alt` 文本是否准确。

常用位置：

- 首页主视觉：`assets/images/hero-bg.svg`
- 首页/作品页角色封面：`assets/images/works/work-01-thumb.svg`
- 首页/作品页委托封面：`assets/images/works/work-02-thumb.svg`
- 首页视频入口封面：`assets/images/works/work-03-thumb.svg`
- 场景封面：`assets/images/works/scene-01-thumb.svg`
- Live2D 封面：`assets/images/works/live2d-01-thumb.svg`
- 视频合集封面：`assets/images/links/`

## 更新外链视频

### 作品页

在 `works.html` 中找到作品卡片的：

```html
data-external-url="https://www.bilibili.com/"
```

替换为真实视频地址。

### 视频合集页

在 `links.html` 中找到：

```html
<a class="lc reveal" href="https://www.bilibili.com/" ...>
```

替换 `href` 为真实视频地址。

## 更新 Live2D

1. 把模型完整目录放到 `assets/live2d/model/`。
2. 确认模型入口文件路径，例如：

```text
assets/live2d/model/model.model3.json
```

3. 如果入口文件名不同，修改 `assets/js/live2d-init.js` 中的 `MODEL_PATH`。
4. 如需真实显示模型，还需要在首页引入与模型格式匹配的 Live2D 前端运行时库。

## 添加新作品

复制已有 `.work-card`、`.vc` 或 `.lc` 块，修改：

- 图片路径
- 标题
- 类型/标签
- 时间
- 备注
- 外链地址

注意：不要改动页面网格和布局 CSS。
