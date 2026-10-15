# 插件布局与官方要求

[English](plugin-layout.md) | 简体中文

## 上游要求

QwenPaw 插件文档定义了包含 `plugin.json` 和声明入口的插件目录。
ID 和版本为必需字段，入口路径相对于该插件目录，前端入口指向已构建的 JavaScript。
官方打包器会检查每个声明入口。安装器消费单个插件目录或其 ZIP，
不会把多插件源码仓库作为一个插件整体安装。

上游建议 README 说明功能、安装、示例、配置和排错，
没有要求每插件独立仓库，也没有要求拆成中英文两个文件。
参考[开发基线的官方插件文档](https://github.com/agentscope-ai/QwenPaw/blob/5c56644a6e130762a236f8c946103e95a0a1eec8/website/public/docs/plugins.zh.md)。

## 本集合的选择

使用 `plugins/{tool,bundle,memory,apps}/<插件ID>/` 管理源码，
测试放在 `tests/<module>/`，复用通用核验与打包脚本。
各插件保留独立版本、中英文 README 和变更记录，按插件分别发行 ZIP。
源码同仓不要求插件同时发行。这参考了官方的多插件目录和
[独立打包能力](https://github.com/agentscope-ai/QwenPaw/blob/5c56644a6e130762a236f8c946103e95a0a1eec8/scripts/pack/generate_plugin_metadata.py)。

`<插件ID>-v<版本>` tag 与人工验收记录是我们自己的管理约定。
上游 OSS 发布工作流是上游维护者的部署流程，不要求社区插件采用相同托管方式或凭据。
当前命名及与 Data Console 澄清契约的区别见[命名与迁移](naming_zh.md)。

根双语 README 保持插件目录定位，完整示例及截图放在各插件中英文 README，
两种语言均提供 `#screenshots` 入口。原图归属
`plugins/<类别>/<插件ID>/docs/images/<版本>/`，根通用指南链接这些章节。
运行包不包含图片时，README 可使用绝对托管原图 URL，并说明查看图片需要联网。
当前源码的文档更新不替换已验收、已冻结 ZIP 中的 README。

## 交付边界

Ask User Question by Yance ZIP 包含后端运行文件、单个前端构建产物、清单、许可证和中英文文档。
不包含前端源码、node_modules、测试环境和用户状态。源码目录仍需先构建前端，才能打包。

插件复用宿主接口及宿主钉住的 AgentScope 契约，不安装第二套 AgentScope 运行时。
最低宿主版本是准入约束，不是对所有未来版本的兼容承诺。
在验证报告中记录准确兼容性和验收结果，以及它们实际覆盖的产物哈希。

## 简介元数据与原生页面

目标宿主正式支持 `description_i18n`，但已安装插件 API/列表和原生插件工具行
仍使用普通简介；只有官方目录等部分页面消费多语言说明。
官方没有独立的 `name_i18n` 或原生工具 `display_name` 字段。
兼容的 `name`/`description` 多语言对象会按英文优先压成字符串，不按当前界面语言动态选择。

因此本集合使用中文默认介绍，保留英文品牌名、稳定 ID、七语插件界面和中英文 README。
已有 Agent 的工具介绍可能已持久保存，仅修改清单不会覆盖它们。
插件设置页通过自己的 HTTP 接口提供当前 Agent 的显式同步，复用宿主官方
`update_agent_config_async(agent_id, updater)` API，在同一宿主配置锁内比较保存的介绍，
仅修改本工具 description，保留其他值。这不是上游已有的专用介绍 HTTP 接口，也不修改宿主源码。
不发送全 tools PUT，不重新加载 Agent，也不自动迁移全部 Agent。

市场材料准备独立于源码上传及运行包打包。
实际 QwenPaw 提交字段、当前状态与可选演示材料见[市场发布材料](marketplace-listing_zh.md)。
源码 tag 不等于可下载的插件 ZIP，也不等于市场审核通过。
