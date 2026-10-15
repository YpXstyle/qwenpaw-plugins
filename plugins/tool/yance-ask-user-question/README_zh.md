# Ask User Question by Yance

[English](README.md) | 简体中文 | [变更记录](CHANGELOG.md)

在直接交互的 Console 对话中收集结构化答案，然后在同一 Agent 轮次继续执行。

**版本：**0.1.4 本地候选 · **作者：**Yance · **许可证：**Apache-2.0

插件 ID：`yance-ask-user-question`；工具名与审批来源：`yance_ask_user_question`。
这些标识与 0.1.2 保持一致，工具**默认禁用**。
本插件由个人独立维护，尚未通过 AgentScope 插件市场审核或发布。

## 功能

- 每次提出 1–4 个问题，每题 2–4 个带说明的选项，支持多选及客户端提供的“其他/自由输入”。
- 逐题作答，上一题/下一题保留草稿，全部作答后统一提交整批答案。
- 仅为标签严格以 `(Recommended)` 结尾的选项显示星标，选中后仍保留；未选中时显示淡绿边框/背景。
  推荐项放首位由模型负责，客户端不自动选择或重排，不新增 `recommended` 字段，也不从说明文字猜测推荐。
- 显示问题背景和当前选中单选选项的 `preview`，多选题不显示选项预览。
- 阻塞中的工具在同一调用、同一轮取得结构化答案；拒答、停止、超时或缺少答案均不会生成默认选择。
- 原生插件/工具列表默认使用中文介绍；独立七语设置页可显式同步当前 Agent 的已有工具介绍，保留其设置。

表单中的“其他”与已有选项互斥：输入非空自由文本会清空已选项，选择选项会清空自由文本。
多选题仍可同时选择多个已有选项。

问答卡保留 0.1.3 的 `Card.classNames.body` 布局，适配真实 `qwenpaw` 组件前缀，
按实际锚点和 `visualViewport` 测量可用空间，用于处理非全屏、较矮桌面窗口中的标题/操作遮挡，
布局变化时保留草稿。0.1.4 不改变问卷行为及严格英文推荐标记。
本候选的自动化与用户验收仍待完成，既有 0.1.3 安装包和验收证据保持不变。

## 安装与升级

候选 ZIP 已含前端构建产物，使用者无需 npm、Node.js 或源码构建。
以下均为示例本地路径，不是已发布的下载地址。

QwenPaw 运行时，通过插件管理界面上传 ZIP，或执行：

```bash
qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.4.zip"
```

开发基线中的 CLI 会把本地 ZIP 上传给运行中服务的 API。
服务未运行时，先解压，再安装含 `plugin.json` 的插件目录：

```bash
qwenpaw plugin install "/path/to/unpacked/yance-ask-user-question"
```

下次启动宿主时加载。刷新 Console，在目标 Agent 中启用
`yance_ask_user_question`，再开始新的直接 Chat 轮次。
安装沿用已有 Agent 和模型配置，无需再次执行 `init --defaults`。
安装后刷新页面；源码启动的桌面版应先关闭窗口，等启动命令退出后再启动，
确保前端加载新包。为新版验收开启新的直接对话，已打开的 Chat 页面可能仍在使用旧前端代码。

### 迁移早期预览安装

早期使用 `ask-user-question-preview` 的 0.1.0、0.1.1 及任何仍使用该 ID 的本地
0.1.2 原型属于另一项安装。先完成或拒绝旧待答，再只卸载旧插件：

```bash
qwenpaw plugin uninstall ask-user-question-preview
qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.4.zip"
```

刷新 Console，确认旧插件工具已不再可用，在目标 Agent 中明确启用
`yance_ask_user_question`，再开始新轮次。新工具不会自动启用，
待答、草稿和旧工具配置均不自动迁移。不要修改官方 `ask_user_question` 工具。
保留原 0.1.1 ZIP 和证据，新 ID/版本/哈希需要自己的验收。

### 相同 ID 从 0.1.3 升级到 0.1.4

已经安装 `yance-ask-user-question` 0.1.3 时，使用 `--force`
替换为相同 ID 的 0.1.4 候选：

```bash
qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.4.zip" --force
```

