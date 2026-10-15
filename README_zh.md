# QwenPaw Plugins

[English](README.md) | 简体中文

由 **Yance** 独立维护的 QwenPaw 插件集合。
每个插件拥有稳定 ID、独立版本、文档和可安装包。
源码仓库：[YpXstyle/qwenpaw-plugins](https://github.com/YpXstyle/qwenpaw-plugins)。

## 插件目录

| 插件                                                                            | 稳定 ID                   | 源码版本 | 用途                               | 效果截图                                                                  | 插件市场                                                                       |
| ------------------------------------------------------------------------------- | ------------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [Ask User Question by Yance](plugins/tool/yance-ask-user-question/README_zh.md) | `yance-ask-user-question` | `0.1.5`  | 直接交互的 Console Chat 结构化提问 | [查看示例](plugins/tool/yance-ask-user-question/README_zh.md#screenshots) | [已发布 0.1.5](https://platform.agentscope.io/plugins/yance-ask-user-question) |

版本列指仓库源码版本，市场版本与安装入口按插件分别列出。
当前插件尚无 GitHub Release 下载资产。各插件 README 提供功能、安装、配置、
兼容性、截图及故障排查。

## 使用插件

从目录选择插件，按对应说明安装或升级。安装单个插件运行包，
而不是把整个集合的源码压缩包当作插件安装。不同插件的可用性和要求各自说明，
源码 tag 本身不等于插件 ZIP 发行。

## 仓库组织

插件放在 `plugins/{tool,bundle,memory,apps}/<插件ID>/`，各自维护中英文 README、
变更记录、许可证及 `docs/images/<版本>/` 示例图。
集合根 README 保持插件目录定位，具体演示归属对应插件。
通用开发/发行指南放在根 `docs/`，通用核验放在 `scripts/`，
定向测试放在 `tests/<module>/`。

各插件独立维护版本。本集合约定 tag 为 `<插件ID>-v<版本>`，
这是仓库管理约定，不是上游要求每插件独立建仓。

## 开发与贡献

- [贡献说明](CONTRIBUTING_zh.md)
- [发行流程](RELEASING_zh.md)
- [插件布局与官方要求](docs/plugin-layout_zh.md)
- [命名与迁移](docs/naming_zh.md)
- [市场发布材料](docs/marketplace-listing_zh.md)

## 许可证与联系

采用 Apache-2.0，见 [LICENSE](LICENSE) 和各插件许可证。
维护者：**Yance**，邮箱：[xstyle@qq.com](mailto:xstyle@qq.com)。
本集合由个人独立维护。
