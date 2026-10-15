# Ask User Question by Yance

English | [简体中文](README_zh.md) | [Changelog](CHANGELOG.md)

Collect structured answers during direct Console conversations, then resume
the same Agent turn.

**Source version:** 0.1.6 · **Status:** local candidate awaiting manual acceptance · **Author:** Yance · **License:** Apache-2.0

Plugin ID: `yance-ask-user-question`. Tool and approval source:
`yance_ask_user_question`. These identifiers are unchanged from 0.1.2;
the tool is **disabled by default**. This independently maintained plugin
is [published as 0.1.5 in the AgentScope marketplace](https://platform.agentscope.io/plugins/yance-ask-user-question).
Maintainer **Yance** confirmed 0.1.5 Desktop acceptance after restarting.
Version 0.1.6 removes the description-sync page, menu and dedicated HTTP
interface; it is a local candidate, not published or manually accepted. The
[source repository](https://github.com/YpXstyle/qwenpaw-plugins) includes
the 0.1.5 source tag. No GitHub Release asset has been created.

## Features

- Ask 1–4 questions with 2–4 described options each, including multiple
  selection and an Other/free-text alternative supplied by the client.
- Answer one question at a time. Previous/Next preserves drafts; the final
  submission sends the complete batch after every question is answered.
- Recognize explicit terminal English `Recommended` markers without case
  sensitivity and Chinese `推荐` markers in paired `()` or `（）`.
  Trailing whitespace is ignored for display matching only; zero-width
  characters are not stripped. Every marked option keeps a star when selected
  and has a soft green outline/background when unselected.
- Separately display marked options first, retaining source order within
  the marked and unmarked groups. The original option array/labels,
  selection state and answer payload are unchanged. Nothing is preselected;
  there is no new `recommended` field or inference from description/position.
- Show question context and the currently selected single-choice option's
  preview. Multiple-choice questions do not show option previews.
- Return structured answers to the waiting tool in the same call and turn.
  Refusal, stop, timeout and missing answers do not invent a choice.
- Show a Chinese default description on native plugin/tool lists. No extra
  plugin configuration or separate settings page is required; enable the
  tool in the host's Agent tools page.

In this form, Other and listed options are alternatives: typing non-empty
Other clears selected options; choosing an option clears Other. Multiple
selection still allows more than one listed option.

The question form retains the 0.1.3 layout using `Card.classNames.body` for the real
`qwenpaw` component prefix, with available space measured from its actual
anchor and `visualViewport`. This targets clipped headers/actions in short,
non-fullscreen desktop windows while retaining drafts during layout changes.
The framework's model instruction still requests English `(Recommended)`
and first position; it is unchanged. Chinese markers are display
compatibility, not a schema change. Other marker languages are not parsed;
seven-language support refers to the plugin's badges and interface.
Each candidate requires evidence bound to its own source/ZIP. The accepted
0.1.5 artifact and earlier accepted ZIPs remain byte-for-byte unchanged.
See [Screenshots](#screenshots) for the captured Desktop states.

## Install and upgrade

The published stable version is still 0.1.5. Install it from the [AgentScope marketplace](https://platform.agentscope.io/plugins/yance-ask-user-question) or use the published
0.1.5 ZIP URL with QwenPaw running:

```bash
qwenpaw plugin install "https://agentscope-platform-sg-bucket.oss-accelerate.aliyuncs.com/plugin-platform/yance-ask-user-question/0.1.5/yance-ask-user-question-0.1.5.zip"
```

The ZIP includes its built frontend. End users do not need npm, Node.js
or a source build. To test the local 0.1.6 candidate, upload its validated
ZIP through plugin management or use a real local path, for example:

```bash
qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.6.zip"
```

On the development-baseline CLI, a local ZIP is uploaded to the running
service's API. Without a running service, extract the ZIP first and install
the directory containing `plugin.json`:

```bash
qwenpaw plugin install "/path/to/unpacked/yance-ask-user-question"
```

It loads at the next host start. Refresh Console, enable
`yance_ask_user_question` for the target Agent, then start a new direct
Chat turn. Installation uses your existing Agent and model configuration;
you do not need to run `init --defaults` again.
Refresh the page after installation. For source-launched Desktop, close
its window, wait for the launch command to exit, then start it again so
the frontend loads the new package. Begin a new direct conversation for
this version's acceptance; an already open Chat page may still use old
frontend code.

### Migrate an earlier preview installation

The earlier `ask-user-question-preview` prototypes (0.1.0, 0.1.1 and any
local 0.1.2 using that ID) are a different installation. Finish or decline
their pending questions, then uninstall only that old plugin:

```bash
qwenpaw plugin uninstall ask-user-question-preview
qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.6.zip"
```

Refresh Console, confirm the old plugin tool is no longer available, and
explicitly enable `yance_ask_user_question` for the target Agent before a
new Chat turn. The new tool is not automatically enabled. Pending waits,
form drafts and old tool configuration are not migrated. Leave the
official `ask_user_question` tool untouched. Keep the original 0.1.1 ZIP
and its evidence; a new ID/version/hash requires its own acceptance.

### Upgrade the same ID from 0.1.5 to the 0.1.6 candidate

If `yance-ask-user-question` 0.1.5 is installed, use `--force` to replace it
with the validated local 0.1.6 candidate under the same ID:

```bash
qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.6.zip" --force
```

Finish or decline pending questions first. Afterwards refresh Console;
for source-launched Desktop, close the window and wait for its launch
command to exit before restarting. Check the Agent's tool settings and
begin a new conversation. This does not migrate unsubmitted answers.
Keep the accepted 0.1.5 package and evidence unchanged. Later upgrades
retaining this ID use the same command form with their actual versioned ZIP.
Existing English or customized tool descriptions, tool switches and other
saved configuration are preserved. Upgrading does not automatically
overwrite descriptions. Version 0.1.6 has no description-sync page or endpoint.
See [naming and migration](../../../docs/naming.md) in the source collection.

To uninstall:

```bash
qwenpaw plugin uninstall yance-ask-user-question
```

## Example

In a direct Console Chat, ask:

> Help me choose an implementation approach. Ask two structured questions
> first, wait for my answers, then continue with the plan.

When the Agent calls `yance_ask_user_question`, select options or use
Other, navigate between questions, then submit the batch. The Agent receives
the answers and continues that turn. You can also decline the request.
Tool availability does not guarantee that every model will choose to call
it; model behavior needs its own real-model acceptance.

### Reproducible recommendation acceptance

Ask the Agent to call **`yance_ask_user_question` explicitly** with the
following input, preserving every option label and its source position.
The first question reproduces the reported Chinese marker on the second
option; the second checks that unmarked options stay unmarked.

```json
{
  "questions": [
    {
      "question": "请选择每晚住宿预算",
      "header": "住宿预算",
      "options": [
        { "label": "200-400/晚", "description": "较低的每晚住宿预算。" },
        {
          "label": "400-600/晚（推荐）",
          "description": "更宽裕的每晚住宿预算。"
        }
      ],
      "multi_select": false
    },
    {
      "question": "Which plan should be used without a recommendation hint?",
      "header": "No hint",
      "options": [
        {
          "label": "方案 C",
          "description": "Plan C without a recommendation suffix."
        },
        {
          "label": "方案 D",
          "description": "Plan D without a recommendation suffix."
        }
      ],
      "multi_select": false
    }
  ]
}
```

Before selecting anything, verify that `400-600/晚` is displayed first
with a star and soft green treatment, although it is second in Parameters.
There must be no preselection. Select it and verify that its star remains.
On the second question, verify no recommendation is invented and source
order remains. Navigate back and resize to check retained drafts, then
submit both answers. The first selected value must remain exactly
`400-600/晚（推荐）`, including its original marker.

Also check `(Recommended)`, `(recommended)`, `（RECOMMENDED）`, `(推荐)`
and `（推荐）`, with ordinary trailing whitespace. A zero-width character
after the marker, such as the notation `(推荐)\u200B`, is not stripped and
must not match. `(不推荐)`, a marker in the middle of a label and a
description mentioning recommendation do not imply a badge. Multiple
marked options keep their relative source order when displayed first.
Inspect Parameters before judging results: a different model payload is
not proof of this fixture. Do not add a `recommended` property or infer
recommendation from option position.

## Screenshots

Maintainer **Yance** provided these six original Desktop screenshots for
0.1.5. They are preserved without cropping or image changes. The maintainer
confirmed the restarted card's Details showed 0.1.5 and that recommendation
highlighting, icons and ordering worked; individual screenshots below prove
only their visible state, not the whole answer/result flow. See the
[version validation record](https://github.com/YpXstyle/qwenpaw-plugins/blob/main/docs/validation/yance-ask-user-question-0.1.5.md) for the acceptance boundary.

### Ordinary single selection, dark theme

![Dark theme: one ordinary option selected](https://raw.githubusercontent.com/YpXstyle/qwenpaw-plugins/main/plugins/tool/yance-ask-user-question/docs/images/0.1.5/dark-single-choice-selected.png)

Orange indicates the selected option. No recommendation badge is present;
selection color alone does not mean recommended.

### Multiple options selected, dark theme

![Dark theme: all four multiple-choice options selected](https://raw.githubusercontent.com/YpXstyle/qwenpaw-plugins/main/plugins/tool/yance-ask-user-question/docs/images/0.1.5/dark-multiple-choice-all-selected.png)

All four listed options are selected. This shows a multiple-selection
state, not a separate one-click Select all feature or a recommendation.

### Recommendation before selection, dark theme

![Dark theme: an unselected recommended option with a star and green treatment](https://raw.githubusercontent.com/YpXstyle/qwenpaw-plugins/main/plugins/tool/yance-ask-user-question/docs/images/0.1.5/dark-recommended-unselected.png)

The explicit recommendation has a star, badge and soft green treatment.
Nothing is selected and Next is disabled. The collapsed Parameters do not
independently establish the original source order.

### Long question, light theme

![Light theme: a wrapping question with options and navigation visible](https://raw.githubusercontent.com/YpXstyle/qwenpaw-plugins/main/plugins/tool/yance-ask-user-question/docs/images/0.1.5/light-long-question-selected.png)

The long heading wraps while options and navigation remain visible at the
captured window size. The orange option is selected without a recommendation
badge; this image does not establish every window size or zoom level.

### One question ready to submit, light theme

![Light theme: an answered single question with Submit answer enabled](https://raw.githubusercontent.com/YpXstyle/qwenpaw-plugins/main/plugins/tool/yance-ask-user-question/docs/images/0.1.5/light-single-question-submit.png)

A selection enables Submit answer. This is the state before submission,
not proof of a completed request or returned metadata.

### Recommendation before selection, light theme

![Light theme: an unselected recommended option with Submit answer disabled](https://raw.githubusercontent.com/YpXstyle/qwenpaw-plugins/main/plugins/tool/yance-ask-user-question/docs/images/0.1.5/light-recommended-unselected.png)

The star, badge and green treatment mark the recommendation. Submit answer
is disabled because no choice has been made; the recommendation is not
preselected.

These images belong to this plugin's source documentation. Their absolute
hosted URLs require network access when viewing an unpacked README. This
source documentation update does not repack the accepted 0.1.5 ZIP or
rewrite its README or release tag.

## While waiting: where to answer

The question card's Submit action is the structured answer entry point.
Other/free-text inside that card remains usable. The bottom Chat composer
is a separate draft/message input. On the targeted host, normal sends
while a run is busy follow the host's queue and belong to a later turn;
they do not answer the pending question. Explicit interrupt-and-send stops
the current run before sending the queued message, rather than answering
the question. Stop remains a host action.

The plugin follows these host semantics and does not impose a private,
global input disable. It does not claim to block every new Chat request;
switching Agent/session must not leave another conversation disabled.

## Configuration, language and authority

There are no additional plugin settings, Python dependencies or plugin API keys. Enable
the tool per Agent and keep using the host's model configuration and
permission policy. Asking or answering does not grant permission for later
sensitive tools.

The question card and Details follow the host language: Simplified Chinese,
English, Russian, Japanese, Indonesian, Brazilian Portuguese and Vietnamese.
The Agent's question text and option labels are not translated by the card.
Details shows the localized plugin description, version, author and contact.
The display name stays **Ask User Question by Yance**.

The default plugin/tool description is Chinese. This is a fixed
fallback for native lists, not automatic list internationalization.
Manifest `description_i18n` is plugin-description metadata, not a tool-name
translation API. The targeted host's native Tools list intentionally uses
raw plugin tool fields, so `yance_ask_user_question` and its general
description are not dynamically translated there. The installed-plugin
list also uses its general description on this host. The plugin's own
question card and Details support seven languages. The official CDN metadata
generator exports only Chinese/English; marketplace rendering uses another
path and is not established by this local package.

### Existing Agent configuration

Manage tool enablement in the host's Agent tools page. Version 0.1.6
removes the standalone description-sync page and its dedicated HTTP
interface. Existing English/custom descriptions, switches and saved
configuration remain unchanged. The framework model description/schema
and question-answer contract remain unchanged.

Answer requests follow the host's authentication middleware and runtime
boundary, including its local or disabled-auth policy. The Chat readiness
marker `yance_ask_user_question_ui: "1"` is a capability hint, **not
authentication, authorization or a version guarantee**.

Approval identity is **AGENT**, with plugin/source, request, root-session
and Agent ownership checks. It is not an EXACT/original-user identity lock.
Only one request can be active per Agent/session. Reusing an executed
`tool_call_id` in the same turn is rejected; cross-turn/restart idempotency
is not promised.

## Support and compatibility

Supported scope is **direct interactive Console Chat with its main Agent**.
Desktop Chat shares the extension interfaces. Maintainer **Yance** accepted
0.1.5 on the target Desktop build after restarting; see the
[validation record](https://github.com/YpXstyle/qwenpaw-plugins/blob/main/docs/validation/yance-ask-user-question-0.1.5.md). Each new candidate requires its own
manual acceptance. Earlier browser/version results do not establish that
acceptance.

IM, subagents, cross-configuration delegation, remote agents, ACP, TUI,
cron, heartbeat, mail monitoring, other headless/unattended entry points,
Inbox and persisted restart recovery are unsupported. Known unsupported
contexts exit before waiting; complete identification of every remote
origin on the old host is not claimed.

Pending requests and answer sidecars are process-local. Plugin shutdown
and uninstall callbacks wake this plugin's waits, without restoring or
persisting unfinished forms. Refusal returns `DENIED`, stopping returns
`INTERRUPTED`, and timeout, shutdown or native approval without submitted
answers returns `ERROR`.

| Item                                  | Version and evidence boundary                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Development baseline                  | QwenPaw `2.2.2`, commit `5c56644a6e130762a236f8c946103e95a0a1eec8`                                                                                  |
| Candidate automated acceptance target | Stable `2.2.2 / 5c56644a6e130762a236f8c946103e95a0a1eec8`; every candidate has its own source/ZIP-bound validation report                           |
| Manifest and actual version checks    | Declared `min: 2.2.2`; the documented derived upper bound is `<2.3.0`, but this baseline temporarily enforces only the minimum, not the upper bound |
| Framework dependency                  | Host-provided AgentScope `2.0.10`; no second framework installation                                                                                 |
| Other host versions                   | Not individually verified; admission does not prove compatibility across the range                                                                  |
| Web and Desktop manual acceptance     | 0.1.5 Desktop accepted by Yance; record Web/Desktop and exact artifacts separately                                                                  |

The development baseline is unmodified upstream QwenPaw `5c56644a`
(`2.2.2`) with its pinned AgentScope `2.0.10`. Manifest minimum `2.2.2`
controls admission; it is not compatibility proof for future host versions.
Retest after upgrades. The plugin uses extension registrations without
patching host source or approval methods. Host approval/context interfaces
remain version-coupled implementation dependencies.

`AskUserParams` supplies the schema sent to the model and validation,
including `multi_select`, required descriptions and uniqueness rules.
The single-choice-only preview contract is enforced in the UI, rather
than being a rejected combination in this framework validator. Success
returns `AskUserMetadata` in `ToolChunk.metadata`. Recommendation styling
does not change these contracts. This is a governed normal tool bridging
the host's approval wait, without an external-tool execution loop.
Framework permissions run first; builtin AskUser's unconditional `ALLOW`
does not bypass the host's policy.

The distinct tool name avoids replacing a future builtin `ask_user_question`.
Disable or uninstall this plugin before switching to that builtin to avoid
giving the Agent two tools for the same purpose. No automatic migration is
performed.

This plugin does not replace Data Console's built-in `ask_user_question`.
That clarification flow uses different contract names such as `multiSelect`,
`title`, `selected_options` and `custom_text`; this plugin uses framework
`multi_select`/`header` and `AskUserMetadata.answers`. Their registrations,
requests and results are not interchangeable.

## Troubleshooting

| Symptom                                            | Check                                                                                                                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Agent cannot use the tool                      | Confirm the plugin loaded, enable the tool for that Agent, refresh Console and begin a direct Chat turn.                                                                                                      |
| No question form appears                           | Check that the built frontend is included and loaded; native Inbox and headless entry points are unsupported.                                                                                                 |
| A recommendation star is missing                   | Check an explicit terminal English `Recommended` (case-insensitive) or Chinese `推荐` in paired `()`/`（）`. Only trailing display whitespace is ignored; zero-width characters and prose are not normalized. |
| A marked option is not displayed first             | Confirm the active version and raw Parameters. Version 0.1.5 displays marked options first stably; source data and raw submitted labels remain unchanged.                                                     |
| The star disappears after selecting                | Check the fixture above and record the actual label/version; refresh/restart old frontend sessions before retesting.                                                                                          |
| Header/actions clip in a short desktop window      | Check this version on the real host prefix and record window size, zoom and viewport; do not treat an isolated fixture as desktop acceptance.                                                                 |
| Native Tools list shows the raw tool name          | This is the host's current plugin-tool presentation policy; use this exact ID and the plugin Details for localized explanations.                                                                              |
| An existing tool description is still English      | Saved English or customized descriptions remain unchanged. Version 0.1.6 does not overwrite them and no longer offers a description-sync page or interface.                                                   |
| The old settings page is unavailable               | This is intentional in 0.1.6. No extra plugin configuration is needed; enable the tool in the host's Agent tools page.                                                                                        |
| The new version is absent                          | Refresh Console; for source-launched Desktop close the window, wait for the launch command to exit and restart. Confirm the installed version, then start a new conversation.                                 |
| Bottom-composer text does not resolve the question | It is a separate message/draft and may be queued; submit structured answers in the question card.                                                                                                             |
| Preview is absent                                  | Select a single-choice option with `preview`; previews are not shown for multiple-choice questions.                                                                                                           |
| Submission fails                                   | Check the host login, selected Agent and expiry; the current form keeps drafts after a failed submit.                                                                                                         |
| Request expired or was already resolved            | Ask the Agent to create a new question request; an old request cannot be replayed.                                                                                                                            |
| Native approval completed without answers          | It returns an error; use the plugin's Chat form to collect structured answers.                                                                                                                                |
| Questions stay in the model's language             | Language switching translates the plugin UI, not model-authored questions/options.                                                                                                                            |
| Host upgrade breaks loading or behavior            | Revalidate against the new host; do not install a second framework runtime as a workaround.                                                                                                                   |

## Build and validation

Developers use the collection's validation and packaging scripts from its
root; users installing the ZIP do not run these commands:

```bash
python scripts/validate_plugin.py --plugin yance-ask-user-question --host-source "/path/to/QwenPaw"
python scripts/package_plugin.py --plugin yance-ask-user-question --output-dir dist
```

See [the collection's release process](../../../RELEASING.md) for exact-ZIP
human acceptance and local preflight. That link is for a source checkout;
an installed ZIP contains the plugin's English/Chinese READMEs and changelog.
Packages include only the eight runtime/documentation files, are bounded
to 10 MiB, and include archive/file hash evidence. No frontend source,
node_modules, user state or second AgentScope runtime is shipped.

Automated results cover only their recorded source/archive hashes. They
do not establish full upstream CI, cloud-model behavior, desktop acceptance
or marketplace approval. Each candidate requires its own validation and
manual acceptance; previous-version results stay separate. The linked
validation record documents the accepted 0.1.5 artifact; current source
documentation may evolve without rewriting that frozen ZIP.
The [marketplace listing materials](../../../docs/marketplace-listing.md) in
the source repository records the actual QwenPaw fields and publication
status; source upload is separate from marketplace approval.

## License and maintenance

Apache-2.0; see [LICENSE](LICENSE). Maintainer: **Yance**.
Contact: [xstyle@qq.com](mailto:xstyle@qq.com).
For issue reports, include host/plugin versions, language, reproduction
steps and errors with credentials removed.
