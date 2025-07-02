# 更新日志

此项目的所有显着更改都将记录在此文件中。

格式是基于[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)，这个项目坚持[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.4] - 2025-07-02

- 追加[Reader3](https://github.com/hectorqin/reader) api适配
- url格式：https://<user>@<password>:<域名>:<端口>/reader3

## [1.4.1] - 2023-09-20

### 新增

- 阅读页面：支持自定义字体颜色

## [1.3.4] - 2023-07-02

### 新增

- 阅读页面：增加快捷键Q返回书架页面、快捷键E打开/关闭目录、R重新获取当前章节内容
- 阅读页面：定时同步阅读进度到APP

### 修复

- 书架页面：布局切换在普通屏和高分屏下都使用750px作为阈值
- 书架页面：在连接WEB服务过程中也允许修改基本设定
- 阅读页面：按动快捷键 <kbd>W</kbd> <kbd>S</kbd> 或 <kbd>↑</kbd> <kbd>↓</kbd> 进行翻页时，缩小内容保留区高度为50px
- 阅读页面：开启无限加载时，将到达页面底部时加载下一章调整为内容不足一页时加载下一章

## [1.1.3] - 2023-06-02

### 新增

- 书架页面点击基本设定的状态即可设置阅读APP的WEB服务访问地址，刷新后生效

### 修复

- 修复书架页面在Safari浏览器部分情况出现的滚动条小白框问题
- 在主要浏览器中隐藏书架的滚动条
- 修改阅读WEB服务地址时默认展示当前地址

## [1.0.0] - 2023-06-01

### 新增

- 集成[阅读APP的WEB服务](https://github.com/gedoor/legado/tree/master/modules/web)
- 在VS Code编辑区打开阅读WEB界面
- 书架页面增加了暗黑模式
- 章节阅读页面增加 <kbd>W</kbd> <kbd>S</kbd> <kbd>A</kbd> <kbd>D</kbd> 进行翻页控制
