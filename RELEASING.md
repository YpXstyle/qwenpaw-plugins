# Local release process

English | [简体中文](RELEASING_zh.md)

This process prepares a reviewable local plugin release. No command below
creates a remote repository, pushes Git state, publishes a GitHub Release
or submits to a marketplace. CI may validate and retain artifacts; it does
not automatically publish them.

## 1. Freeze one plugin candidate

Update its `plugin.json` version, frontend package version when present,
English/Chinese READMEs and changelog together. Preserve its installation
ID and compatible internal registrations. For the current plugin the
candidate is `yance-ask-user-question` **0.1.5**. Keep accepted 0.1.4
packages and acceptance evidence unchanged. The sole current host
target is stable QwenPaw `2.2.2`, commit
`5c56644a6e130762a236f8c946103e95a0a1eec8`, with AgentScope `2.0.10`.
Upgrading the namespaced 0.1.4 installation retains its ID and uses
`--force`; earlier preview installations follow
[the separate migration procedure](docs/naming.md). Neither changes the
official clarification tool. Every candidate must have validation and
manual acceptance bound to its own source and archive hashes. Maintainer **Yance**
has confirmed 0.1.5 Desktop acceptance after restarting. Its version
source is maintained in this repository. See the [validation record](docs/validation/yance-ask-user-question-0.1.5.md)
and [plugin screenshots](plugins/tool/yance-ask-user-question/README.md#screenshots).
Earlier-version results do not transfer to a new artifact.

The 0.1.5 changes are separate display fixes: recognize explicit
English/Chinese recommendation suffixes, then place marked options first
stably. Do not modify raw labels, schema, selected answers or the
framework's model instruction. The Chinese default description and
seven-language description-sync page remain. Finish old pending questions before
upgrading and refresh Console afterwards. For source-launched Desktop,
close the window, wait for the launch command to exit and restart it.

Build and validate the candidate from the repository root. Replace example
paths with real local paths; they are not public download locations:

```bash
python scripts/validate_plugin.py --plugin yance-ask-user-question --host-source "/path/to/QwenPaw"
python scripts/package_plugin.py --plugin yance-ask-user-question --output-dir dist
```

The package includes built runtime files, license and both READMEs. Keep
the archive SHA-256 and member manifest. Check every declared entry and
the delivery size limit. Record the exact source, host and bundle hashes,
commands and actual outcomes. Automated installation checks use isolated
state; they are not permission to install into a real user's environment.

## 2. Accept the exact ZIP manually

After automated checks pass, manually test that ZIP in an authorized
environment. At minimum check direct Console Chat, one and multiple
questions, Previous/Next retaining answers, single/multiple selection,
Other, submit only after every question is answered, recommendation star
and soft green outline without preselection, refusal and failed-submit
feedback, language switching, and continuation with answers in the same
Agent turn. Keep checking non-fullscreen/short desktop windows, actual
`qwenpaw`-prefixed card bodies, viewport resizing, visible headings/actions
and preserved drafts. A selected recommendation must keep its star.
Check that bottom-composer messages use the host queue and that explicit
interrupt-and-send cancels rather than answers the waiting question.
Record Desktop separately if it was actually tested.

For 0.1.5, test the original second option `400-600/晚（推荐）`: it gets
the recommendation style and displays before an unmarked first option,
with no preselection and its raw label preserved in the submitted answer.
Check paired ASCII/full-width parentheses, English `Recommended` without
case sensitivity, Chinese `推荐`, and trailing display whitespace.
Zero-width characters are not stripped. Check unmarked options, prose
mentions, malformed markers and nonterminal markers receive no badge;
both groups retain their source order. The model still receives the
official English-marker/first-position instruction unchanged. Seven UI
languages do not imply seven accepted marker languages.

Also check Chinese default descriptions on native plugin/tool
lists while names and IDs stay unchanged. The native lists do not gain
automatic language switching; the plugin's own card/settings UI should
still switch between its seven languages. Test the settings page at
`/plugins/yance-ask-user-question` with an existing Agent: explicit sync
must target only this plugin's description and preserve tool enablement
and all other tools/configuration. Confirm no automatic all-Agent sync
or uninstall occurs. Check the plugin's own description-sync HTTP
interface: it reuses the host's official atomic configuration-update API,
compares the expected saved description under that lock and updates only
this tool's description. Agent mismatches, missing tools and changed
descriptions must be refused; a failed read must not turn into a guessed
write. Confirm there is no full-tools PUT or Agent reload, including while
a question or heartbeat is active; no task pause is required for sync.
Record the exact package and observed outcomes in ignored evidence
reports, rather than adding unfinished pass counts to source
documentation. User acceptance is required before commit or publication
of this candidate.

The accepted 0.1.5 runtime ZIP and tag are kept byte-for-byte unchanged.
Its packaged README still uses candidate wording from packing time; the
external validation record documents the subsequent maintainer confirmation.
Current source READMEs may receive documentation-only improvements and
hosted screenshot links without rewriting that archive. To reproduce or
verify the accepted release, use its immutable version tag and recorded ZIP,
not a later source README's hash. If repackaging is needed, select a
separate directory with `--output-dir` so the frozen ZIP is not overwritten.
Retain the original automation reports and record human acceptance
separately. The example template remains `pending` and is not a completed
maintainer acceptance record.

Copy [the acceptance example](docs/manual-acceptance.example.json) into
your local evidence directory and fill these fields truthfully:

| Field            | Meaning                                    |
| ---------------- | ------------------------------------------ |
| `plugin_id`      | The installed stable plugin ID             |
| `version`        | Candidate version                          |
| `archive_sha256` | SHA-256 of the exact ZIP tested            |
| `tested_by`      | Person who performed the acceptance        |
| `tested_at`      | ISO 8601 acceptance time                   |
| `result`         | `passed` only after that person accepts it |

The supplied example has `result: pending` and cannot pass preflight.
Automated tests, browser scripts and older-version acceptance do not
substitute for this manual record. Never mark it passed on a person's behalf.

## 3. Run local preflight

Use the validation report and human record that refer to the final ZIP:

```bash
python scripts/release_preflight.py --plugin yance-ask-user-question --validation "/path/to/validation-report.json" --acceptance "/path/to/manual-acceptance.json" --output-dir dist
```

Preflight compares current source, final archive, version, validation
evidence and manual acceptance. It writes local release notes and checksums;
it performs no network upload or GitHub operation. Keep its outputs with
the tested ZIP. Changed source or archive bytes require updated affected
validation and acceptance before a new preflight can pass.

## 4. Publication is a later, separately authorized step

After explicit approval, a future publication may push source to the
confirmed repository, create the plugin's independent tag and GitHub
Release with its single-plugin ZIP, and optionally submit to the plugin
marketplace. The repository, account and real release URL must be confirmed
before documenting download links. No such publication is performed by
this local process, and no automatic upload workflow is currently designed.

The [source repository](https://github.com/YpXstyle/qwenpaw-plugins) and
0.1.5 source tag are uploaded. [Marketplace version 0.1.5 is published](https://platform.agentscope.io/plugins/yance-ask-user-question)
and has a real downloadable package; no GitHub Release asset has been created. Version 0.1.5 has maintainer Desktop acceptance. The public
marketplace ZIP has different archive bytes but identical eight member
paths/content to the accepted local ZIP; both hashes are recorded in
[the listing materials](docs/marketplace-listing.md). This published status
is not a separately verified security-scan result. Use QwenPaw's actual
fields, not another platform's rules, and never rewrite an accepted archive
to prepare a listing.

Our tag convention is `<plugin-id>-v<version>`, for example
`yance-ask-user-question-v0.1.5`. This is a collection convention,
not an official QwenPaw requirement. Each plugin versions and releases
independently even though its source shares this repository.
