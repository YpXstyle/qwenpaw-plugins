# QwenPaw marketplace listing draft

English | [简体中文](marketplace-listing_zh.md)

## Status

Source is uploaded to [YpXstyle/qwenpaw-plugins](https://github.com/YpXstyle/qwenpaw-plugins),
including the [0.1.4 source tag](https://github.com/YpXstyle/qwenpaw-plugins/tree/yance-ask-user-question-v0.1.4).
There is no GitHub Release, downloadable release asset or marketplace publication.
Maintainer **Yance** confirmed **0.1.5 Desktop acceptance after restarting**.
Its source is maintained in this repository. This document remains
marketplace preparation, not a submitted listing.
Keep the accepted older ZIPs unchanged.

The accepted 0.1.5 runtime ZIP is also unchanged, including candidate
wording written when it was packed. The later maintainer acceptance is recorded
in the [external validation record](validation/yance-ask-user-question-0.1.5.md)
and [Desktop gallery](yance-ask-user-question-gallery.md).

## Fields to prepare

These are QwenPaw's fields, checked against its official publishing page on 2026-10-15.

| Field                    | Draft value or action                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Package                  | Upload the exact accepted single-plugin ZIP, at most 10 MiB, or parse a real direct ZIP URL. No public ZIP URL exists yet. |
| Name                     | Ask User Question by Yance                                                                                                 |
| Plugin ID / version      | `yance-ask-user-question` / `0.1.5`; confirm values parsed from the final package                                          |
| Type                     | Manifest `tool`; confirm/select the matching plugin type offered by the platform                                           |
| Author                   | Yance; contact `xstyle@qq.com` is documented in the README, not an invented manifest email field                           |
| Backend / frontend entry | `backend/plugin.py` / `frontend/dist/index.js`                                                                             |
| Dependencies             | None added; use host-provided AgentScope `2.0.10`                                                                          |
| Host compatibility       | Declared minimum `2.2.2`; evidence target `2.2.2 / 5c56644a6e130762a236f8c946103e95a0a1eec8`, not every admitted version   |
| Description              | Use the draft below, within the platform's 2000-character limit                                                            |
| Source repository        | `https://github.com/YpXstyle/qwenpaw-plugins`; version source is maintained here, separate from marketplace publication    |
| Changelog                | Explicit English/Chinese marker compatibility and stable marked-first display; raw labels, schema and selections unchanged |
| Rights / license         | Confirm publication rights and Apache-2.0 agreement when authorized to proceed                                             |

Name, version, author, entries, dependencies and compatibility are extracted from the package.
The current form requires package parsing, plugin type and the rights agreement before proceeding.
Repository URL and changelog have no required rule in that form; a nonempty repository URL must be valid HTTP/HTTPS.
Server parse/preview warnings and `can_submit` remain authoritative for the actual submission.

## Description draft

<!-- listing-description:start -->

Ask User Question by Yance collects structured answers in direct interactive Console or Desktop Chat, then resumes the same Agent turn. Ask 1–4 questions with 2–4 described options each, single/multiple selection and an Other/free-text alternative. Answer one question at a time and submit the batch after all are answered.

Version 0.1.5 adds display compatibility for explicit English Recommended or Chinese 推荐 suffixes in paired ASCII/full-width parentheses. Every marked option receives the recommendation treatment and displays first, preserving relative order within both groups. No answer is preselected; raw option labels, framework schema and submitted answers remain unchanged. The model's official English-marker instruction is unchanged.

The plugin has seven-language UI, a Chinese default native-list description and explicit current-Agent description sync that preserves tool switches/configuration. Target host: QwenPaw 2.2.2 at 5c56644a with AgentScope 2.0.10. The tool is disabled by default. IM, subagents, cross-agent/remote delegation, ACP/TUI, unattended jobs, Inbox and restart recovery are unsupported. Each candidate needs its own validation and maintainer acceptance.

<!-- listing-description:end -->

## Optional visual material

The maintainer's six **0.1.5 Desktop retest originals** are available in the
[bilingual gallery](yance-ask-user-question-gallery.md), copied without
cropping or image changes under `docs/images/yance-ask-user-question/0.1.5/`.
They show ordinary selection, multiple selection, recommendation states
and long/single-question layouts. Orange alone is not a recommendation.
These are maintainer screenshots, not old bug images or automated acceptance
substitutes. Their individual evidence limits are described in the gallery.
Images are not added to the eight-file runtime ZIP whitelist.
The current publishing form has no required screenshot, video or demo field; such material is optional, not another platform's gate.

## Submission sequence

After exact-ZIP validation and maintainer acceptance, follow [local release preflight](../RELEASING.md).
Publish source/tag/release assets only as explicitly authorized, then use the real URLs.
On the [official publishing page](https://platform.agentscope.io/plugins/publish), parse the package, review fields, confirm rights, save a draft and preview it.
Submit security scanning only when publication is authorized. Before scanning passes the plugin is not online and its install link is inactive.
Successful local tests or a source tag do not establish scan approval or marketplace publication.

References: [official plugin documentation](https://github.com/agentscope-ai/QwenPaw/blob/5c56644a6e130762a236f8c946103e95a0a1eec8/website/public/docs/plugins.en.md),
[current official publishing form](https://g.alicdn.com/yly287738/agentscope-platform-front/0.1.18/assets/usePluginDraftForm.js).
