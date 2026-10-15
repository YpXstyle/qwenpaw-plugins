# Changelog / 变更记录

[English README](README.md) · [中文说明](README_zh.md)

Each entry identifies its release state. Earlier local candidates are not
marketplace releases. / 各条目分别标明发行状态，早期本地候选不代表市场发行。

## 0.1.5 — 2026-10-15 — Marketplace release / 插件市场发布

[AgentScope marketplace](https://platform.agentscope.io/plugins/yance-ask-user-question) ·
[Source tag](https://github.com/YpXstyle/qwenpaw-plugins/tree/yance-ask-user-question-v0.1.5) ·
[Validation and acceptance](../../../docs/validation/yance-ask-user-question-0.1.5.md)

- Fix explicit recommendation-marker display: accept English `Recommended`
  case-insensitively and Chinese `推荐` in paired ASCII/full-width
  parentheses. Ignore trailing whitespace for display only, without
  stripping zero-width characters.
- Separately display marked options first, stably within marked/unmarked
  groups. Preserve source option order/labels, selections, answer metadata
  and schema; do not preselect or infer markers from description/position.
- Keep the official AskUser model instruction unchanged. Seven-language
  badges/UI do not expand parsing to other marker languages.
- Publish 0.1.5 to the AgentScope plugin marketplace after maintainer
  acceptance. Preserve the accepted archive, source tag and earlier
  version evidence. Subsequent README/gallery revisions change source
  documentation without replacing the published plugin files.

- 修复显式推荐标记显示：成对半角/全角括号内的英文 `Recommended` 忽略大小写，中文接受 `推荐`；
  仅显示匹配忽略尾空白，不删除零宽字符。
- 独立修复带标记选项稳定置前展示，两组内部保持原顺序；原选项顺序/标签、选择、答案 metadata
  和 schema 不变，不自动预选，不从说明或位置推断标记。
- 官方 AskUser 模型指令保持不变，七语徽标/界面不等于解析其他语言标记。
- 维护者人工验收后，0.1.5 已发布至 AgentScope 插件市场。已验收包、源码标签及早期版本证据保持不变；
  后续 README/图库修订仅调整源码文档，不替换已上架插件文件。

## 0.1.4 — Source tagged / 源码已打 tag

- Use a Chinese default plugin/tool description while preserving the
  English brand name, stable IDs, seven-language UI and bilingual READMEs.
- Add an independent settings page at `/plugins/yance-ask-user-question`
  with explicit current-Agent tool-description sync through a plugin HTTP
  interface backed by the host's official atomic configuration-update API.
  Preserve enablement and other configuration;
  do not sync every Agent automatically or uninstall the plugin.
- Compare the expected description and update only the plugin tool under
  the host configuration lock; reject Agent mismatches, missing tools and
  changed descriptions. No full-tools PUT, Agent reload or task-idle
  requirement is introduced.
- Keep 0.1.3 question behavior, the strict English `(Recommended)` suffix
  and framework contracts unchanged. Refresh/restart old frontend sessions
  after upgrading. Validation and human acceptance belong to the exact
  candidate/source/archive hashes; preserve 0.1.3 packages and recorded evidence.

- 插件/工具默认介绍使用中文，保留英文品牌名、稳定 ID、七语界面和双语 README。
- 新增独立设置页 `/plugins/yance-ask-user-question`，通过插件 HTTP 接口复用宿主官方原子配置更新 API，
  显式同步当前 Agent 的工具介绍，保留开关和其他配置，不自动遍历全部 Agent 或卸载插件。
- 在宿主配置锁内比较预期介绍，仅更新本插件工具；Agent 身份不符、工具不存在或介绍变化时拒写，
  不发送全 tools PUT，不重新加载 Agent，也不要求任务空闲。
- 保留 0.1.3 问卷行为、严格英文 `(Recommended)` 后缀及框架契约，升级后刷新或重启旧前端。
  验证和人工验收绑定具体候选、源码及 ZIP 哈希，保留 0.1.3 安装包及已记录证据。

Source tag: [yance-ask-user-question-v0.1.4](https://github.com/YpXstyle/qwenpaw-plugins/tree/yance-ask-user-question-v0.1.4).
This is source publication, not a GitHub Release or marketplace listing. /
这是源码发布，不是 GitHub Release 或插件市场上架。

## 0.1.3 — Local candidate / 本地候选

- Fix question-card body sizing through the public `Card.classNames.body`
  API under the host's real `qwenpaw` component prefix. Measure available
  height from the plugin's own anchor and `visualViewport`, preserving
  answer drafts while resizing compact desktop windows.
- Keep the recommendation star visible after selection. Recognition still
  requires the exact `(Recommended)` label suffix; no new schema field,
  automatic selection or description-based inference is introduced.
- Document the native Tools list's raw-field localization limit and the
  distinction between submitting a card answer, queueing a Chat message
  and explicitly interrupting the current run.
- Target QwenPaw 2.2.2 at `5c56644a6e130762a236f8c946103e95a0a1eec8`
  with AgentScope 2.0.10. Each version/archive needs its own validation
  and user acceptance evidence; keep 0.1.2 evidence unchanged.

- 使用公开 `Card.classNames.body` API 修复真实 `qwenpaw` 组件前缀下的卡片 body
  尺寸约束；按插件自有锚点和 `visualViewport` 测量可用高度，调整较小桌面窗口时保留答案草稿。
- 推荐项选中后仍保留星标；只识别标签严格的 `(Recommended)` 后缀，
  不新增 schema 字段、不自动选择，也不从说明文字猜测推荐。
- 说明原生工具列表使用原始字段的本地化限制，并区分卡片提交答案、主 Chat 消息排队及显式打断当前运行。
- 目标为 QwenPaw 2.2.2 `5c56644a6e130762a236f8c946103e95a0a1eec8` 与 AgentScope 2.0.10。
  每个版本/ZIP 均需自身验证及用户验收证据，0.1.2 证据保持不变。

## 0.1.2 — Local candidate / 本地候选

- Add a recommendation star and soft green outline for labels ending
  exactly in `(Recommended)`, without automatic selection or schema changes.
- Move into a plugin collection with shared validation and packaging tools.
- Split English/Chinese plugin documentation and add collection development,
  manual acceptance and local preflight instructions.
- Adopt the independently namespaced ID `yance-ask-user-question`, tool/source
  `yance_ask_user_question` and display name Ask User Question by Yance.
  Earlier prototypes require explicit uninstall/reinstall; no pending or
  tool-configuration migration is performed.
- Keep framework contracts and the previously accepted 0.1.1 artifact unchanged.

- 为严格以 `(Recommended)` 结尾的选项增加推荐星标和柔和绿色边框，不自动预选，不改变 schema。
- 整理为插件集合，使用通用核验与打包工具。
- 拆分插件中英文说明，补齐集合开发、人工验收及本地发行预检文档。
- 使用独立命名的 ID `yance-ask-user-question`、工具/来源 `yance_ask_user_question`
  及展示名 Ask User Question by Yance；早期原型须明确卸载后安装，不迁移待答或工具配置。
- 保留框架契约及此前 0.1.1 验收产物。

## 0.1.1 — Local validation artifact / 本地验证产物

- Standardize the earlier prototype's display name as Ask User Question and author as Yance.
- Add seven-language descriptions/UI and maintainer contact in Details.
- Retain stable installation/tool identifiers and document the installed
  plugin list's localization limit.

- 早期原型展示名规范为 Ask User Question，作者规范为 Yance。
- 补齐七语简介/界面及详情中的维护者联系方式。
- 保留稳定安装和工具标识，说明已安装插件列表的本地化限制。

## 0.1.0 — Initial local preview / 初始本地预览

- Bridge direct Console questions through the unmodified host approval
  service, with framework schema and structured answer metadata.
- Supply a built question-card frontend and a local runtime ZIP packager.

- 通过未经修改的宿主审批服务桥接直接 Console 提问，使用框架 schema 和结构化答案 metadata。
- 提供已构建的问答卡前端及本地运行包打包工具。
