# QwenPaw 插件市场材料草稿

[English](marketplace-listing.md) | 简体中文

## 当前状态

源码已上传至 [YpXstyle/qwenpaw-plugins](https://github.com/YpXstyle/qwenpaw-plugins)，
包含 [0.1.4 源码 tag](https://github.com/YpXstyle/qwenpaw-plugins/tree/yance-ask-user-question-v0.1.4)。
目前没有 GitHub Release、可下载发行资产或市场上架。
维护者 **Yance** 重启后已确认 **0.1.5 Desktop 人工验收**，版本源码纳入本仓库；
本文仍只准备市场材料，不代表已提交。
已验收旧 ZIP 保持原字节。

已验收的 0.1.5 运行 ZIP 同样保持不变，其中候选字样属于打包时点文字；
后续维护者验收见[外层验证记录](validation/yance-ask-user-question-0.1.5.md)及
[桌面图库](yance-ask-user-question-gallery_zh.md)。

## 待准备字段

以下按 2026-10-15 核实的 QwenPaw 官方发布页整理。

| 字段            | 草稿值或操作                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| 插件包          | 上传已验收的精确单插件 ZIP，不超过 10 MiB；或解析真实可直下 ZIP URL。目前尚无公开 ZIP 地址。              |
| 名称            | Ask User Question by Yance                                                                                |
| 插件 ID / 版本  | `yance-ask-user-question` / `0.1.5`，以最终包解析值复核                                                   |
| 类型            | 清单为 `tool`，核对/选择平台提供的对应插件类型                                                            |
| 作者            | Yance；联系邮箱 `xstyle@qq.com` 写在 README，不发明清单邮箱字段                                           |
| 后端 / 前端入口 | `backend/plugin.py` / `frontend/dist/index.js`                                                            |
| 依赖            | 不新增依赖，使用宿主提供的 AgentScope `2.0.10`                                                            |
| 适配版本        | 声明最低 `2.2.2`；证据目标为 `2.2.2 / 5c56644a6e130762a236f8c946103e95a0a1eec8`，不是所有准入版本均已验证 |
| 插件说明        | 可采用下方草稿，不超过平台 2000 字限制                                                                    |
| 源码仓库        | `https://github.com/YpXstyle/qwenpaw-plugins`；版本源码纳入本仓库，与市场发布相互独立                     |
| 变更说明        | 显式英文/中文标记兼容，以及带标记项稳定置前展示；原标签、schema 及选择不变                                |
| 权利 / 许可证   | 获准继续时确认拥有发布权利并同意 Apache-2.0                                                               |

名称、版本、作者、入口、依赖和适配版本由包解析。
当前表单要求先解析包、选择插件类型并确认权利协议，才可继续。
源码 URL 和变更说明在该表单中无必填规则；非空 URL 须为有效 HTTP/HTTPS。
实际提交仍须遵循服务器解析/预览提示及 `can_submit` 状态。

## 插件说明草稿

<!-- listing-description:start -->

Ask User Question by Yance 在直接交互的 Console 或桌面 Chat 中收集结构化答案，然后继续同一 Agent 轮次。每次 1–4 问，每题 2–4 个带说明的选项，支持单选、多选和客户端提供的“其他/自由输入”。逐题作答，全部完成后统一提交。

0.1.5 显示层兼容成对半角/全角括号中的显式英文 Recommended 或中文“推荐”后缀。所有带标记选项均显示推荐样式，并稳定置前，两组内部保持原相对顺序。不自动预选，不修改原选项标签、框架 schema 或回传答案；框架原始英文标记指令保持不变。

插件界面支持七语，原生列表默认介绍为中文；设置页可显式同步当前 Agent 的工具介绍，保留开关和配置。目标宿主为 QwenPaw 2.2.2 / 5c56644a，框架为 AgentScope 2.0.10，工具默认禁用。不支持 IM、子 Agent、跨配置/远程委托、ACP/TUI、无人值守任务、Inbox 或重启恢复。每个候选均须有自身验证及维护者验收证据。

<!-- listing-description:end -->

## 可选效果素材

维护者提供的六张 **0.1.5 Desktop 复测原图**已放入[双语图库](yance-ask-user-question-gallery_zh.md)，
按原字节复制到 `docs/images/yance-ask-user-question/0.1.5/`，没有裁剪或改图。
图片展示普通单选、多选、推荐状态及长题/单题布局，橙色本身不表示推荐。
这些是维护者的图，不是旧 bug 图或用来代替人工验收的自动化图；单图证明边界见图库。
图片不进入八文件运行包白名单。
当前发布表单没有截图、视频或 demo 必填字段，这些是可选素材，不套用其他平台门禁。

## 提交流程

精确 ZIP 验证及维护者验收后，依照[本地发行预检](../RELEASING_zh.md)。
仅按明确授权上传源码、tag 或发行资产，再填写真实地址。
在[官方发布页](https://platform.agentscope.io/plugins/publish)解析包、核对字段、确认权利、保存草稿并预览。
只有获得发布授权后才提交安全扫描；扫描通过前不上线，安装链接不生效。
本地测试或源码 tag 不等于扫描通过，也不等于市场发布。

参考：[官方插件文档](https://github.com/agentscope-ai/QwenPaw/blob/5c56644a6e130762a236f8c946103e95a0a1eec8/website/public/docs/plugins.zh.md)、
[当前官方发布表单](https://g.alicdn.com/yly287738/agentscope-platform-front/0.1.18/assets/usePluginDraftForm.js)。