先完成或拒绝待答，之后刷新 Console；源码启动的桌面版先关闭窗口，
等启动命令退出后再启动。检查 Agent 工具设置并开始新对话，未提交答案不迁移。
既有 0.1.3 安装包和验收证据保持不变，之后仍保留该 ID 的升级采用同一命令形式，并替换为实际版本 ZIP。
已有工具介绍不会随清单自动更新，请使用下方设置页显式同步。
同步介绍无需卸载插件、重新初始化 QwenPaw，或启用原本关闭的工具。
源码集合中的[命名与迁移说明](../../../docs/naming_zh.md)提供详细解释。

卸载命令：

```bash
qwenpaw plugin uninstall yance-ask-user-question
```

## 使用示例

Agent 调用 `yance_ask_user_question` 后，选择选项或填写“其他”，逐题确认并提交整批答案。
Agent 获得答案后继续当前轮次，你也可以拒绝回答。
工具可用不保证每个模型都会调用它；真实模型行为需要单独验收。

### 可复现的推荐人工验收

明确要求 Agent 调用 **`yance_ask_user_question`**，按下面输入提问并原样保留选项标签。
这是人工验收夹具，不是用户此前那次提问实际使用这些标签的证据。

```json
{
  "questions": [
    {
      "question": "Which plan should be used for the recommendation style check?",
      "header": "Recommend",
      "options": [
        {"label": "方案 A (Recommended)", "description": "Plan A for the marked option."},
        {"label": "方案 B", "description": "Plan B for the unmarked alternative."}
      ],
      "multi_select": false
    },
    {
      "question": "Which plan should be used without a recommendation hint?",
      "header": "No hint",
      "options": [
        {"label": "方案 C", "description": "Plan C without a recommendation suffix."},
        {"label": "方案 D", "description": "Plan D without a recommendation suffix."}
      ],
      "multi_select": false
    }
  ]
}
```

先不选择，确认只有首个选项有星标和淡绿样式，且没有预选；再选它，确认橙色星标仍保留。
第二题没有推荐后缀，应不出现臆造的推荐。回退、调整桌面窗口确认草稿保留，再答完两题统一提交。
判断前从“参数”核对实际标签；模型给出不同载荷时，不代表这份夹具已被执行。
不能添加 `recommended` 属性，也不能从 `description` 的描述文字猜测推荐。

## 等待时在哪里回答

问答卡的“提交答案”是结构化答案入口，卡内“其他/自由输入”仍然可用。
底部主 Chat 输入框是独立草稿/消息输入。在目标宿主上，运行繁忙时的正常发送按官方队列处理，
属于后续轮次，不会回答当前待答。“打断并发送”会先停止当前运行再发送队列消息，
属于取消等待，而不是提交答案；停止仍由宿主处理。

插件沿用宿主语义，不通过私有方式全局禁用输入，也不声称阻断所有新 Chat 请求。
切换 Agent/会话后，不能让其他对话被错误禁用。

## 配置、语言与权限

插件无需额外 Python 依赖或专用 API Key。
按 Agent 启用工具，继续使用宿主既有模型配置及权限策略。
提问或回答不会授权后续敏感工具操作。

问答卡、“详细信息”和插件设置跟随宿主语言，覆盖简体中文、英语、俄语、日语、印尼语、巴西葡萄牙语和越南语。
卡片不会翻译模型生成的问题或选项。详情提供本地化简介、版本、作者和联系方式；
展示名始终为 **Ask User Question by Yance**。

0.1.4 的插件/工具默认介绍为中文，这是原生列表的固定兜底，并非列表自动国际化。
清单 `description_i18n` 是插件简介元数据，不是工具名翻译 API。
目标宿主的原生工具列表有意使用插件的 raw 字段，`yance_ask_user_question`
和通用说明不会在那里动态翻译；该宿主的已安装插件列表也使用通用简介。
插件自己的问答卡、详情和设置可切换七语。官方 CDN 元数据生成器仅输出中英说明，
市场另有本地化链路，本地包不证明市场页面的显示行为。

### 同步已有 Agent 的工具介绍

先选择目标 Agent，通过插件菜单打开 **`/plugins/yance-ask-user-question`** 设置页，
核对当前 Agent 和已保存的介绍，再显式点击同步按钮，应用本版本的中文介绍。
仅打开页面不会写配置；操作只针对该 Agent 的 `yance_ask_user_question`，
不切换工具开关、不自动同步全部 Agent，也不卸载或重新安装插件。

