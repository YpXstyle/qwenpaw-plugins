# Ask User Question by Yance 0.1.5: validation and acceptance

English | [简体中文](#人工验收与验证记录)

Version **0.1.5** passed maintainer acceptance on **2026-10-15 (Asia/Shanghai)** after
restarting QwenPaw Desktop. They confirmed that the question card's details
showed 0.1.5 and that recommendation highlighting, icons and ordering worked.
The [six example screenshots](../../plugins/tool/yance-ask-user-question/README.md#screenshots)
illustrate the accepted UI. Screenshot captions distinguish selection from
recommendation; images alone do not prove backend metadata or every test case.

## Accepted artifact

| Item                     | Verified value                                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin ID                | `yance-ask-user-question`                                                                                                                                              |
| Version                  | `0.1.5`                                                                                                                                                                |
| Accepted source snapshot | [`yance-ask-user-question-v0.1.5`](https://github.com/YpXstyle/qwenpaw-plugins/tree/yance-ask-user-question-v0.1.5), commit `614bc83187eb94420815fd5c4645f30b9eebbff6` |
| ZIP filename             | `yance-ask-user-question-0.1.5.zip`                                                                                                                                    |
| ZIP size                 | 140,959 bytes                                                                                                                                                          |
| ZIP SHA-256              | `7f4c4aea13c6df522ee1d42d57db0d28cee498216a9102fece11ac19feae0fe0`                                                                                                     |
| Frontend bundle SHA-256  | `12ce66b1f324c1854a4e2002a1994b6bb06f17889c6da8205cb2e49552fec8e5`                                                                                                     |
| Tested host              | QwenPaw `2.2.2`, commit `5c56644a6e130762a236f8c946103e95a0a1eec8`                                                                                                     |
| Framework                | AgentScope `2.0.10`                                                                                                                                                    |

The accepted ZIP remains byte-for-byte unchanged. Its packaged documentation
records the candidate's status when built; this dated record supplies the later
human acceptance. The local validation report retains its original
`human_acceptance: pending` field as historical evidence; a separate human
acceptance record binds the confirmation to the exact ZIP SHA-256.

## Automated evidence

The local run `20261015T083110Z-5a0eabea` passed:

- **151 frontend tests**, with no failed or skipped tests.
- **99 backend and release tests**, with no failures, errors or skips:
  38 contract, 16 description-sync, 20 HTTP, 8 packaging and 17 release tests.
- Pinned pre-commit hooks, TypeScript/build, frontend formatting, archive
  verification and isolated installation checks.

Before uploading the accepted source snapshot, all **50 source fingerprints**
still matched that run. All eight ZIP members matched its packaged sources.
Later README/gallery and documentation-packaging changes on `main` are
checked separately for formatting, links, packaging compatibility and CI.
The manifest excludes source documentation assets through `pack_exclude`.
These changes do not rebuild the accepted ZIP
or move its source tag. Historical preflight uses that frozen source snapshot,
not a later documentation revision.

Additional isolated browser evidence used the actual official Console UI in
light and dark themes, eight viewport sizes per theme, and 14 recommendation
sample groups per theme. It checked each explicit marker's icon and style,
navigation, preview, free text, and unchanged raw labels in answers and
framework metadata. This deterministic browser check is separate from the
maintainer's real-model/Desktop acceptance and is not full QwenPaw CI.

The change accepts explicit English `Recommended` or Chinese `推荐` terminal
markers in paired ASCII/full-width parentheses. Every marked option is styled;
marked options appear first with stable ordering within each group. No option
is preselected, and raw labels, schema and answer identities remain intact.
The backend, AGENT identity policy and documented support boundaries are
unchanged from 0.1.4.

The accepted source snapshot passed both its
[main CI](https://github.com/YpXstyle/qwenpaw-plugins/actions/runs/38712610532)
and [tag CI](https://github.com/YpXstyle/qwenpaw-plugins/actions/runs/38712610407).
Later documentation revisions have their own runs in
[GitHub Actions](https://github.com/YpXstyle/qwenpaw-plugins/actions/workflows/validate.yml).

## Marketplace publication

On 2026-10-15 the official public detail and versions APIs confirmed that
[Ask User Question by Yance](https://platform.agentscope.io/plugins/yance-ask-user-question)
version **0.1.5** has status **`published`** and the correct source repository.
The market archive was downloaded for read-only comparison:

| Archive            | Size          | SHA-256                                                            |
| ------------------ | ------------- | ------------------------------------------------------------------ |
| Accepted local ZIP | 140,959 bytes | `7f4c4aea13c6df522ee1d42d57db0d28cee498216a9102fece11ac19feae0fe0` |
| Marketplace ZIP    | 48,600 bytes  | `fbaab84653ddbeeb60fde8dfb6fc6c9340905ee08d5e0270eb6e30ac75db2887` |

All **eight member paths and file contents are byte-for-byte identical**.
The local archive uses stored members; the marketplace archive uses DEFLATE.
The different ZIP hashes do not indicate changed plugin files. No GitHub
Release was created. Publication status is distinct from a security-scan
result; the public response did not supply a separate scan result.

## 人工验收与验证记录

维护者 **Yance** 于 **2026-10-15（北京时间）**确认本版本通过人工验收：
重启后问卷详情显示 **0.1.5**，推荐高亮、图标和排序均正常。
[六张示例图](../../plugins/tool/yance-ask-user-question/README_zh.md#screenshots)展示实际界面；橙色表示已选，
推荐由星标、标签和独立样式标识。截图不单独证明 metadata 或全部边界用例。

已验收 ZIP 的文件名、大小及 SHA-256 见上表，保持原始字节。
包内 README 的候选状态属于打包时点；最新人工验收以本记录为准。
原自动验证报告保持历史状态，另存人工确认记录并绑定上述精确 ZIP 哈希。

自动化结果为 **151 个前端测试、99 个后端及发行测试全部通过，无失败或跳过**，
并通过钉住版本的 pre-commit、类型检查、构建、格式、打包及隔离安装检查。
原发行源码提交前，50 项源码指纹、8 个 ZIP 成员仍与既有证据一致。
该源码标签及已验收包保持不变；`main` 后续 README/图库调整属于独立文档修订，
单独检查格式、链接及 CI，不将其冒充原 50 项源码指纹验证。

额外浏览器证据覆盖官方 Console 的明暗主题、每主题 8 个窗口尺寸及 14 组推荐样例，
验证星标/样式、多推荐、导航、预览、自由文本和原始标签/metadata 回传。
这些定向自动检查、维护者的真实模型/桌面验收及 GitHub CI 分别记录，不能互相替代。
本记录不宣称完整 QwenPaw 测试已运行。

2026-10-15 已通过市场公开详情及版本接口核实：
[插件市场 0.1.5](https://platform.agentscope.io/plugins/yance-ask-user-question)状态为 `published`。
下载的市场 ZIP 使用 DEFLATE 压缩，大小为 48,600 字节，整包 SHA-256 见上表；
与本地已验收 ZIP 相比，8 个文件的路径和字节全部相同。
README/图库后续修订不改写已上架 ZIP，也不会自动替换平台从原 ZIP 提取的 README。
尚未创建 GitHub Release；市场接口没有返回独立扫描结果，不据此另行声称扫描结论。

升级后若插件列表显示新版本、问卷详情仍显示旧版本，应结束旧待答，完整刷新 Console，
或退出源码启动的桌面窗口、等待 `qwenpaw desktop` 命令退出后重新启动。
新建对话本身不会重新加载已打开页面中的前端插件。
