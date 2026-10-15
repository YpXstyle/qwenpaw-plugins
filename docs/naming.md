# Naming and migration

English | [简体中文](naming_zh.md)

## Current identifiers

| Purpose                       | Value                                   |
| ----------------------------- | --------------------------------------- |
| Display name                  | Ask User Question by Yance              |
| Plugin ID                     | `yance-ask-user-question`               |
| Tool name and approval source | `yance_ask_user_question`               |
| Source directory              | `plugins/tool/yance-ask-user-question/` |
| Test module                   | `tests/yance_ask_user_question/`        |
| Answer API                    | `/api/yance-ask-user-question/answer`   |
| UI readiness marker           | `yance_ask_user_question_ui`            |
| Current version               | `0.1.5` maintainer accepted             |
| Independent tag convention    | `yance-ask-user-question-v0.1.5`        |

Plugin IDs use lowercase letters/digits and hyphens and must be unique.
The `yance-` author prefix is this collection's collision-avoidance choice,
not an official requirement that every plugin use this prefix. The local
repository directory remains `qwenpaw-plugins`; it is not a runtime ID.
Our tag format is also a collection convention rather than an official rule.

## Distinguish the native clarification tool

Data Console has a built-in `ask_user_question` for its own clarification
workflow. Its contract includes names such as `multiSelect`, `title`,
`selected_options` and `custom_text`. This plugin uses the host-pinned
framework contract with `multi_select`, `header` and structured
`AskUserMetadata.answers` containing `question`, `selected` and `other`.

These are separate tools, registrations and result contracts. This plugin
does not replace, rename, disable or override the native tool and does not
claim to implement the Data Console workflow. Its supported scope remains
direct interactive main-agent Console Chat. A distinct prefix reduces
name collision risk without proving universal compatibility.

## Migrate an earlier preview installation

Earlier local versions 0.1.0, 0.1.1 and any 0.1.2 prototype using
`ask-user-question-preview` are installed under a different ID. Their tool
name was `ask_user_question_preview`; their answer endpoint and marker
belong to that old plugin, not to the new namespace.

1. Finish or decline old pending questions. Keep the original accepted
   0.1.1 ZIP and its evidence unchanged.
2. Uninstall only the old plugin:

   ```bash
   qwenpaw plugin uninstall ask-user-question-preview
   ```

3. Install the new candidate ZIP without treating it as a same-ID upgrade:

   ```bash
   qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.5.zip"
   ```

4. Refresh Console, check that the old plugin tool is no longer available,
   explicitly enable `yance_ask_user_question` for the target Agent, then
   start a new direct Chat turn. New installation does not enable the tool
   automatically.

Leave official `ask_user_question` registrations untouched. Pending waits,
answer drafts and old tool configuration are not automatically migrated.
For an offline installation, first extract the ZIP and install the plugin
directory as explained in the [plugin README](../plugins/tool/yance-ask-user-question/README.md).
All paths shown are local placeholders, not published download links.

## Future upgrades and acceptance

Once the new ID is installed, later versions retaining
`yance-ask-user-question` can use `qwenpaw plugin install ... --force`.
This includes the same-ID 0.1.4 to 0.1.5 upgrade. Keep accepted packages
and evidence unchanged. Each candidate needs its own validation and
manual acceptance. Maintainer **Yance** has confirmed 0.1.5 Desktop
acceptance; see the [validation record](validation/yance-ask-user-question-0.1.5.md).
That operation still does not persist unanswered forms. A changed plugin
ID, source, version or ZIP hash needs matching validation and manual
acceptance; older prototype acceptance does not transfer automatically.

Version 0.1.5 changes recommendation display, not the English brand name,
plugin ID, tool name or schema. The Chinese default description remains.
Its settings page is
`/plugins/yance-ask-user-question`. Syncing an existing description is a
separate, explicit action for the selected Agent; it does not reinstall
the plugin or automatically update every Agent. Finish old pending
questions, refresh Console and start a new conversation after upgrading.
For source-launched Desktop, close the window and wait for the launch
command to exit before restarting.

This local collection is independent of the QwenPaw feature PR. Naming
and migration here do not alter its source, branch or published PR.
The public [source repository](https://github.com/YpXstyle/qwenpaw-plugins)
contains the 0.1.4 source tag, and 0.1.5 version source is maintained in
this repository. GitHub Release and marketplace publication are separate
and have not been completed.
