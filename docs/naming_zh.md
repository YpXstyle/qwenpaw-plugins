# 命名与迁移

[English](naming.md) | 简体中文

## 当前标识

| 用途 | 值 |
| --- | --- |
| 展示名 | Ask User Question by Yance |
| 插件 ID | `yance-ask-user-question` |
| 工具名与审批来源 | `yance_ask_user_question` |
| 源码目录 | `plugins/tool/yance-ask-user-question/` |
| 测试模块 | `tests/yance_ask_user_question/` |
| 回答 API | `/api/yance-ask-user-question/answer` |
| 界面就绪标记 | `yance_ask_user_question_ui` |
| 当前版本 | `0.1.4` 本地候选 |
| 独立 tag 约定 | `yance-ask-user-question-v0.1.4` |

插件 ID 使用小写字母/数字及连字符，并保持唯一。
`yance-` 作者前缀是本集合减少冲突的选择，不是官方要求所有插件使用的前缀。
本地仓库目录保持 `qwenpaw-plugins`，它不是运行时插件 ID。
本仓 tag 格式同样属于管理约定，不是官方强制规则。

## 区分原生澄清工具

Data Console 已有服务于其自身澄清流程的内置 `ask_user_question`，
契约中包含 `multiSelect`、`title`、`selected_options`、`custom_text` 等名称。
本插件使用宿主钉住框架的 `multi_select`、`header` 及
`AskUserMetadata.answers`，每份答案包含 `question`、`selected` 和 `other`。

两者的工具、注册及结果契约相互独立。本插件不替换、重命名、禁用或覆盖原生工具，
也不宣称实现 Data Console 工作流。支持范围仍为直接交互的主 Agent Console Chat。
独立前缀减少重名风险，不等于证明所有环境均兼容。

## 迁移早期预览安装

早期使用 `ask-user-question-preview` 的本地 0.1.0、0.1.1 及任何 0.1.2 原型
安装在另一个 ID 下，工具名为 `ask_user_question_preview`；
其回答端点和就绪标记也属于旧插件，不属于新命名空间。

1. 先完成或拒绝旧待答，保持原 0.1.1 验收 ZIP 和证据不变。
2. 仅卸载旧插件：

   ```bash
   qwenpaw plugin uninstall ask-user-question-preview
   ```

3. 安装新的候选 ZIP，不将其视为同 ID 升级：

   ```bash
   qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.4.zip"
   ```

4. 刷新 Console，确认旧插件工具已不再可用，在目标 Agent 明确启用
   `yance_ask_user_question`，再开始直接 Chat 新轮次。
   新安装不会自动启用工具。

不要修改官方 `ask_user_question` 注册。待答、答案草稿和旧工具配置不自动迁移。
离线安装时，先解压 ZIP，再依[插件 README](../plugins/tool/yance-ask-user-question/README_zh.md)
安装插件目录。文中的路径都是本地占位示例，不是已发布下载链接。

## 后续升级与验收

新 ID 安装完成后，保留 `yance-ask-user-question` 的后续版本才适用
`qwenpaw plugin install ... --force`，包括同 ID 的 0.1.3 升级至 0.1.4，
仍不会持久化未答表单。0.1.3 安装包及验收证据保持原样，0.1.4 需要自身验证。
插件 ID、源码、版本或 ZIP 哈希改变后，应有对应验证及人工验收记录，
旧原型的验收不会自动转移。

0.1.4 仅调整默认介绍，英文品牌名、插件 ID 和工具名不变。
设置页路径为 `/plugins/yance-ask-user-question`；已有介绍的同步是针对当前 Agent 的
单独显式操作，不重新安装插件，也不自动更新全部 Agent。
升级前处理旧待答，升级后刷新 Console 并开始新对话。
源码启动的桌面版应先关闭窗口，等启动命令退出后再启动。

本地集合仓库独立于 QwenPaw 功能 PR，此处命名和迁移不修改其源码、分支或已发表 PR。
