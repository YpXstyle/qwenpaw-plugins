# QwenPaw Plugins

English | [简体中文](README_zh.md)

An independently maintained collection of QwenPaw plugins by **Yance**.
Each plugin has its own stable ID, version, documentation and installable
ZIP. Source: [YpXstyle/qwenpaw-plugins](https://github.com/YpXstyle/qwenpaw-plugins).
Installable archives are released independently; no downloadable release
has been published yet.

## Plugins

| Plugin | Stable ID | Current version | Scope |
| --- | --- | --- | --- |
| [Ask User Question by Yance](plugins/tool/yance-ask-user-question/README.md) | `yance-ask-user-question` | `0.1.4` local candidate | Structured questions in direct interactive Console Chat |

Ask User Question by Yance waits for structured answers and continues the same
Agent turn. Its tool is disabled by default. See the plugin README for
installation, configuration, examples, limitations and troubleshooting.
Version 0.1.4 uses a Chinese default plugin/tool description and adds an
explicit current-Agent description sync on its own settings page. The
English brand name, stable identifiers, seven-language plugin UI and
bilingual documentation remain. Native lists show a fixed description;
they do not switch languages automatically. Validation and human acceptance
are bound to each candidate version and ZIP hash. Source upload is separate
from marketplace publication; existing packages and evidence remain unchanged.
Subsequent fixes use independent versions. See
[naming and migration](docs/naming.md) before replacing an earlier prototype.
It does not replace Data Console's built-in clarification tool.

## Install a plugin

Install one plugin ZIP, rather than a source archive of this collection.
The ZIP includes its built frontend; users do not need npm. With QwenPaw
running, upload it through plugin management or run:

```bash
qwenpaw plugin install "/path/to/yance-ask-user-question-0.1.4.zip"
```

`/path/to/...` is an example local path, not a download URL. Without a
running service, extract the ZIP and install its plugin directory instead.
Use the plugin's installation instructions for upgrades. Installation uses
your existing Agent and model configuration; reinitialization is unnecessary.
Finish pending questions before upgrading, refresh Console afterwards and
start a new conversation. For a source-launched Desktop session, close its
window, wait for the launch command to exit and restart it. Use the plugin
settings page to sync an existing Agent's tool description explicitly;
the sync compares the saved description and updates only this tool under
the host's configuration lock, without reloading the Agent.

## Repository convention

Plugins live under `plugins/{tool,bundle,memory,apps}/<plugin-id>/`, each
with a `plugin.json`, entry files, license and English/Chinese READMEs.
Shared checks and packaging tools live in `scripts/`; tests live under
`tests/<module>/`. Only directories needed by current plugins need to exist.
The current test module is `tests/yance_ask_user_question/`.

A collection repository with independent plugin releases is our management
choice. QwenPaw does not require one repository per plugin. Our release tag
convention is `<plugin-id>-v<version>`; it is not an official QwenPaw rule.

## Develop and validate locally

Run from the repository root, replacing the host path with a compatible,
unmodified QwenPaw source checkout:

```bash
python scripts/validate_plugin.py --plugin yance-ask-user-question --host-source "/path/to/QwenPaw"
python scripts/package_plugin.py --plugin yance-ask-user-question --output-dir dist
```

Validation records frontend checks, focused backend tests, packaging and
installation checks in an isolated environment. A generated ZIP is not a
published release. Human acceptance of its exact SHA-256 is required
before local release preflight; automation does not supply that approval.

- [Contributing](CONTRIBUTING.md)
- [Local release process](RELEASING.md)
- [Plugin layout and official requirements](docs/plugin-layout.md)
- [Naming and migration](docs/naming.md)

## License and contact

Apache-2.0; see [LICENSE](LICENSE) and each plugin's license.
Maintainer: **Yance**, [xstyle@qq.com](mailto:xstyle@qq.com).
This collection is independently maintained and has not been approved or
published by the AgentScope plugin marketplace.

The current plugin is developed against QwenPaw **2.2.2 / `5c56644a`**, using host AgentScope **2.0.10**. See the plugin README compatibility table for the admission range, verified target and acceptance scope.
