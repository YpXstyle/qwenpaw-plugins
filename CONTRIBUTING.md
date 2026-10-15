# Contributing

English | [简体中文](CONTRIBUTING_zh.md)

These are this collection's development conventions, not additional
requirements imposed by upstream QwenPaw.

## Scope and structure

Keep each plugin self-contained under
`plugins/{tool,bundle,memory,apps}/<plugin-id>/`. Preserve an installed
plugin's ID, governed tool names and approval source during compatible
upgrades. Display-name changes do not require a new installation ID.
Place shared validation/packaging logic in `scripts/` and focused tests
under `tests/<module>/`.
The current test module is `tests/yance_ask_user_question/`. The present
namespace migration is documented separately in [naming](docs/naming.md);
it must not be described as a same-ID upgrade.

Use supported host extension points. Document any reliance on host
implementation interfaces and the exact host/framework versions tested.
Keep unrelated host fixes and changes to another contribution out of a
plugin change. Do not commit user state, credentials, node_modules,
temporary environments or generated release artifacts.

The root English/Chinese READMEs are collection catalogs. Put complete
screenshots and examples in the owning plugin's bilingual READMEs, with a
stable `#screenshots` destination in both languages. Store original images
under that plugin's `docs/images/<version>/`, not the collection root.
When the runtime ZIP excludes images, use real hosted raw-image URLs in
its README and document that viewing them requires network access. Source
documentation may evolve after a release; never rewrite accepted ZIPs or
tags merely to update pictures. Shared root guides may link to the plugin
without duplicating its full gallery.

## Plugin documentation and metadata

Each plugin maintains English `README.md`, Chinese `README_zh.md`,
`CHANGELOG.md` and `LICENSE`. Both READMEs cover features, installation,
examples, configuration and troubleshooting. Keep support and acceptance
claims aligned in both languages. Mark unpublished versions as candidates.

Use the official `plugin.json` fields for ID, name, version, description,
author and entries. Localized descriptions use `description_i18n` where
supported; do not assume every host page consumes them. Do not invent a
manifest email or `name_i18n` field. This collection's maintainer is
**Yance**; contact [xstyle@qq.com](mailto:xstyle@qq.com).

The plain default description is Chinese. Keep the English
brand name, stable IDs, seven-language UI and bilingual READMEs. Native
installed-plugin/tool lists use fixed strings on the target host; do not
claim automatic localization there. Description sync uses the plugin's
own HTTP interface backed by the host's official
`update_agent_config_async(agent_id, updater)` configuration API and
requires an explicit action for the current Agent. Compare the expected
description and update only this tool's description under the host lock,
preserving enablement and unrelated configuration. Reject mismatched
Agent identity, missing tools and description conflicts. Do not send a
whole-tools PUT, reload an Agent, auto-sync every Agent or uninstall to
sync. No idle-task or paused-heartbeat requirement is introduced.

Ask User Question by Yance keeps the framework's schema and metadata contracts.
Recommendation display accepts only explicit English `Recommended`
(case-insensitive) or Chinese `推荐` suffixes in paired ASCII/full-width
parentheses. Ignore trailing whitespace for display matching only; do not
strip zero-width characters or infer recommendations from prose, flags or
position. Display marked options first, retaining original order within
both groups. Preserve the original option array/labels, selected answers
and schema, with no preselection. Keep the star after selection. The
framework model instruction remains unchanged. Use public extension points for the question
card; do not disable the host composer through private global state.
Keep the AGENT identity boundary, answer normalization, permission denial,
unsupported-context rejection and unload cleanup covered by focused tests.

## Validation

Use a compatible host source checkout without editing its source or
reusing a real user's data directory:

```bash
python scripts/validate_plugin.py --plugin yance-ask-user-question --host-source "/path/to/QwenPaw"
```

Inspect the resulting report. Frontend dependency installation, tests,
type/build/format checks, focused backend tests and package/installation
checks must report their actual outcomes. Keep source, bundle and archive
hashes with the results. A focused suite is not full QwenPaw CI, and a
deterministic model test is not a cloud-model acceptance test.

When source, translated documentation or the built bundle changes,
regenerate affected artifacts and evidence. A prior run remains evidence
for its recorded bytes; it does not automatically cover a new candidate.
Record platform or baseline failures without folding unrelated fixes into
the plugin.

## Human acceptance and releases

Test the exact candidate ZIP in an authorized test environment. Verify
its question flow, navigation, recommendation without preselection,
refusal, failure feedback and language behavior. Desktop claims require
acceptance on the actual target desktop build. Keep automated checks and
human acceptance distinct.

Follow [RELEASING.md](RELEASING.md) for the manual record and local
preflight. Tests and preflight do not authorize creating a remote,
pushing, tagging, uploading a release or submitting to a marketplace.
Those steps require explicit authorization when they are requested.
Marketplace fields and draft copy are documented separately in
[the listing materials](docs/marketplace-listing.md); source upload and a
version tag do not establish marketplace publication.
