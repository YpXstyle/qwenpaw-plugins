# 本地发行流程

[English](RELEASING.md) | 简体中文

本流程用于准备可审查的本地插件发行结果。以下命令均不创建远端仓库、
推送 Git 状态、发布 GitHub Release 或提交市场。
CI 可以验证并保留产物，不自动发布。

## 1. 冻结单个插件候选

同步更新 `plugin.json` 版本、已有前端的包版本、中英文 README 和变更记录，
保留安装 ID 及兼容的内部注册。目前候选为
`yance-ask-user-question` **0.1.4**。既有 0.1.3 安装包及验收证据保持原样。
当前唯一宿主目标为正式版 QwenPaw `2.2.2`，提交
`5c56644a6e130762a236f8c946103e95a0a1eec8`，框架为 AgentScope `2.0.10`。
从已采用新命名的 0.1.3 升级时保留 ID 并使用 `--force`；早期预览安装则
依照[单独迁移步骤](docs/naming_zh.md)。两者均不修改官方澄清工具。
此候选仍需本轮自动化及用户桌面验收。

0.1.4 范围为默认中文介绍，以及在七语设置页显式同步当前 Agent 的工具介绍。
英文品牌名、稳定标识、双语文档及 0.1.3 问卷/推荐行为保持不变。
升级前处理旧待答，升级后刷新 Console；源码启动的桌面版应先关闭窗口，
等启动命令退出后再启动。

从仓库根目录构建并验证，将示例路径替换为真实本地路径；它们不是公开下载地址：

```bash
python scripts/validate_plugin.py --plugin yance-ask-user-question --host-source "/path/to/QwenPaw"
python scripts/package_plugin.py --plugin yance-ask-user-question --output-dir dist
```

包内包含已构建的运行文件、许可证和两份 README。
保留 ZIP 的 SHA-256 和成员清单，核对全部声明入口和交付体积上限。
记录精确源码、宿主、bundle 哈希、命令及实际结果。
自动化安装检查使用隔离状态，不代表获准安装到真实用户环境。

## 2. 人工验收精确 ZIP

自动化检查通过后，在获得授权的环境中人工测试该 ZIP，至少核对：
直接 Console Chat、单题和多题、上一题/下一题保留答案、单选/多选、其他输入、
全部作答后提交、推荐星标和柔和绿色边框但无预选、拒答、提交失败反馈、
语言切换，以及获得答案后在同一 Agent 轮次继续执行。
继续检查非全屏/较矮桌面窗口、真实 `qwenpaw` 前缀的卡片 body、视口变化、
标题/操作可见及草稿保留；推荐选项选中后仍应保留星标。
核对底部主输入按宿主队列处理，显式“打断并发送”是取消当前等待，不是回答问题。
若实际测试桌面版，单独记录桌面验收。

0.1.4 还须核对原生插件/工具列表默认中文介绍，名称和 ID 保持不变。
原生列表不会因此自动切换语言，插件自己的问答卡和设置界面仍应支持七语。
在 `/plugins/yance-ask-user-question` 对已有 Agent 测试显式同步：
只调整本插件的介绍，保留工具开关、其他工具及其全部配置；
不自动遍历全部 Agent，不卸载插件。
核对插件自己的介绍同步 HTTP 接口复用宿主官方原子配置更新 API，
在同一宿主锁内比较预期介绍，只修改本工具 description。
Agent 身份不符、工具不存在或介绍已变化时应拒写，读取失败也不能猜测原值后写入。
验证没有全 tools PUT 或 Agent reload，在提问或 heartbeat 活跃时也不要求暂停任务。
将精确包及实际结果记录到被忽略的证据报告，不在源文档写尚未完成的通过数字。
本候选须用户人工验收通过后，才能提交或发布。

将[验收示例](docs/manual-acceptance.example.json)复制到本地证据目录，如实填写：

| 字段 | 含义 |
| --- | --- |
| `plugin_id` | 已安装插件的稳定 ID |
| `version` | 候选版本 |
| `archive_sha256` | 实际测试 ZIP 的 SHA-256 |
| `tested_by` | 执行验收的人 |
| `tested_at` | ISO 8601 格式的验收时间 |
| `result` | 只有该人确认通过后才为 `passed` |

提供的示例为 `result: pending`，不能通过预检。
自动化测试、浏览器脚本或旧版本验收都不能替代这份人工记录，不得代替他人标记通过。

## 3. 运行本地预检

使用绑定最终 ZIP 的验证报告及人工验收记录：

```bash
python scripts/release_preflight.py --plugin yance-ask-user-question --validation "/path/to/validation-report.json" --acceptance "/path/to/manual-acceptance.json" --output-dir dist
```

预检对照当前源码、最终 ZIP、版本、验证证据和人工验收，写入本地发行说明与校验值。
它不执行网络上传或 GitHub 操作。将输出与已测试 ZIP 一同保留。
源码或 ZIP 字节变化后，应更新受影响的验证与验收，再为新候选执行预检。

## 4. 发布属于后续单独授权的步骤

获得明确批准后，后续可将源码推送到已确认仓库，创建插件独立 tag 和携带
单插件 ZIP 的 GitHub Release，并按需要提交插件市场。
先确认仓库、账号和真实发行地址，再写下载链接。
本地流程不执行这些发布动作，目前也不设计自动上传工作流。

本仓 tag 约定为 `<插件ID>-v<版本>`，例如
`yance-ask-user-question-v0.1.4`。这是集合仓库的管理约定，不是 QwenPaw 官方要求。
源码同仓管理，各插件仍独立维护版本及发行。
