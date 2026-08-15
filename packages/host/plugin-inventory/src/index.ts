/** Writeable Host Remote projection of the current Cordis Loader plugin entries. */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Context, FiberState } from '@deepseek-ai/cordis'
import { EntryTree, type Entry } from '@deepseek-ai/cordis-plugin-loader'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
import { pluginTogglesPath } from '@deepseek-ai/dsh-home-paths'
import type {
  PluginEntryId,
  PluginFiberPhase,
  PluginInventoryEntry,
  PluginInventorySnapshot,
} from './types.ts'

export type * from './types.ts'
export { PLUGIN_TOGGLES_FILENAME, pluginTogglesPath } from '@deepseek-ai/dsh-home-paths'

/** One persisted toggle row: disable/reenable a Loader entry by id. */
export interface PluginToggleRow {
  readonly id: string
  readonly disabled: boolean
}

/** Entry ids a caller may never toggle: disabling them would strand the surface. */
const PROTECTED_ENTRY_IDS: ReadonlySet<string> = new Set([
  'webserver',
  'web-runtime',
  'api-gateway',
  'connection',
  'api-remotes',
  'client-runtime',
  'modules',
  'plugin-inventory',
  'ui-settings-plugin-inventory',
  'ui-settings-plugins',
  'web-startup',
  'agent-presets',
])

function isToggleRow(value: unknown): value is PluginToggleRow {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Record<string, unknown>
  return typeof row.id === 'string' && typeof row.disabled === 'boolean'
}

/** Read the current toggle rows; a missing or unparseable file means none. */
function readToggles(pathToRead: string): PluginToggleRow[] {
  if (!existsSync(pathToRead)) return []
  try {
    const parsed: unknown = JSON.parse(readFileSync(pathToRead, 'utf8'))
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isToggleRow)
  } catch {
    return []
  }
}

