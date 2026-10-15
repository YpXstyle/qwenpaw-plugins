# QwenPaw Plugins

English | [简体中文](README_zh.md)

An independently maintained collection of QwenPaw plugins by **Yance**.
Each plugin has its own stable ID, version, documentation and installable
package. Source: [YpXstyle/qwenpaw-plugins](https://github.com/YpXstyle/qwenpaw-plugins).

## Plugin catalog

| Plugin                                                                       | Stable ID                 | Source version                                                       | Purpose                                                 | Screenshots                                                                 | Marketplace                                                                       |
| ---------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Ask User Question by Yance](plugins/tool/yance-ask-user-question/README.md) | `yance-ask-user-question` | [0.1.6 · accepted](docs/validation/yance-ask-user-question-0.1.6.md) | Structured questions in direct interactive Console Chat | [View examples](plugins/tool/yance-ask-user-question/README.md#screenshots) | [Published 0.1.5](https://platform.agentscope.io/plugins/yance-ask-user-question) |

The version column refers to repository source. Marketplace versions and
installation links are listed per plugin. No GitHub Release asset has
been created for the current plugin. Per-plugin READMEs contain features, installation,
configuration, compatibility, screenshots and troubleshooting.

## Use a plugin

Choose a plugin from the catalog and follow its own installation and
upgrade instructions. Install its individual runtime package, rather
than this collection's source archive. Availability and requirements are
specific to each plugin; a source tag alone is not a plugin ZIP release.

## Repository organization

Plugins live under `plugins/{tool,bundle,memory,apps}/<plugin-id>/`.
Each owns its English/Chinese READMEs, changelog, license and example
images under `docs/images/<version>/`. The collection README stays a
catalog; detailed demonstrations belong to the corresponding plugin.
Shared development and release guidance lives in root `docs/`, common
checks in `scripts/`, and focused tests in `tests/<module>/`.

Plugins version independently. This collection's tag convention is
`<plugin-id>-v<version>`; it is a repository convention, not an upstream
requirement to use one repository per plugin.

## Develop and contribute

- [Contributing](CONTRIBUTING.md)
- [Release process](RELEASING.md)
- [Plugin layout and official requirements](docs/plugin-layout.md)
- [Naming and migration](docs/naming.md)
- [Marketplace listing materials](docs/marketplace-listing.md)

## License and contact

Apache-2.0; see [LICENSE](LICENSE) and each plugin's license.
Maintainer: **Yance**, [xstyle@qq.com](mailto:xstyle@qq.com).
This collection is independently maintained.
