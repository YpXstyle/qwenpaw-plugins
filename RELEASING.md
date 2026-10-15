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
candidate is `yance-ask-user-question` **0.1.4**. Keep existing 0.1.3
packages and acceptance evidence unchanged. The sole current host
target is stable QwenPaw `2.2.2`, commit
`5c56644a6e130762a236f8c946103e95a0a1eec8`, with AgentScope `2.0.10`.
Upgrading the namespaced 0.1.3 installation retains its ID and uses
`--force`; earlier preview installations follow
[the separate migration procedure](docs/naming.md). Neither changes the
official clarification tool. This candidate still requires this round's
automation and user desktop acceptance.

The 0.1.4 scope is a Chinese default description plus a seven-language
settings page for explicit current-Agent description sync. Preserve the
English brand name, stable identifiers, bilingual documentation and the
0.1.3 question/recommendation behavior. Finish old pending questions before
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

For 0.1.4, also check Chinese default descriptions on native plugin/tool
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

Copy [the acceptance example](docs/manual-acceptance.example.json) into
your local evidence directory and fill these fields truthfully:

| Field | Meaning |
| --- | --- |
| `plugin_id` | The installed stable plugin ID |
| `version` | Candidate version |
| `archive_sha256` | SHA-256 of the exact ZIP tested |
| `tested_by` | Person who performed the acceptance |
| `tested_at` | ISO 8601 acceptance time |
| `result` | `passed` only after that person accepts it |

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

Our tag convention is `<plugin-id>-v<version>`, for example
`yance-ask-user-question-v0.1.4`. This is a collection convention,
not an official QwenPaw requirement. Each plugin versions and releases
independently even though its source shares this repository.
