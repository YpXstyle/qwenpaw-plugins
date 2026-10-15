# 本地发行流程

[English](RELEASING.md) | 简体中文

本流程用于准备可审查的本地插件发行结果。以下命令均不创建远端仓库、
推送 Git 状态、发布 GitHub Release 或提交市场。
CI 可以验证并保留产物，不自动发布。

## 1. 冻结单个插件候选

同步更新 `plugin.json` 版本、已有前端的包版本、中英文 README 和变更记录，
保留安装 ID 及兼容的内部注册。当前版本为
`yance-ask-user-question` **0.1.6**，已由 Yance 人工验收，且已在[AgentScope 插件市场](https://platform.agentscope.io/plugins/yance-ask-user-question)发布，
见[验证与验收记录](docs/validation/yance-ask-user-question-0.1.6.md)。
已验收 0.1.5 安装包及证据保持原样。
当前唯一宿主目标为正式版 QwenPaw `2.2.2`，提交
`5c56644a6e130762a236f8c946103e95a0a1eec8`，框架为 AgentScope `2.0.10`。
从已采用新命名的 0.1.5 升级时保留 ID 并使用 `--force`；早期预览安装则
依照[单独迁移步骤](docs/naming_zh.md)。两者均不修改官方澄清工具。
每个候选均须有绑定自身源码和 ZIP 哈希的验证及人工验收。
维护者 **Yance** 重启后已确认 0.1.5 桌面验收，版本源码纳入本仓库；见
[验证记录](docs/validation/yance-ask-user-question-0.1.5.md)和[插件效果截图](plugins/tool/yance-ask-user-question/README_zh.md#screenshots)。
旧版本结果不能自动转移到新产物。

0.1.6 移除独立介绍同步页面、菜单和专属 HTTP 接口。插件无需额外配置，
工具开关仍由宿主 Agent 工具页管理；已有英文/自定义介绍、开关及其他配置保持原样。
问答渲染、推荐行为及框架契约保持不变。升级前处理旧待答，升级后刷新 Console；
源码启动的桌面版应先关闭窗口，等启动命令退出后再启动。

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

保留 0.1.5 推荐回归，使用原始第二项 `400-600/晚（推荐）` 验证：显示推荐样式，并在无标记首项之前展示，
无自动预选，提交答案保留其完整原标签。核对成对半角/全角括号、英文 `Recommended`
忽略大小写、中文 `推荐` 及尾部显示空白；不删除零宽字符。
无标记选项、正文提及、括号错误或非末尾标记不应出现徽标，两组内部保持原顺序。
模型仍收到未经修改的官方英文标记/首位指令，七语界面不等于解析七种语言的推荐标记。

同时核对原生插件/工具列表默认中文介绍，名称和 ID 保持不变，已有英文或自定义介绍不被覆盖。
原生列表不会因此自动切换语言，问答卡和详情仍应支持七语。

0.1.6 应确认旧设置菜单消失，直接打开 `/plugins/yance-ask-user-question` 不再渲染被移除页面。
SPA 外壳可能仍返回 HTTP 200，应检查路由注册和实际内容。
`/api/yance-ask-user-question/description-sync` 的 GET 和 POST 均应不可用。
确认同 ID 升级保留 Agent 工具开关、自定义配置及其他工具，答案接口仍可恢复原待答。
刷新或重开已有 Web/桌面页面，避免旧 bundle 掩盖检查结果。

将精确包及实际结果记录到被忽略的证据报告，不在源文档写尚未完成的通过数字。
每个候选须维护者人工验收通过后，才能提交或发布；0.1.6 的验收单独记录于上文。

已验收 0.1.5 运行 ZIP 和 tag 保持不变，包内 README 的候选字样属于打包时点文字，
后续维护者确认以外层验证记录为准。当前源码 README 可继续改进文档及增加托管截图链接，
无需改写已验收归档。复现或核对已验收发行时，使用不可变版本 tag 与所记录 ZIP，
不以之后源码 README 的哈希代替。如需重新打包，使用 `--output-dir` 选择独立目录，防止覆盖冻结 ZIP。原始自动化报告保留，人工验收另行记录；
示例模板仍为 `pending`，不是已经完成的维护者验收记录。

0.1.6 的已验收 ZIP 和原始报告绑定冻结源码提交
[`e1635aa`](https://github.com/YpXstyle/qwenpaw-plugins/commit/e1635aab12c028da2d8f0d1cc90a2f9557d0ef5d)。
包内候选字样属于打包时点文字。之后仅文档的修订会更新源码 README 和变更记录，
它们也是 ZIP 成员，因此较新工作树与已验收包的源码字节不同。
历史预检须使用冻结源码提交、所记录 ZIP 及匹配证据。
发行使用[0.1.6 记录](docs/validation/yance-ask-user-question-0.1.6.md)中的已验收 ZIP，
不把之后的文档修订重新打包，也不覆盖原归档。

将[验收示例](docs/manual-acceptance.example.json)复制到本地证据目录，如实填写：

| 字段             | 含义                            |
| ---------------- | ------------------------------- |
| `plugin_id`      | 已安装插件的稳定 ID             |
| `version`        | 候选版本                        |
| `archive_sha256` | 实际测试 ZIP 的 SHA-256         |
| `tested_by`      | 执行验收的人                    |
| `tested_at`      | ISO 8601 格式的验收时间         |
| `result`         | 只有该人确认通过后才为 `passed` |

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

当前[市场版本 0.1.6](https://platform.agentscope.io/plugins/yance-ask-user-question)状态为 `published`，
[公开安装 ZIP](https://agentscope-platform-sg-bucket.oss-accelerate.aliyuncs.com/plugin-platform/yance-ask-user-question/0.1.6/yance-ask-user-question-0.1.6.zip)
与已验收本地 ZIP 的归档字节不同，但八个非目录文件完全一致，另多一个目录条目。
两份归档及哈希分别保留于[0.1.6 记录](docs/validation/yance-ask-user-question-0.1.6.md)。
目前未创建 GitHub Release 资产。

历史版本的[源码仓库](https://github.com/YpXstyle/qwenpaw-plugins)及 0.1.5 源码 tag 已上传，
[市场 0.1.5 已发布](https://platform.agentscope.io/plugins/yance-ask-user-question)并提供真实安装包，尚未创建 GitHub Release 资产。
0.1.5 已通过维护者桌面验收。该版本市场 ZIP 与已验收本地 ZIP 的归档字节不同，
八个成员路径和文件内容相同，两份哈希记录于[市场发布材料](docs/marketplace-listing_zh.md)。
已发布状态不代表已独立核验安全扫描结果。使用实际 QwenPaw 字段，不套用其他平台规则，
也不为准备材料改写已验收归档。

本仓 tag 约定为 `<插件ID>-v<版本>`，例如
`yance-ask-user-question-v0.1.5`。这是集合仓库的管理约定，不是 QwenPaw 官方要求。
源码同仓管理，各插件仍独立维护版本及发行。
