import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import type { PluginInventorySnapshot } from '@deepseek-ai/dsh-api-remotes/client'
import {
  IconChevronDownOutline14,
  IconSearchOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { capabilityFor } from './capabilities.ts'
import type { PluginInventoryLocaleKey } from './locales.ts'
import css from './PluginInventorySettingsTab.module.css'

/** Registration-side Remote face used by the section. */
export interface PluginInventorySettingsTabInjected {
  /** Read a current Host inventory snapshot. */
  list: () => Promise<PluginInventorySnapshot>
  /** Enable or disable one Loader entry; persists the choice across restarts. */
  setEnabled: (entryId: string, enabled: boolean) => Promise<void>
  /** Active browser/host locale, used to pick the localized capability blurb. */
  language: 'zh' | 'en'
}

type PluginInventoryEntry = PluginInventorySnapshot['entries'][number]
type PluginFiberPhase = PluginInventoryEntry['fiberPhase']

/** Full component props assembled by the Settings slot renderer. */
export type PluginInventorySettingsTabProps =
  PropsRuntime<'settings.plugins.tab'>
  & PropsLocale<'settings.pluginInventory'>
  & InjectFace<PluginInventorySettingsTabInjected>

type ViewState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly snapshot: PluginInventorySnapshot }

const PHASE_KEYS = {
  pending: 'pending',
  loading: 'loadingPhase',
  active: 'active',
  failed: 'failed',
  unloading: 'unloading',
} satisfies Record<Exclude<PluginFiberPhase, null>, PluginInventoryLocaleKey>

/** Localized accessible label for one root Fiber phase. */
function phaseLabel(
  phase: PluginFiberPhase,
  t: PluginInventorySettingsTabProps['t'],
): string {
  return phase === null ? t('unobserved') : t(PHASE_KEYS[phase])
}

/** Compact a module specifier without guessing whether its Loader id was generated. */
function moduleShortName(moduleName: string): string {
  const unscoped = moduleName.startsWith('@') ? moduleName.slice(moduleName.indexOf('/') + 1) : moduleName
  return unscoped
    .replace(/^cordis:/, '')
    .replace(/^cordis-plugin-/, '')
    .replace(/^dsh-(?:host-|client-)?/, '')
}

/**
 * Map a Host toggle error into a localized, user-facing reason key, or
 * `null` when the message is not a KNOWN pattern (so the raw message is
 * shown instead). Keeps common failures (`protected`, container, missing)
 * friendly without inventing a translation for arbitrary Loader errors.
 */
function toggleReasonKey(message: string): PluginInventoryLocaleKey | null {
  if (message.toLowerCase().includes('protected')) return 'reasonProtected'
  if (message.toLowerCase().includes('composition container')) return 'reasonContainer'
  if (message.toLowerCase().includes('no such loader entry')) return 'reasonNotFound'
  return null
}

/** Whether an inventory row matches the local catalog query. */
function matches(entry: PluginInventoryEntry, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) return true
  return [entry.moduleName, entry.entryId]
    .some(value => value.toLocaleLowerCase().includes(normalizedQuery))
}