页面调用本插件自己的 **`/api/yance-ask-user-question/description-sync`** 接口。
GET 读取当前 Agent ID 及本工具当前/目标介绍；POST 提交 `agent_id` 和 `expected_description`。
后端复用宿主官方 `qwenpaw.config.config.update_agent_config_async(agent_id, updater)` API，
在宿主配置锁内对照最新配置检查预期介绍，只将本工具 description 更新为已安装插件的目标文本，
保留工具开关、自定义配置及其他工具。Agent 身份不符、工具不存在或介绍已变化时拒写；
冲突或读取失败后先重新加载显示状态，再显式重试。

这是插件接口复用宿主原子配置更新 API，不是上游已有的专用介绍 HTTP 接口。
它不发送完整 tools PUT，不重新加载 Agent，也不直接修改宿主源码或配置文件。
同步介绍无需停止当前提问或暂停 heartbeat；框架提供给模型的说明/schema 及问答契约保持不变。

回答请求沿用宿主认证中间件及运行时边界，也沿用宿主本地或关闭认证时的访问策略。
Chat 的 `yance_ask_user_question_ui: "1"` 是界面就绪提示，
**不是认证、授权或版本保证**。

审批身份策略为 **AGENT**，校验插件来源、请求、主会话和 Agent 归属；
不是 EXACT 或“最初提问的同一用户”绑定。
同一 Agent/会话仅允许一个活跃提问；同轮已执行的 `tool_call_id` 不再重放，
不承诺跨轮或重启幂等。

## 支持范围与兼容性

支持范围为**直接交互的 Console Chat 主 Agent**。
桌面 Chat 使用相同扩展接口，但 **0.1.4 仍需在实际目标桌面版本中人工验收**；
此前浏览器或 0.1.3 的结果不能代替这项验收。

不支持 IM、子 Agent、跨配置委托、远程 Agent、ACP、TUI、cron、heartbeat、
mail monitor、其他无界面/无人值守入口、Inbox 和重启持久恢复。
已知不受支持的上下文在等待前退出，不保证能识别旧宿主的所有远程来源。

待答与答案 sidecar 仅保存在当前进程。
插件关闭和卸载回调会唤醒本插件自己的等待，不恢复或持久化未提交的表单。
拒答返回 `DENIED`，停止返回 `INTERRUPTED`；超时、关闭插件或未提交答案而从原生界面批准时返回 `ERROR`。

| 项目 | 版本与证据边界 |
| --- | --- |
| 开发基线 | QwenPaw `2.2.2`，提交 `5c56644a6e130762a236f8c946103e95a0a1eec8` |
| 当前候选自动化验收目标 | 当前唯一目标为正式版 `2.2.2 / 5c56644a6e130762a236f8c946103e95a0a1eec8`；本轮待验证，结果绑定最终 ZIP 哈希 |
| 清单与实际版本检查 | 声明 `min: 2.2.2`；规范推导上界 `<2.3.0`，但当前开发基线暂时只强制检查最低版本，不强制上界 |
| 框架依赖 | 宿主提供的 AgentScope `2.0.10`，不额外安装另一份框架 |
| 其他宿主版本 | 尚未逐版验证，加载范围不是全范围兼容保证 |
| Web 与桌面人工验收 | 0.1.4 均待本轮用户确认，旧版测试结果不代替新版验收 |

开发基线为未经修改的上游 QwenPaw `5c56644a`（`2.2.2`），
使用宿主钉住的 AgentScope `2.0.10`。清单最低版本 `2.2.2` 是准入条件，
不证明未来宿主版本均兼容，升级后需重新验证。
插件使用扩展注册，不修改宿主源码或审批方法；审批和调用上下文仍是存在版本耦合的宿主实现接口。

`AskUserParams` 提供发给模型的 schema 及校验，包括 `multi_select`、必填说明及唯一性规则。
`preview` 仅用于单选的契约由 UI 遵循，该框架校验器并不强制拒绝这一组合。
成功结果通过 `ToolChunk.metadata` 返回 `AskUserMetadata`，推荐样式不改变这些契约。
本插件使用受治理的普通工具桥接宿主审批等待，不引入 external-tool 执行回路。
框架先检查权限，不借用内置 AskUser 恒定的 `ALLOW` 绕过宿主治理。

