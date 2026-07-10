# 岚烟Faileas · 个人作品展示

客户个人作品展示网站，包含首页、作品视频页、视频合集页。项目为纯静态 HTML/CSS/JS，无构建步骤，可直接部署到静态托管平台。

## 页面

- `index.html`：首页、精选作品、展示内容、浏览说明、联系入口。
- `works.html`：作品展示页，使用本地视频卡片和弹窗播放器。
- `links.html`：视频合集页，按系列展示本地视频入口。

## 本地预览

直接用浏览器打开 `index.html` 即可。若 Live2D 运行时或模型加载受浏览器本地文件限制，建议用静态服务器预览：

```bash
python -m http.server 8000
```

然后访问本地地址的 `index.html`。

## 资源目录

- `assets/images/`：网站图片和封面图。
- `assets/videos/`：本地作品视频文件。
- `assets/live2d/`：Live2D 模型文件。
- `assets/js/live2d-init.js`：Live2D 初始化脚本。
- `docs/`：需求、设计、内容维护和部署说明。

## 内容维护原则

当前方案为代码维护，不做后台/CMS。客户后续更新图片或视频时，由开发者替换资源文件并同步修改 HTML 中的标题、说明、链接。

## 部署

这是静态站点，可部署到 GitHub Pages、Cloudflare Pages、Netlify、Vercel 静态项目或普通 Web 服务器。上线前请参考 `docs/deployment.md`。
