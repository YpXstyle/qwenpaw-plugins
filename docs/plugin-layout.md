# Plugin layout and official requirements

English | [简体中文](plugin-layout_zh.md)

## What upstream requires

The QwenPaw plugin documentation defines a plugin directory containing
`plugin.json` and declared runtime entries. Plugin ID and version are
required; entries are relative to that plugin directory. A frontend entry
refers to built JavaScript. The official packer checks every declared entry.
The installer consumes an individual plugin directory or its ZIP, not a
multi-plugin source repository as one installation.

Upstream recommends a README covering features, installation, examples,
configuration and troubleshooting. It does not require one repository per
plugin or separate English/Chinese files. See the
[official plugin documentation at the development baseline](https://github.com/agentscope-ai/QwenPaw/blob/5c56644a6e130762a236f8c946103e95a0a1eec8/website/public/docs/plugins.en.md).

## This collection's choices

Use `plugins/{tool,bundle,memory,apps}/<plugin-id>/`, keep tests under
`tests/<module>/`, and share validation and packaging scripts. Each plugin
keeps its own version, English/Chinese READMEs and changelog. Release one
ZIP per plugin; a shared repository does not force simultaneous releases.
This follows the official repository's multi-plugin layout and its
[per-plugin packaging support](https://github.com/agentscope-ai/QwenPaw/blob/5c56644a6e130762a236f8c946103e95a0a1eec8/scripts/pack/generate_plugin_metadata.py).

`<plugin-id>-v<version>` tags and a manual acceptance record are our own
management rules. The upstream OSS publishing workflows are the upstream
maintainers' deployment process, not a requirement that community plugins
use the same hosting or credentials.
See [naming and migration](naming.md) for the current namespaced ID and the
separate Data Console clarification contract.

## Deliverable boundaries

The Ask User Question by Yance ZIP includes runtime backend files, its single built
frontend, manifest, license and English/Chinese documentation. It excludes
frontend source, node_modules, test environments and user state. A source
checkout still needs a frontend build before it can be packaged.

The plugin uses host interfaces and the host-pinned AgentScope contract;
it does not install a second AgentScope runtime. Its minimum host version
is an admission constraint rather than a promise of compatibility with all
future versions. Keep exact compatibility and acceptance results in the
validation report, with the artifact hash they actually cover.

## Description metadata and native pages

The target host officially supports `description_i18n`, but its installed
plugin API/list and native plugin-tool rows use the plain description.
Only some other pages, such as the official catalog, consume localized
description maps. There is no separate official `name_i18n` or native-tool
`display_name` field. Legacy localized `name`/`description` objects are
flattened to a string with English preference rather than selected from
the current UI language.

This collection therefore uses a Chinese default description,
retains the English brand name and stable IDs, and keeps seven-language
plugin UI plus English/Chinese READMEs. Existing Agent tool descriptions
may have been saved earlier; a manifest change alone does not overwrite
them. The plugin settings page offers explicit current-Agent sync through
its own HTTP interface, backed by the host's official
`update_agent_config_async(agent_id, updater)` API. It compares the saved
description and changes only this tool's description under the same host
configuration lock, preserving other values. This is not an upstream
description-specific HTTP endpoint or a host-source patch. No whole-tools
PUT, Agent reload or automatic all-Agent migration is performed.

Marketplace preparation is separate from source upload and runtime
packaging. See [the listing draft](marketplace-listing.md) for the actual
QwenPaw submission fields, current status and optional demonstration
materials. A source tag is not a downloadable plugin ZIP or marketplace
approval.
