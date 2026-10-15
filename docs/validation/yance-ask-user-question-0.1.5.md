# Ask User Question by Yance 0.1.5: validation and acceptance

English | [简体中文](#人工验收与验证记录)

Version **0.1.5** passed maintainer acceptance on **2026-10-15 (Asia/Shanghai)** after
restarting QwenPaw Desktop. They confirmed that the question card's details
showed 0.1.5 and that recommendation highlighting, icons and ordering worked.
The [six example screenshots](../yance-ask-user-question-gallery.md)
illustrate the accepted UI. Screenshot captions distinguish selection from
recommendation; images alone do not prove backend metadata or every test case.

## Accepted artifact

| Item                    | Verified value                                                     |
| ----------------------- | ------------------------------------------------------------------ |
| Plugin ID               | `yance-ask-user-question`                                          |
| Version                 | `0.1.5`                                                            |
| ZIP filename            | `yance-ask-user-question-0.1.5.zip`                                |
| ZIP size                | 140,959 bytes                                                      |
| ZIP SHA-256             | `7f4c4aea13c6df522ee1d42d57db0d28cee498216a9102fece11ac19feae0fe0` |
| Frontend bundle SHA-256 | `12ce66b1f324c1854a4e2002a1994b6bb06f17889c6da8205cb2e49552fec8e5` |
| Tested host             | QwenPaw `2.2.2`, commit `5c56644a6e130762a236f8c946103e95a0a1eec8` |
| Framework               | AgentScope `2.0.10`                                                |

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

Before source upload, all **50 source fingerprints** still matched that run.
All eight ZIP members matched the current packaged sources. The subsequent
gallery and collection-level documentation updates are outside the runtime
package and that source snapshot.

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

Remote CI is independently visible in
[GitHub Actions](https://github.com/YpXstyle/qwenpaw-plugins/actions/workflows/validate.yml).
Source upload, a Git tag, local preflight, a GitHub Release and marketplace
publication are separate events. This record does not claim marketplace
submission, scanning approval or publication.

## 人工验收与验证记录

维护者 **Yance** 于 **2026-10-15（北京时间）**确认本版本通过人工验收：
重启后问卷详情显示 **0.1.5**，推荐高亮、图标和排序均正常。
[六张示例图](../yance-ask-user-question-gallery_zh.md)展示实际界面；橙色表示已选，
推荐由星标、标签和独立样式标识。截图不单独证明 metadata 或全部边界用例。

已验收 ZIP 的文件名、大小及 SHA-256 见上表，保持原始字节。
包内 README 的候选状态属于打包时点；最新人工验收以本记录为准。
原自动验证报告保持历史状态，另存人工确认记录并绑定上述精确 ZIP 哈希。

自动化结果为 **151 个前端测试、99 个后端及发行测试全部通过，无失败或跳过**，
并通过钉住版本的 pre-commit、类型检查、构建、格式、打包及隔离安装检查。
提交前 50 项源码指纹、8 个 ZIP 成员仍与既有证据一致。
本轮外层图库及集合文档更新不进入运行包。

额外浏览器证据覆盖官方 Console 的明暗主题、每主题 8 个窗口尺寸及 14 组推荐样例，
验证星标/样式、多推荐、导航、预览、自由文本和原始标签/metadata 回传。
这些定向自动检查、维护者的真实模型/桌面验收及 GitHub CI 分别记录，不能互相替代。
本记录不宣称完整 QwenPaw 测试已运行，也不宣称插件市场已提交、通过扫描或上架。

升级后若插件列表显示新版本、问卷详情仍显示旧版本，应结束旧待答，完整刷新 Console，
或退出源码启动的桌面窗口、等待 `qwenpaw desktop` 命令退出后重新启动。
新建对话本身不会重新加载已打开页面中的前端插件。
