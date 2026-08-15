/** Copy dictionaries for the plugin inventory Settings section. */

/** Simplified Chinese dictionary and key source of truth. */
export const zh = {
  tab: '插件列表',
  loading: '正在读取插件…',
  error: '暂时无法读取插件。',
  retry: '重试',
  search: '搜索插件',
  catalog: '插件列表',
  empty: '暂无插件。',
  emptySearch: '没有匹配的插件。',
  enabledTag: '已启用',
  disabledTag: '已停用',
  configuration: '配置状态',
  cordis: 'Cordis 状态',
  unobserved: '未挂载',
  pending: '等待依赖',
  loadingPhase: '加载中',
  active: '已挂载',
  failed: '挂载失败',
  unloading: '卸载中',
  enable: '启用',
  disable: '停用',
  toggleBusy: '切换中…',
  toggleFailed: '切换失败。',
  reasonProtected: '该插件受保护，不能通过列表改变它的开关状态。',
  reasonContainer: '这是组合/容器条目，只能整体管理，不能单独开关。',
  reasonNotFound: '找不到该插件条目，可能已被移除或配置已变化。',
  reasonUnknown: '未能切换，具体原因：',
} satisfies Record<string, string>

/** Plugin inventory locale key union. */
export type PluginInventoryLocaleKey = keyof typeof zh

/** English dictionary checked against the Chinese key set. */
export const en = {
  tab: 'Plugin list',
  loading: 'Reading plugins…',
  error: 'Plugins are temporarily unavailable.',
  retry: 'Retry',
  search: 'Search plugins',
  catalog: 'Plugin list',
  empty: 'No plugins are available.',
  emptySearch: 'No matching plugins.',
  enabledTag: 'Enabled',
  disabledTag: 'Disabled',
  configuration: 'Configuration',
  cordis: 'Cordis status',
  unobserved: 'Not mounted',
  pending: 'Waiting for dependencies',
  loadingPhase: 'Loading',
  active: 'Mounted',
  failed: 'Mount failed',
  unloading: 'Unloading',
  enable: 'Enable',
  disable: 'Disable',
  toggleBusy: 'Switching…',
  toggleFailed: 'Switch failed.',
  reasonProtected: 'This plugin is protected and cannot be toggled from the list.',
  reasonContainer: 'This is a container entry that can only be managed as a whole, not toggled individually.',
  reasonNotFound: 'The plugin entry was not found; it may have been removed or its configuration changed.',
  reasonUnknown: 'Could not switch, reason: ',
} satisfies Record<PluginInventoryLocaleKey, string>
