# @deepseek-ai/dsh-host-plugin-inventory

English | [中文](README.zh.md)

Host projection of the current Cordis Loader tree. `PluginInventoryGateway` registers the `pluginInventory` service and publishes two generated direct Remotes:

- `pluginInventory/list` — reads `ctx.loader.entries()` directly, skips structural group rows, and returns the remaining entries in Loader order with only their Loader entry id, module specifier, effective enablement, and current root Fiber phase.
- `pluginInventory/setEnabled` — enables or disables one Loader entry. Rather than mutating the Loader directly, it upserts a `{ id, disabled }` row into a dedicated toggle patch file under the Harness home (`plugin-toggles.patch.json`). The launcher composes that file as its own patch layer, so the change both restarts the row live through the ordinary `cordis.patch.yml` hot-reload pipeline and survives process restarts. A protected set of transport and core rows cannot be toggled.

The phase is `pending`, `loading`, `active`, `failed`, or `unloading`; it is `null` when the entry has no live root Fiber. The snapshot is intentionally point-in-time: Loader remains the sole lifecycle authority, while this package owns no cache, history, provenance model, or event stream. Its public payload types live under `./types`, and Typert generates the Host and Client Remote artifacts exposed by `./typert` and `./remote`.

The service is Remote-only and deliberately declares no same-process Cordis `Context` merge. Client packages consume it through the explicit [`api-remotes`](../../api/remotes/README.md) assembly rather than importing the Host implementation.

## Model Experience

None, as this Host-only inventory projection registers no prompt, tool, message, or provider request.

#### KV Cache effect

None; this package never assembles model input.

## Known Limitations and Deferred Work

- **Point-in-time state only** — the result contains no durable failure history or subscription; a missing root Fiber is reported as `null`, regardless of why no live root exists.
- **No provenance** — the service does not identify which bundle, profile, or override introduced an entry. It can enable and disable entries, but it cannot add or remove plugin entries; adding a completely new plugin remains a composition change.