/** Render the loadable, mutating current Loader inventory. */
export function PluginInventorySettingsTab({ list, setEnabled, language, t }: PluginInventorySettingsTabProps): ReactNode {
  const catalogId = useId()
  const [request, setRequest] = useState(0)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<PluginInventoryEntry['entryId'] | null>(null)
  const [state, setState] = useState<ViewState>({ status: 'loading' })
  const [busyId, setBusyId] = useState<PluginInventoryEntry['entryId'] | null>(null)
  const [toggleError, setToggleError] = useState<{ readonly entryId: PluginInventoryEntry['entryId']; readonly message: string } | null>(null)

  useEffect(() => {
    let current = true
    void Promise.resolve().then(() => list()).then(
      (snapshot) => { if (current) setState({ status: 'ready', snapshot }) },
      () => { if (current) setState({ status: 'error' }) },
    )
    return () => { current = false }
  }, [list, request])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredEntries = useMemo(
    () => state.status === 'ready'
      ? state.snapshot.entries.filter(entry => matches(entry, normalizedQuery))
      : [],
    [normalizedQuery, state],
  )

  useEffect(() => {
    if (expanded !== null && !filteredEntries.some(entry => entry.entryId === expanded)) {
      setExpanded(null)
    }
  }, [expanded, filteredEntries])

  const retry = (): void => {
    setState({ status: 'loading' })
    setRequest(value => value + 1)
  }

  /** Flip one entry's enablement, refresh the snapshot, and surface failures. */
  const toggle = (entry: PluginInventoryEntry): void => {
    if (busyId !== null) return
    setBusyId(entry.entryId)
    setToggleError(null)
    const enabled = !entry.enabled
    void Promise.resolve()
      .then(() => setEnabled(entry.entryId, enabled))
      .then(() => list())
      .then(
        (snapshot) => {
          setState({ status: 'ready', snapshot })
          setBusyId(null)
        },
        (error: unknown) => {
          setBusyId(null)
          const message = error instanceof Error
            ? error.message
            : typeof error === 'string' ? error : 'unknown error'
          setToggleError({ entryId: entry.entryId, message })
        },
      )
  }

  return (
    <div className={css.section} aria-busy={state.status === 'loading'}>
      {state.status === 'loading' ? <p className={css.status}>{t('loading')}</p> : null}
      {state.status === 'error' ? (
        <div className={css.failure}>
          <p role="alert">{t('error')}</p>
          <button type="button" onClick={retry}>{t('retry')}</button>
        </div>
      ) : null}
      {state.status === 'ready' ? (
        <div className={css.catalog}>
          <label className={css.search}>
            <IconSearchOutline16 aria-hidden="true" />
            <span className={css.visuallyHidden}>{t('search')}</span>
            <input
              type="search"
              value={query}
              placeholder={t('search')}
              aria-label={t('search')}
              onChange={(event) => { setQuery(event.currentTarget.value) }}
            />
          </label>
          <div className={css.catalogHeading}>
            <h3>{t('catalog')}</h3>
            <span data-plugin-count={filteredEntries.length}>{filteredEntries.length}</span>
          </div>
          {state.snapshot.entries.length === 0 ? <p className={css.status}>{t('empty')}</p> : null}
          {state.snapshot.entries.length > 0 && filteredEntries.length === 0
            ? <p className={css.status}>{t('emptySearch')}</p>
            : null}
          {filteredEntries.length > 0 ? (
            <ul className={css.cards}>
              {filteredEntries.map((entry) => {
                const status = phaseLabel(entry.fiberPhase, t)
                const title = moduleShortName(entry.moduleName)
                const configuration = t(entry.enabled ? 'enabledTag' : 'disabledTag')
                const open = expanded === entry.entryId
                const detailId = `${catalogId}-details-${encodeURIComponent(entry.entryId)}`
                return (
                  <li
                    className={css.card}
                    key={entry.entryId}
                    data-plugin-entry={entry.entryId}
                    data-open={open ? 'true' : undefined}
                  >
                    <div className={css.cardHead}>
                      <button
                        className={css.cardContent}
                        type="button"
                        aria-expanded={open}
                        aria-controls={detailId}
                        aria-label={entry.enabled ? `${title}, ${status}, ${configuration}` : `${title}, ${configuration}`}
                        onClick={() => {
                          setExpanded(current => current === entry.entryId ? null : entry.entryId)
                        }}
                      >
                        <span className={css.cardLead}>
                          <strong className={css.cardTitle} title={entry.moduleName}>{title}</strong>
                        </span>
                        <span className={css.cardTrailing}>
                          {entry.enabled ? (
                            <span
                              className={css.statusDot}
                              data-phase={entry.fiberPhase ?? 'unobserved'}
                              role="img"
                              aria-label={status}
                              title={status}
                            />
                          ) : null}
                          <span className={css.configTag} data-enabled={entry.enabled ? 'true' : 'false'}>
                            {configuration}
                          </span>
                          <IconChevronDownOutline14 className={css.chevron} size={12} aria-hidden="true" />
                        </span>
                      </button>
                      <span className={css.toggle}>
                        <button
                          className={css.switch}
                          type="button"
                          role="switch"
                          aria-checked={entry.enabled}
                          disabled={busyId !== null}
                          data-enabled={entry.enabled ? 'true' : 'false'}
                          data-busy={busyId === entry.entryId ? 'true' : undefined}
                          aria-label={`${t(entry.enabled ? 'disable' : 'enable')} ${title}`}
                          title={entry.enabled ? t('disable') : t('enable')}
                          onClick={() => {
                            toggle(entry)
                          }}
                        >
                          <span className={css.switchTrack} aria-hidden="true">
                            <span className={css.switchThumb} />
                          </span>
                        </button>
                      </span>
                    </div>
                    {toggleError?.entryId === entry.entryId ? (
                      <div className={css.cardError} role="alert" data-toggle-error>
                        <span className={css.cardErrorLabel}>{t('toggleFailed')}</span>
                        <span className={css.cardErrorReason}>
                          {(() => {
                            const key = toggleReasonKey(toggleError.message)
                            if (key !== null) return t(key)
                            // No KNOWN pattern: preface the raw reason with a
                            // localized shim, then keep the message so the user
                            // can copy it back for diagnosis.
                            return `${t('reasonUnknown')}${toggleError.message}`
                          })()}
                        </span>
                      </div>
                    ) : null}
                    {open ? (
                      <div className={css.cardDetails} id={detailId}>
                        <code className={css.entryValue} data-loader-entry>{entry.entryId}</code>
                        <dl className={css.details}>
                          <div>
                            <dt>{t('configuration')}</dt>
                            <dd>{configuration}</dd>
                          </div>
                          {entry.enabled ? (
                            <div>
                              <dt>{t('cordis')}</dt>
                              <dd>{status}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                    ) : null}
                    <div className={css.cardFooter} data-plugin-module={entry.moduleName}>
                      {capabilityFor(entry.moduleName, language)}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
