# QwenPaw marketplace listing materials

English | [简体中文](marketplace-listing_zh.md)

## Status

Maintainer **Yance** manually accepted source version **0.1.6**, confirming
removal of the extra page and normal questions and recommendations. Its
marketplace materials are prepared, but it is not published. See the
[0.1.6 validation and acceptance record](validation/yance-ask-user-question-0.1.6.md).
The marketplace release below remains **0.1.5**.

Use the accepted 0.1.6 ZIP bound to source commit
[`e1635aa`](https://github.com/YpXstyle/qwenpaw-plugins/commit/e1635aab12c028da2d8f0d1cc90a2f9557d0ef5d)
for a later submission. Its packaged candidate wording reflects packing time;
later source README/changelog acceptance updates do not rewrite that ZIP.

[Ask User Question by Yance 0.1.5 is published in the AgentScope marketplace](https://platform.agentscope.io/plugins/yance-ask-user-question).
The public listing reports version `0.1.5`, author **Yance** and the
correct [source repository](https://github.com/YpXstyle/qwenpaw-plugins).
The source and [0.1.5 tag](https://github.com/YpXstyle/qwenpaw-plugins/tree/yance-ask-user-question-v0.1.5)
are uploaded. No GitHub Release asset has been created.
Maintainer **Yance** confirmed 0.1.5 Desktop acceptance after restarting.
This published status does not establish a separately verified security-scan result.

The public ZIP is linked in the table below. Its archive bytes differ
from the accepted local ZIP (DEFLATE versus STORED), but all eight member
paths and contents were verified identical. The [validation record](validation/yance-ask-user-question-0.1.5.md)
keeps both SHA-256 values and the evidence separate.

The accepted local ZIP, earlier packages and release tags remain unchanged.
Its packaged README's candidate wording reflects packing time; subsequent
maintainer acceptance is recorded in the [validation record](validation/yance-ask-user-question-0.1.5.md).
The current source [plugin README](../plugins/tool/yance-ask-user-question/README.md#screenshots)
contains the six original Desktop screenshots and their evidence limits.

## Fields to prepare

Prepare these QwenPaw-specific fields. The publishing form checked on
2026-10-15 confirms the 10 MiB ZIP limit; follow current form and server
validation for other limits.

| Field                    | Value or action                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package                  | One plugin ZIP, at most 10 MiB. Prepare the exact accepted 0.1.6 ZIP in its [validation record](validation/yance-ask-user-question-0.1.6.md); the published [0.1.5 ZIP](https://agentscope-platform-sg-bucket.oss-accelerate.aliyuncs.com/plugin-platform/yance-ask-user-question/0.1.5/yance-ask-user-question-0.1.5.zip) remains the current public download. |
| Name                     | Ask User Question by Yance                                                                                                                                                                                                                                                                                                                                      |
| Plugin ID / version      | `yance-ask-user-question` / `0.1.6`; confirm values parsed from the final package                                                                                                                                                                                                                                                                               |
| Type                     | Manifest `tool`; confirm/select the matching plugin type offered by the platform                                                                                                                                                                                                                                                                                |
| Author                   | Yance; contact `xstyle@qq.com` is documented in the README, not an invented manifest email field                                                                                                                                                                                                                                                                |
| Backend / frontend entry | `backend/plugin.py` / `frontend/dist/index.js`                                                                                                                                                                                                                                                                                                                  |
| Dependencies             | None added; use host-provided AgentScope `2.0.10`                                                                                                                                                                                                                                                                                                               |
| Host compatibility       | Declared minimum `2.2.2`; evidence target `2.2.2 / 5c56644a6e130762a236f8c946103e95a0a1eec8`, not every admitted version                                                                                                                                                                                                                                        |
| Description              | Use the draft below and check current form/server validation before submission                                                                                                                                                                                                                                                                                  |
| Source repository        | `https://github.com/YpXstyle/qwenpaw-plugins`; version source is maintained here, separate from marketplace publication                                                                                                                                                                                                                                         |
| Changelog                | Use the 0.1.6 changelog draft below: remove the extra settings page/menu/API; preserve the question and recommendation contracts                                                                                                                                                                                                                                |
| Rights / license         | Confirm publication rights and Apache-2.0 agreement when authorized to proceed                                                                                                                                                                                                                                                                                  |

Name, version, author, entries, dependencies and compatibility are extracted from the package.
The current form requires package parsing, plugin type and the rights agreement before proceeding.
Repository URL and changelog have no required rule in that form; a nonempty repository URL must be valid HTTP/HTTPS.
Server parse/preview warnings and `can_submit` remain authoritative for the actual submission.

## Description draft

<!-- listing-description:start -->

Ask User Question by Yance collects structured answers in direct interactive Console or Desktop Chat, then resumes the same Agent turn. Ask 1–4 questions with 2–4 described options each, single/multiple selection and an Other/free-text alternative. Answer one question at a time and submit the batch after all are answered.

Display recognizes explicit English Recommended or Chinese 推荐 suffixes in paired ASCII/full-width parentheses. Every marked option receives the recommendation treatment and displays first, preserving relative order within both groups. No answer is preselected; raw option labels, framework schema and submitted answers remain unchanged. The model's official English-marker instruction is unchanged.

The question card and Details support seven UI languages; native lists use Chinese default descriptions without automatic language switching. Version 0.1.6 requires no extra plugin configuration or settings page: enable the tool in the host's Agent tools page. Existing descriptions, tool switches and saved configuration are preserved without automatic rewriting. Target host: QwenPaw 2.2.2 at 5c56644a with AgentScope 2.0.10. The tool is disabled by default. IM, subagents, cross-agent/remote delegation, ACP/TUI, unattended jobs, Inbox and restart recovery are unsupported.

<!-- listing-description:end -->

## 0.1.6 changelog draft

Remove the standalone description-sync page, menu and dedicated HTTP interface.
No extra plugin configuration is required; enable the tool in the host's Agent
tools page. Preserve existing English/custom descriptions, switches and other
saved configuration. Question rendering, recommendation display, framework
schema and answer metadata remain unchanged.

## Optional visual material

Six original 0.1.5 maintainer Desktop screenshots, with concise evidence limits,
are embedded directly in the plugin's [English README](../plugins/tool/yance-ask-user-question/README.md#screenshots)
and [Chinese README](../plugins/tool/yance-ask-user-question/README_zh.md#screenshots).
The files belong to `plugins/tool/yance-ask-user-question/docs/images/0.1.5/`;
no cropping or image changes were made. Orange alone is selection, not a
recommendation. The pictures are source documentation and are not added
to the eight-file runtime ZIP whitelist or the already accepted archive.
The current publishing form has no required screenshot, video or demo
field; such material is optional, not another platform's gate.

## Procedure for later submissions

After exact-ZIP validation and maintainer acceptance, follow [local release preflight](../RELEASING.md).
Publish source/tag/release assets only as explicitly authorized, then use the real URLs.
On the [official publishing page](https://platform.agentscope.io/plugins/publish), parse the package, review fields, confirm rights, save a draft and preview it.
Submit security scanning only when publication is authorized. The publishing page describes scanning before a new submission becomes publicly installable; the status of the already published 0.1.5 listing is recorded separately above.
Successful local tests or a source tag do not establish scan approval or marketplace publication.

References: [official plugin documentation](https://github.com/agentscope-ai/QwenPaw/blob/5c56644a6e130762a236f8c946103e95a0a1eec8/website/public/docs/plugins.en.md),
[current official publishing form](https://g.alicdn.com/yly287738/agentscope-platform-front/0.1.18/assets/usePluginDraftForm.js).