独立工具名不会覆盖将来的内置 `ask_user_question`。
转用内置功能前停用或卸载本插件，避免 Agent 同时获得两个同用途工具；不进行自动迁移。

本插件不替代 Data Console 内置的 `ask_user_question`。
后者的澄清流程使用 `multiSelect`、`title`、`selected_options`、`custom_text` 等不同契约名；
本插件使用框架 `multi_select`/`header` 和 `AskUserMetadata.answers`。
两者的注册、请求和结果不能互换。

## 故障排查

| 现象 | 检查方式 |
| --- | --- |
| Agent 不会使用工具 | 确认插件已加载、目标 Agent 已启用工具，刷新 Console 后开启直接 Chat 新轮次。 |
| 看不到提问表单 | 检查包内前端构建产物及加载状态；原生 Inbox 和无界面入口不受支持。 |
| 看不到推荐星标 | 原始选项标签必须严格以 `(Recommended)` 结尾，客户端不会自行猜测推荐。 |
| 选中后星标消失 | 按上述夹具核验并记录实际标签和版本；重测前刷新或重启旧前端。 |
| 较矮桌面窗口遮住标题/操作 | 在真实宿主前缀下核验本版本并记录窗口大小、缩放和视口；隔离夹具不代替桌面验收。 |
| 原生工具列表显示原始工具名 | 这是当前宿主对插件工具的展示策略；使用该精确 ID，通过插件详情阅读本地化说明。 |
| 已有工具介绍仍为英文 | 在插件设置页针对该 Agent 显式同步默认介绍；修改清单不会覆盖已有保存值。 |
| 同步不可用或被拒绝 | 核对当前 Agent、工具是否存在及当前介绍；读取失败或介绍冲突后重新加载，不通过卸载绕过检查。 |
| 同步前介绍已被修改 | 锁内比较会拒绝过期预期值；读取当前值后再显式重试。 |
| 看不到设置菜单或新版本 | 刷新 Console；源码启动的桌面版先关闭窗口，等启动命令退出再启动，确认安装版本后开始新对话。 |
| 底部输入文字未解决待答 | 这是独立消息/草稿，可能进入队列；请在问答卡提交结构化答案。 |
| 没有选项预览 | 先选择带 `preview` 的单选选项，多选题不显示预览。 |
| 提交失败 | 检查宿主登录、当前 Agent 和有效期；当前表单会在提交失败后保留草稿。 |
| 请求已过期或已处理 | 请让 Agent 新建提问，旧请求不能重放。 |
| 原生审批直接通过但无答案 | 工具返回错误，应使用插件 Chat 表单收集结构化答案。 |
| 问题仍是模型使用的语言 | 语言切换只翻译插件界面，不翻译模型编写的问题和选项。 |
| 升级宿主后加载或行为异常 | 对新宿主重新验证，不通过安装第二套框架运行时绕过问题。 |

## 构建与验证

开发者从集合仓库根目录使用通用脚本，ZIP 使用者不执行这些命令：

```bash
python scripts/validate_plugin.py --plugin yance-ask-user-question --host-source "/path/to/QwenPaw"
python scripts/package_plugin.py --plugin yance-ask-user-question --output-dir dist
```

精确 ZIP 的人工验收及本地预检见[集合仓库发行流程](../../../RELEASING_zh.md)。
该链接用于源码目录；安装包内包含插件中英文 README 和变更记录。
包中仅收录八个运行/文档文件，体积不超过 10 MiB，并提供 ZIP 及成员哈希证据。
不分发前端源码、node_modules、用户状态或第二套 AgentScope 运行时。

自动化结果仅覆盖其记录的源码和产物哈希，不证明上游全量 CI、云模型行为、桌面验收或市场批准。
目前 0.1.4 候选需完成自身验证和人工验收，旧版本结果单独保留。
本候选须用户人工验收通过后，才能提交或发布。

## 许可证与维护

采用 Apache-2.0，见 [LICENSE](LICENSE)。维护者：**Yance**。
联系邮箱：[xstyle@qq.com](mailto:xstyle@qq.com)。
反馈时请附宿主/插件版本、使用语言、复现步骤和已去除凭据的错误信息。
