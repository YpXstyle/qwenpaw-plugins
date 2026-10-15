# QwenPaw Plugins

[English](README.md) | 简体中文

由 **Yance** 独立维护的 QwenPaw 插件集合。
每个插件拥有稳定 ID、独立版本、文档和可安装 ZIP。
源码仓库：[YpXstyle/qwenpaw-plugins](https://github.com/YpXstyle/qwenpaw-plugins)。
插件 ZIP 独立发行；当前尚未发布可下载版本。

## 插件

| 插件 | 稳定 ID | 当前版本 | 范围 |
| --- | --- | --- | --- |
| [Ask User Question by Yance](plugins/tool/yance-ask-user-question/README_zh.md) | `yance-ask-user-question` | `0.1.4` 本地候选 | 直接交互的 Console Chat 结构化提问 |

Ask User Question by Yance 等待用户给出结构化答案，然后在同一 Agent 轮次继续执行。
工具默认禁用。安装、配置、示例、限制和排错见插件 README。
0.1.4 将插件和工具的默认介绍改为中文，并在独立设置页提供当前 Agent 的显式介绍同步。
英文品牌名、稳定标识、七语插件界面和双语文档保持不变；原生列表显示固定介绍，不会自动切换语言。
每个候选的验证和人工验收均绑定其版本及 ZIP 哈希；源码上传不等于插件市场发布。
既有安装包和验收证据保持不变，后续修复独立维护版本。
替换早期原型前请先读[命名与迁移说明](docs/naming_zh.md)。
它不替代 Data Console 内置的澄清工具。

## 安装插件

安装单个插件 ZIP，而非整个集合仓库的源码压缩包。
ZIP 已含前端构建产物，使用者无需 npm。QwenPaw 运行时，
通过插件管理界面上传，或执行：

```bash
qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.4.zip"
```

`/path/to/...` 是示例本地路径，不是下载地址。服务未运行时，
先解压 ZIP，再安装其中的插件目录。升级请依照对应插件的安装说明。
安装沿用已有 Agent 和模型配置，无需重新初始化。
升级前先完成或拒绝待答，之后刷新 Console 并开始新对话。
源码启动的桌面版应先关闭窗口，等启动命令退出后再启动。
已有 Agent 的工具介绍须在插件设置页显式同步，在宿主配置锁内比较保存值并只更新本工具介绍，不重新加载 Agent。

## 仓库约定

插件按 `plugins/{tool,bundle,memory,apps}/<插件ID>/` 管理，
各自包含 `plugin.json`、入口文件、许可证和中英文 README。
通用核验及打包脚本放在 `scripts/`，测试放在 `tests/<module>/`。
按实际需要创建目录，无需为尚不存在的插件建立空目录。
当前测试模块为 `tests/yance_ask_user_question/`。

集合仓库与插件独立发行是我们的管理选择，官方没有要求每个插件单独建仓。
本仓约定 tag 为 `<插件ID>-v<版本>`，这不是 QwenPaw 官方强制规范。

## 本地开发与验证

从仓库根目录运行，并把宿主路径替换为兼容、未经修改的 QwenPaw 源码目录：

```bash
python scripts/validate_plugin.py --plugin yance-ask-user-question --host-source "/path/to/QwenPaw"
python scripts/package_plugin.py --plugin yance-ask-user-question --output-dir dist
```

验证流程在隔离环境记录前端检查、后端定向测试、打包和安装检查。
生成 ZIP 不代表发布。先对其精确 SHA-256 完成人工验收，才能通过本地发行预检；
自动化检查不能代替这项人工确认。

- [贡献说明](CONTRIBUTING_zh.md)
- [本地发行流程](RELEASING_zh.md)
- [插件布局与官方要求](docs/plugin-layout_zh.md)
- [命名与迁移](docs/naming_zh.md)

## 许可证与联系

采用 Apache-2.0，见 [LICENSE](LICENSE) 和各插件许可证。
维护者：**Yance**，邮箱：[xstyle@qq.com](mailto:xstyle@qq.com)。
本集合由个人独立维护，尚未获得 AgentScope 插件市场审核或发布。

当前插件基于 QwenPaw **2.2.2 / `5c56644a`** 开发，使用宿主 AgentScope **2.0.10**。加载范围、验证目标与验收范围，见插件 README 的兼容性表。