/** Persist a toggle list atomically (temp + rename so HMR never reads a partial document). */
function writeToggles(pathToWrite: string, rows: readonly PluginToggleRow[]): void {
  if (!existsSync(dirname(pathToWrite))) mkdirSync(dirname(pathToWrite), { recursive: true })
  const tmp = `${pathToWrite}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(rows, undefined, 2) + '\n', 'utf8')
  renameSync(tmp, pathToWrite)
}

/** Runtime mirror: FiberState is a cross-package const enum. */
const FIBER_STATE = {
  PENDING: 0 as FiberState.PENDING,
  LOADING: 1 as FiberState.LOADING,
  ACTIVE: 2 as FiberState.ACTIVE,
  FAILED: 3 as FiberState.FAILED,
  DISPOSED: 4 as FiberState.DISPOSED,
  UNLOADING: 5 as FiberState.UNLOADING,
} as const

/** Complete public projection of Cordis Fiber states. */
const FIBER_PHASE = {
  [FIBER_STATE.PENDING]: 'pending',
  [FIBER_STATE.LOADING]: 'loading',
  [FIBER_STATE.ACTIVE]: 'active',
  [FIBER_STATE.FAILED]: 'failed',
  [FIBER_STATE.DISPOSED]: null,
  [FIBER_STATE.UNLOADING]: 'unloading',
} as const satisfies Record<FiberState, PluginFiberPhase>

/** Remote service exposing the Loader's current non-group entry state. */
export class PluginInventoryGateway extends TypertRemoteService {
  static inject = ['loader']

  constructor(ctx: Context) {
    super(ctx, 'pluginInventory')
  }

  /**
   * Read the Loader directly on every call; Loader's own plugin/status events
   * keep Entry.fiber and Fiber.state current, so no second cache is needed.
   * @returns Current non-group Loader entries in Loader order.
   */
  @Remote('list')
  list(): PluginInventorySnapshot {
    const entries: PluginInventoryEntry[] = []
    for (const entry of this.ctx.loader.entries()) {
      if (entry.options.group) continue
      entries.push({
        entryId: pluginEntryId(entry.id),
        moduleName: entry.options.name,
        enabled: !entry.disabled,
        fiberPhase: entry.fiber === undefined ? null : FIBER_PHASE[entry.fiber.state],
      })
    }
    return { entries }
  }

  /**
   * Enable or disable one Loader entry and persist the choice.
   *
   * The change is applied to the running Loader immediately via
   * `ctx.loader.update` so the plugin disables/enables now, independent of any
   * full-tree recomposition that could roll back when a sibling entry fails to
   * re-apply. In parallel the desired `{ id, disabled }` row is upserted into
   * the gateway-owned toggle patch file; on the next process start the launcher
   * composes that layer, so the choice survives restarts.
   *
   * The persisted id is the entry-list *patch* id, not the Loader's runtime id.
   * The runtime id prefixes every entry with its enclosing include-file entry
   * (`include:session`, `include:tool-fs`), while patch rows match the leaf id
   * (`session`, `tool-fs`) written in the profile/bundle layers — writing the
   * prefixed id would make `applyEntryPatches` warn-and-skip and silently do
   * nothing on restart. This method therefore strips the enclosing include
   * prefix before writing, and refuses to toggle the include container itself.
   *
   * @throws when the entry does not exist, is a composition container, or is
   *   protected from toggling; the carrier converts a throw into
   *   `{ ok: false, error }` for the client.
   */
  @Remote('setEnabled')
  async setEnabled(entryId: string, enabled: boolean): Promise<void> {
    let target: Entry | undefined
    for (const entry of this.ctx.loader.entries()) {
      if (entry.id === entryId) {
        target = entry
        break
      }
    }
    if (target === undefined) throw new Error(`no such loader entry: ${entryId}`)

    // The entry-list patch id drops the prefix added by the enclosing file
    // entry (the entry whose fiber mounts this entry's parent tree).
    const patchId = includeLeafId(target)
    if (patchId === null) {
      throw new Error(`entry ${entryId} is a composition container and cannot be toggled`)
    }
    if (PROTECTED_ENTRY_IDS.has(patchId)) {
      throw new Error(`entry ${entryId} is protected and cannot be toggled`)
    }

    // Apply live now (per-entry), then persist so the choice survives restarts.
    await this.ctx.loader.update(target.id, { disabled: !enabled })

    const path = pluginTogglesPath()
    const rows = readToggles(path).filter(rowToKeep => rowToKeep.id !== patchId)
    rows.push({ id: patchId, disabled: !enabled })
    writeToggles(path, rows)
  }
}

/**
 * Strip one enclosing entry's prefix from a runtime Loader id to reach the
 * entry-list *patch* id the profile/bundle layers match. The runtime id
 * prefixes every include child with its enclosing include entry
 * (`include:session` → `session`, `include:compaction:tool-result-pruner` →
 * `compaction:tool-result-pruner`). When the runtime id does not actually
 * start with the enclosing prefix, the id is returned unchanged.
 */
export function stripEnclosingPatchPrefix(runtimeId: string, enclosingId: string | undefined): string {
  if (enclosingId === undefined) return runtimeId
  if (!runtimeId.startsWith(enclosingId + EntryTree.sep)) return runtimeId
  return runtimeId.slice(enclosingId.length + 1)
}

/**
 * Derive the entry-list *patch* id for a runtime Loader entry. Most runtime
 * ids are prefixed by the enclosing file include entry (`include:session`),
 * which must be stripped to reach the patch id (`session`) the profile/bundle
 * layers match. Returns `null` for composition containers — the include-file
 * entry itself, which no non-group `list()` row is, but which must never be
 * toggled all-at-once anyway.
 */
function includeLeafId(entry: Entry): string | null {
  const enclosing = entry.parent.tree.ctx.fiber.entry
  if (enclosing === undefined) {
    // No enclosing include entry: either a bare standalone leaf (a test or a
    // caller-created tree) whose id already is the patch id, or the include
    // container at the loader root. A container owns a subtree; a leaf does
    // not.
    return entry.subtree !== undefined || entry.options.group ? null : entry.id
  }
  return stripEnclosingPatchPrefix(entry.id, enclosing.id)
}

/** Brand an existing Loader-tree entry id at the owning boundary. */
function pluginEntryId(value: string): PluginEntryId {
  return value as PluginEntryId
}

export default PluginInventoryGateway
