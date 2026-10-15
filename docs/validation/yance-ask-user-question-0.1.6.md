# Ask User Question by Yance 0.1.6: validation and acceptance

English | [简体中文](#人工验收与验证记录)

On **2026-10-15 (Asia/Shanghai)**, **Yance** confirmed that version **0.1.6**
passed manual acceptance: the redundant extension settings page was absent,
questions worked, and recommendation behavior worked. This confirmation did
not separately identify Web and Desktop test environments or individual edge
cases; those are not recorded as additional manual passes.

## Accepted artifact

| Item                     | Verified value                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plugin ID                | `yance-ask-user-question`                                                                                                                        |
| Version                  | `0.1.6`                                                                                                                                          |
| Accepted source snapshot | Commit [`e1635aab12c028da2d8f0d1cc90a2f9557d0ef5d`](https://github.com/YpXstyle/qwenpaw-plugins/commit/e1635aab12c028da2d8f0d1cc90a2f9557d0ef5d) |
| ZIP filename             | `yance-ask-user-question-0.1.6.zip`                                                                                                              |
| ZIP size                 | 127,683 bytes                                                                                                                                    |
| ZIP SHA-256              | `c667ec1d12a8d09f67627849fc5e1b6e52eaeb1fe318c6cb89b8713952f7dfcd`                                                                               |
| Frontend bundle SHA-256  | `d3e04f5385963024f3471059f0f313ecbc33c323364e6c16290765c5928c9e93`                                                                               |
| Tested host              | QwenPaw `2.2.2`, commit `5c56644a6e130762a236f8c946103e95a0a1eec8`                                                                               |
| Framework                | AgentScope `2.0.10`                                                                                                                              |

The accepted ZIP remains byte-for-byte unchanged. Its packaged documentation
describes the candidate when it was built. This dated record supplies the
later human acceptance; subsequent source README and changelog updates record
that later status without replacing the ZIP.

## Scope and preservation checks

Version 0.1.6 removes the standalone description-sync settings page, its menu
and route registrations, its client and backend endpoints, and code and tests
used exclusively by that auxiliary feature. No plugin-specific configuration
is required. The host's ordinary Agent tool enablement remains available.

The review checked the following boundaries against the previous source and
the accepted 0.1.5 archive:

- Six core question UI source files and four question/recommendation tests
  were byte-for-byte unchanged. Seven-language question messages were unchanged
  after excluding the removed description-sync messages.
- The backend module's syntax tree was unchanged after excluding only the
  description-sync imports, models, helpers, endpoints and description state.
  The question schema, instruction, approval bridge, identity boundaries,
  answer metadata, `DENIED`, timeout and cancellation logic were preserved.
- The production frontend module registers the approval renderer and request
  transform, with no settings route, menu or description-sync request.
- Installation retained full Agent profiles, including enabled and disabled
  tool states, nested configuration, custom English descriptions and unrelated
  tools. No automatic description migration or profile reset was introduced.
- The historical 0.1.5 release files and the separate host Compact changes
  remained unchanged.

## Automated evidence

Local validation run **`20261015T144737Z-78a18149`** passed all six runner steps:
applicable pinned pre-commit hooks, fresh frontend dependency installation,
frontend tests, TypeScript/build, formatting, and backend/install/release tests.

- **105 frontend tests** passed.
- **85 backend, installation and release tests** passed.
- Both suites reported no failures, errors or skipped tests.
- All **51 source fingerprints** matched the accepted source before the
  subsequent documentation-only update. All **eight ZIP members** matched
  their packaged sources.

A separate isolated upgrade test installed the immutable 0.1.5 ZIP, upgraded
to the exact 0.1.6 ZIP and completed a pending question through the official
HTTP answer flow. **One additional end-to-end test passed**. It verified full
configuration preservation for two Agents and answer metadata on the same
task. The removed description-sync GET and POST endpoints returned `404`.
Production module registration probes are contract evidence, not browser
manual acceptance. These checks do not claim the complete QwenPaw host suite.

## Acceptance and release gate

The automatic report retains its original `human_acceptance: pending` field
as historical build evidence. A separate acceptance record binds Yance's
confirmation to the exact ZIP SHA-256. Its timestamp records receipt of the
confirmation; the exact manual test execution time was not supplied.

The release preflight passed against the frozen accepted source above and
the separate human acceptance record. This is local release preparation,
not a marketplace publication or scan result. Preflight fingerprints apply
to that frozen source, not later documentation revisions. Do not rebuild the
accepted ZIP from a later README revision and describe it as the same
manually accepted artifact. Later CI archives are separate build evidence.

## Marketplace status

The official public APIs checked on 2026-10-15 report version label
**0.1.6** with status **`published`** at the existing
[marketplace entry](https://platform.agentscope.io/plugins/yance-ask-user-question).
The API's `published_at` value is `2026-10-15T23:24:00.312917`
(no timezone offset is supplied in that value).

| Marketplace artifact  | Verified value                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public package        | [yance-ask-user-question-0.1.6.zip](https://agentscope-platform-sg-bucket.oss-accelerate.aliyuncs.com/plugin-platform/yance-ask-user-question/0.1.6/yance-ask-user-question-0.1.6.zip) |
| ZIP size              | 44,939 bytes                                                                                                                                                                           |
| ZIP SHA-256           | `b4fe1848d0563cd6c850d68e975103db76ba2632bd87184cc4771506560db10f`                                                                                                                     |
| Non-directory members | Eight paths and their extracted bytes match the accepted ZIP above                                                                                                                     |
| Additional entry      | One directory entry; it adds no runtime file                                                                                                                                           |

The market archive and accepted local archive have different container bytes
and SHA-256 values. The original 127,683-byte accepted ZIP remains unchanged;
the public ZIP does not replace that manual-acceptance record. All eight
published non-directory files match the frozen package, including its
packing-time documentation. Later source documentation does not change either
archive. Published status is not a separately verified security-scan result.
The plugin name, plugin/tool identifiers, author and existing marketplace URL
remain unchanged. The six screenshots in the
[plugin README](../../plugins/tool/yance-ask-user-question/README.md#screenshots)
remain explicitly identified as 0.1.5 examples.

## 人工验收与验证记录

**Yance 于 2026-10-15（Asia/Shanghai）确认 0.1.6 人工测试通过**：扩展配置页面
已经消失，提问和推荐功能正常。本次确认没有分别说明 Web、桌面端环境，也没有逐项
报告边界场景，因此不额外补写这些人工通过结论。

本版仅移除简介同步专用的页面、菜单、路由、客户端、后端接口及相关无用代码和测试。
插件本身无需额外配置，宿主原有 Agent 工具开关仍可使用。六个核心问卷前端源文件、
四个问卷及推荐测试未变；七语言问卷文案未变。后端排除简介同步专属部分后语法树一致，
问卷 schema、指令、审批桥接、身份边界、答案回传、拒答 `DENIED`、超时和取消逻辑
均保留。升级测试确认工具开关、嵌套配置、自定义英文简介及其他工具配置完整保留，
没有新增自动迁移或重置。

自动验证通过 **105 项前端测试、85 项后端/安装/发布测试**，没有失败、错误或跳过，
另有 **1 项实际旧 ZIP 升级至本版 ZIP 的端到端测试**通过。51 个源码指纹、8 个
包内成员在冻结源码时均一致，发布预检也已通过。这些结果不代表运行了宿主全部 CI。

人工验收对应的源码提交、安装包大小和完整 SHA-256 见上表。**已验收 ZIP 不重打包、
不覆盖**；包内说明保留构建时的候选状态，后续源码 README、更新日志和本记录补充
验收结果。发布预检对应冻结提交，后续文档提交和 CI 新构建的包不冒充原人工验收包。

市场公开接口已确认 **0.1.6 已发布**，`version_label` 为 `0.1.6`，状态为 `published`。
`published_at` 原始值为 `2026-10-15T23:24:00.312917`（该值未提供时区偏移）。
[公开安装 ZIP](https://agentscope-platform-sg-bucket.oss-accelerate.aliyuncs.com/plugin-platform/yance-ask-user-question/0.1.6/yance-ask-user-question-0.1.6.zip)
为 **44,939 字节**，SHA-256 为
`b4fe1848d0563cd6c850d68e975103db76ba2632bd87184cc4771506560db10f`。
它与已验收本地 ZIP 的归档字节不同，但八个非目录成员的路径和解压字节完全相同，
另多一个不增加运行文件的目录条目。原 **127,683 字节**人工验收 ZIP 及其哈希不变，
两份归档和证据分别保留；源码文档后续更新不改写任一归档。
已发布状态不代表已独立核验安全扫描结果。历史 0.1.5 安装包、记录和六张示例图保留，
名称、标识及作者信息不变。
