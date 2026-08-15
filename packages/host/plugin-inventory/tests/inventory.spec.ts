import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context, type Plugin } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { remoteMethods } from '@deepseek-ai/dsh-typert-protocol'
import { PLUGIN_TOGGLES_FILENAME } from '@deepseek-ai/dsh-home-paths'
import PluginInventoryGateway, { stripEnclosingPatchPrefix } from '../src/index.ts'

const contexts: Context[] = []
const tempHomes: string[] = []

function makeHome(): string {
  const home = mkdtempSync(join(tmpdir(), 'dsh-inventory-'))
  tempHomes.push(home)
  return home
}

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  for (const home of tempHomes.splice(0)) rmSync(home, { recursive: true, force: true })
  delete process.env.DSH_HOME
})

const activePlugin: Plugin.Function = () => {}
const pendingPlugin: Plugin.Object = {
  inject: ['neverReady'],
  apply() {},
}

async function harness(): Promise<{
  ctx: Context
  inventory: PluginInventoryGateway
}> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(Loader)
  ctx.loader.builtins.active = activePlugin
  ctx.loader.builtins.pending = pendingPlugin
  await ctx.plugin(PluginInventoryGateway)
  const inventory = ctx.get('pluginInventory') as PluginInventoryGateway
  return { ctx, inventory }
}

describe('PluginInventoryGateway', () => {
  it('publishes list and setEnabled under the pluginInventory namespace', async () => {
    const { inventory } = await harness()
    expect(inventory.typertRemote).toMatchObject({
      serviceKey: 'pluginInventory',
      namespace: 'pluginInventory',
    })
    expect(remoteMethods(inventory)).toEqual([
      { method: 'list', invocation: { kind: 'direct' } },
      { method: 'setEnabled', invocation: { kind: 'direct' } },
    ])
  })

  it('projects current non-group Loader entries without a second cache', async () => {
    const { ctx, inventory } = await harness()
    const activeId = await ctx.loader.create({ name: 'cordis:active' })
    const pendingId = await ctx.loader.create({ name: 'cordis:pending' })
    const disabledId = await ctx.loader.create({
      name: 'cordis:not-installed',
      disabled: true,
    })
    await ctx.loader.create({ name: 'cordis:active', group: true })

    const snapshot = inventory.list()
    expect(snapshot.entries).toHaveLength(3)
    expect(snapshot.entries).toEqual(expect.arrayContaining([
      {
        entryId: activeId,
        moduleName: 'cordis:active',
        enabled: true,
        fiberPhase: 'active',
      },
      {
        entryId: pendingId,
        moduleName: 'cordis:pending',
        enabled: true,
        fiberPhase: 'pending',
      },
      {
        entryId: disabledId,
        moduleName: 'cordis:not-installed',
        enabled: false,
        fiberPhase: null,
      },
    ]))

    await ctx.loader.update(activeId, { disabled: true })
    expect(inventory.list().entries.find(entry => entry.entryId === activeId)).toEqual({
      entryId: activeId,
      moduleName: 'cordis:active',
      enabled: false,
      fiberPhase: null,
    })

    await ctx.loader.remove(pendingId)
    expect(inventory.list().entries.some(entry => entry.entryId === pendingId)).toBe(false)
  })

  it('persists a disable toggle to the harness home toggle patch file', async () => {
    const home = makeHome()
    process.env.DSH_HOME = home
    const { ctx, inventory } = await harness()
    const activeId = await ctx.loader.create({ name: 'cordis:active' })

    await inventory.setEnabled(activeId, false)

    const togglePath = join(home, PLUGIN_TOGGLES_FILENAME)
    expect(existsSync(togglePath)).toBe(true)
    const rows = JSON.parse(readFileSync(togglePath, 'utf8')) as readonly { id: string; disabled: boolean }[]
    expect(rows).toEqual([{ id: activeId, disabled: true }])
  })

  it('upserts rather than duplicates an existing toggle row', async () => {
    const home = makeHome()
    process.env.DSH_HOME = home
    const { ctx, inventory } = await harness()
    const activeId = await ctx.loader.create({ name: 'cordis:active' })

    await inventory.setEnabled(activeId, false)
    await inventory.setEnabled(activeId, true)

    const togglePath = join(home, PLUGIN_TOGGLES_FILENAME)
    const rows = JSON.parse(readFileSync(togglePath, 'utf8')) as readonly { id: string; disabled: boolean }[]
    expect(rows).toEqual([{ id: activeId, disabled: false }])
  })

  it('rejects an unknown entry without writing a toggle row', async () => {
    const home = makeHome()
    process.env.DSH_HOME = home
    const { inventory } = await harness()

    await expect(inventory.setEnabled('does-not-exist', false)).rejects.toThrow(/no such/)
    expect(existsSync(join(home, PLUGIN_TOGGLES_FILENAME))).toBe(false)
  })

  it('strips the enclosing include prefix down to the patch id', async () => {
    expect(stripEnclosingPatchPrefix('include:session', 'include')).toBe('session')
    expect(stripEnclosingPatchPrefix('include:compaction:tool-result-pruner', 'include'))
      .toBe('compaction:tool-result-pruner')
    expect(stripEnclosingPatchPrefix('session', 'include')).toBe('session')
    expect(stripEnclosingPatchPrefix('session', undefined)).toBe('session')
  })
})
