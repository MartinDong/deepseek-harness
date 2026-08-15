/**
 * Human-readable capability intro for the plugin inventory cards, keyed by the
 * Loader module specifier (the `name` of each composed entry). Plugins register
 * nothing structured about what they do, so a known module maps to a short
 * bilingual blurb here; any module without an entry falls back to an informative
 * "composable" line rather than inventing a capability.
 */

/** A capability blurb in both shipped locales. */
export interface CapabilityText {
  /** Simplified Chinese blurb (the default surface). */
  zh: string
  /** English blurb. */
  en: string
}

type CapabilityCatalog = Readonly<Record<string, CapabilityText>>

function cap(zh: string, en: string): CapabilityText {
  return { zh, en }
}

/**
 * The curated catalog. Keys are Loader module specifiers — most of these are
 * `@deepseek-ai/...` workspace packages plus the `cordis-plugin-*` vendored
 * plugins. Not every bundled module has an entry here; unlisted ones fall back
 * to {@link UNLISTED}.
 */
export const CAPABILITY_CATALOG: CapabilityCatalog = {
  '@deepseek-ai/cordis-plugin-loader': cap(
    '加载整个插件配置：解析 profile/补丁、挂载或卸载每个插件条目，并维护运行状态（挂载/等待依赖/失败等）。',
    'Loads the whole matrix — parses profiles/patches, mounts/unmounts each plugin row, and tracks run state.',
  ),
  '@deepseek-ai/cordis-plugin-hmr': cap(
    '热重载：监听配置/模块文件变更并即时重新加载，无需重启进程。',
    'Hot-reload: watches config and module files and re-applies changes without a restart.',
  ),
  '@deepseek-ai/cordis-plugin-timer': cap(
    '提供 setTimeout/setInterval 等定时能力，供其它插件编排延时与周期任务。',
    'Provides timeout/interval primitives for scheduling delay and periodic work.',
  ),
  'cordis:loader': cap('Cordis 内置 Loader（同 cordis-plugin-loader 的简名形式）。', 'The built-in Cordis Loader.'),
  'cordis:hmr': cap('Cordis 内置热更新（同 cordis-plugin-hmr 的简名形式）。', 'The built-in Cordis hot-reload.'),
  'cordis:timer': cap('Cordis 内置定时器（同 cordis-plugin-timer 的简名形式）。', 'The built-in Cordis timer.'),
  'cordis:active': cap('通用激活态占位模块。', 'A generic active-state placeholder.'),
  'cordis:not-installed': cap('一个未被实际安装的条目（用于展示“等待”状态）。', 'A row whose module is not installed.'),

  '@deepseek-ai/dsh-agent-loop': cap(
    '智能体循环驱动内核：逐轮调度模型与工具调用，管理会话、并发与异步任务。',
    'The agent loop core: drives model/tool-call rounds, sessions, concurrency, and async tasks.',
  ),
  '@deepseek-ai/dsh-agent': cap(
    '智能体抽象：提供 Agents 服务以追踪实时执行的智能体及其归属。',
    'Agent abstraction that tracks live agents and their initiating owner.',
  ),
  '@deepseek-ai/dsh-agent-default-model': cap(
    '默认模型：为未显式指定时的各级提供回退模型。',
    'Falls back to a default model when none is explicitly chosen.',
  ),
  '@deepseek-ai/dsh-session': cap(
    '会话模型：会话的身份、事件与元数据，以及与其生命周期相关的服务。',
    'Session model: identity, events, metadata, and lifecycle-bound services.',
  ),
  '@deepseek-ai/dsh-api-gateway': cap(
    '对外 API 网关：把 Host 的服务能力按需暴露给外部与前端调用。',
    'Gateway exposing Host capabilities to the outside world and the web surface.',
  ),
  '@deepseek-ai/dsh-api-remotes': cap(
    '定义 Host↔Client 的远程调用契约（Remote 命名空间与方法）。',
    'Declares the Host↔Client remote-call contracts (Remote namespaces/methods).',
  ),
  '@deepseek-ai/dsh-llm': cap(
    '大模型统一调用服务：提供商接入、模型解析与请求分发。',
    'Unified LLM service: provider adapter, model resolution, and request dispatch.',
  ),
  '@deepseek-ai/dsh-llm-deepseek': cap(
    'DeepSeek 大模型提供商接入。',
    'DeepSeek LLM provider adapter.',
  ),
  '@deepseek-ai/dsh-llm-pi-ai': cap(
    'Pi-AI 大模型提供商接入。',
    'Pi-AI LLM provider adapter.',
  ),
  '@deepseek-ai/dsh-llm-retry': cap(
    'LLM 请求重试与容错：限流、中断、预算与退避重试。',
    'LLM retry & resilience: rate limits, cancellation, budgets, and backoff.',
  ),
  '@deepseek-ai/dsh-tool-fs': cap(
    '文件系统工具：读、写、列目录、查找（经沙箱复核权限）。',
    'Filesystem tools: read/write/list/edit gated by the sandbox.',
  ),
  '@deepseek-ai/dsh-tool-fs-search': cap(
    '文件内容搜索工具（基于 ripgrep）。',
    'Full-text file search tool backed by ripgrep.',
  ),
  '@deepseek-ai/dsh-tool-bash': cap(
    'Bash 命令执行工具（可进 Bash 沙箱）。',
    'Bash command execution tooling (sandboxable).',
  ),
  '@deepseek-ai/dsh-tool-pwsh': cap(
    'PowerShell 命令执行工具（可进 PowerShell 沙箱）。',
    'PowerShell execution tooling (sandboxable).',
  ),
  '@deepseek-ai/dsh-tool-web': cap(
    '网络搜索/抓取工具，用于收集当前信息。',
    'Web search/retrieval tools for current information.',
  ),
  '@deepseek-ai/dsh-tool-subagent': cap(
    '子代理工具：派生子任务到独立会话执行并回收结果。',
    'Subagent tooling: fan out work to isolated child sessions and collect results.',
  ),
  '@deepseek-ai/dsh-tool-workflow': cap(
    '工作流编排工具：以脚本风扇式地将任务分解给多个子代理。',
    'Workflow orchestration: scripted fan-out across many subagents.',
  ),
  '@deepseek-ai/dsh-tool-goal': cap(
    '目标工具：跨轮次推进长期目标。',
    'Goal tooling to drive long-running objectives across rounds.',
  ),
  '@deepseek-ai/dsh-tool-ralph': cap(
    'Ralph 循环：每轮用全新的智能体迭代执行一个目标。',
    'Ralph loop: fresh-agent iteration toward one objective each round.',
  ),
  '@deepseek-ai/dsh-tool-skill': cap(
    '技能工具：加载并应用可用技能说明。',
    'Skill tooling: load and apply available skill instructions.',
  ),
  '@deepseek-ai/dsh-tool-todo': cap(
    '任务清单工具：计划并展示多步工作进度。',
    'Todo tooling: plan and surface multi-step work.',
  ),
  '@deepseek-ai/dsh-tool-jobs': cap(
    '后台任务工具：启动、查询与回收后台 job。',
    'Background jobs tooling: start, list, and reclaim background work.',
  ),
  '@deepseek-ai/dsh-tools': cap(
    '汇聚各类工具注册的公共入口。',
    'Common entry that aggregates tool registrations.',
  ),
  '@deepseek-ai/dsh-skills': cap(
    '（占位，技能宿主）技能声明与加载。',
    'Skill host: declare and load skills.',
  ),
  '@deepseek-ai/dsh-skill': cap(
    '技能能力：声明并解析可用技能。',
    'Skill capability: declare and resolve available skills.',
  ),
  '@deepseek-ai/dsh-subagent': cap(
    '子代理运行时：创建与管理独立的子代理会话。',
    'Subagent runtime: create and manage isolated child sessions.',
  ),
  '@deepseek-ai/dsh-tools-plugin-inventory': cap(
    '插件盘点：可读当前已装载的插件列表。',
    'Plugin inventory: read the currently mounted plugin set.',
  ),
  '@deepseek-ai/dsh-typert-loader': cap(
    '类型安全的 Remote 契约装载。',
    'Loads the typed Remote contract descriptors.',
  ),
  '@deepseek-ai/dsh-typert-registry': cap(
    'Remote/契约注册中心。',
    'Registry of Remote contracts.',
  ),
  '@deepseek-ai/dsh-settings-file': cap(
    '设置持久化：把用户设置写回 YAML 文件。',
    'Persist settings to the YAML file.',
  ),
  '@deepseek-ai/dsh-credentials-local': cap(
    '本地凭证存储。',
    'Local credential store.',
  ),
  '@deepseek-ai/dsh-fs-local': cap(
    '本地文件系统后端接入。',
    'Local filesystem backend.',
  ),
  '@deepseek-ai/dsh-bash-sandbox': cap(
    'Bash 沙箱：约束命令在受限环境内执行。',
    'Bash sandbox: confine commands to a restricted runtime.',
  ),
  '@deepseek-ai/dsh-pwsh-sandbox': cap(
    'PowerShell 沙箱：约束命令在受限模式执行。',
    'PowerShell sandbox: confine commands to a restricted mode.',
  ),
  '@deepseek-ai/dsh-sandbox-policy': cap(
    '沙箱访问策略：判定文件/命令操作所需权限模式。',
    'Sandbox policy: decides which permission a file/command operation needs.',
  ),
  '@deepseek-ai/dsh-fs-observation-policy': cap(
    '读操作先读的原则：修改文件前要求先读取。',
    'Edfile-before-modify observation policy.',
  ),
  '@deepseek-ai/dsh-commands': cap(
    '命令套件：向工具集注册各类可用命令。',
    'Command suite that registers handy commands.',
  ),
  '@deepseek-ai/dsh-command-compact': cap(
    '压缩命令：折叠长对话以释放上下文。',
    'Compaction: condense history to free context.',
  ),
  '@deepseek-ai/dsh-command-goal': cap(
    '目标命令：查看/更新当前目标。',
    'Goal commands: read/update the active goal.',
  ),
  '@deepseek-ai/dsh-command-feedback': cap(
    '反馈命令：向用户传达状态与提示。',
    'Feedback: communicate status and prompts.',
  ),
  '@deepseek-ai/dsh-goal': cap(
    '目标能力：跨轮次推进长期完成目标。',
    'Goal capability: advance long-running objectives.',
  ),
  '@deepseek-ai/dsh-goal-round-driver': cap(
    '目标轮次驱动：自动延续目标的多轮执行。',
    'Goal round driver: automatic continuation rounds.',
  ),
  '@deepseek-ai/dsh-plan-mode': cap(
    '计划模式：先出计划、经用户确认再执行。',
    'Plan mode: present a plan and await approval before acting.',
  ),
  '@deepseek-ai/dsh-subagent-fork-in-process': cap(
    '继承上下文的子代理（同进程）。',
    'Context-inheriting subagents, in-process.',
  ),
  '@deepseek-ai/dsh-subagent-spawn-in-process': cap(
    '独立上下文的子代理（同进程派生）。',
    'Independent-context subagents, in-process spawn.',
  ),
  '@deepseek-ai/dsh-session-persistence-jsonl': cap(
    '会话持久化：以 JSONL 存储会话事件。',
    'Persist sessions as JSONL events.',
  ),
  '@deepseek-ai/dsh-session-title': cap(
    '会话标题：为对话生成标题。',
    'Session titles: name a conversation.',
  ),
  '@deepseek-ai/dsh-session-projection': cap(
    '会话投影：派生/检索会话视图。',
    'Session projection: derive/retrieve session views.',
  ),
  '@deepseek-ai/dsh-token-meter': cap(
    'Token 计量：统计模型用量。',
    'Token metering: track model usage.',
  ),
  '@deepseek-ai/dsh-jobs-local': cap(
    '本地后台任务：管理后台 job 生命周期。',
    'Local jobs: manage background job lifecycle.',
  ),
  '@deepseek-ai/dsh-storage': cap(
    '键值存储服务。',
    'Key-value storage service.',
  ),
  '@deepseek-ai/dsh-workspace': cap(
    '工作区能力：读取/提供工作目录与上下文。',
    'Workspace: current directory and contextual storage.',
  ),
  '@deepseek-ai/dsh-session-checkpoint-policy': cap(
    '会话检查点策略：何时生成摘要压缩。',
    'Checkpoint policy: when to compact via summary.',
  ),
  '@deepseek-ai/dsh-compaction-basic': cap(
    '基础压缩：把旧事件折叠成摘要。',
    'Basic compaction: fold old turns into a summary.',
  ),
  '@deepseek-ai/dsh-compaction-tool-result-pruner': cap(
    '工具结果修剪：压缩大工具输出。',
    'Tool-result pruning to shrink large outputs.',
  ),
  '@deepseek-ai/dsh-tool-call-timeout-policy': cap(
    '工具调用超时策略。',
    'Policy for tool-call timeouts.',
  ),
  '@deepseek-ai/dsh-user-approval': cap(
    '用户审批：把危险操作转成审批面，等待用户批准/拒绝。',
    'Approval gate: escalate sensitive actions for the user to approve or reject.',
  ),
  '@deepseek-ai/dsh-user-questions': cap(
    '用户问题：把澄清问题提交给用户选择。',
    'Ask the user a concise question with options.',
  ),
  '@deepseek-ai/dsh-attachment-local': cap(
    '本地附件：处理本地附件/引用。',
    'Handle local attachments.',
  ),
  '@deepseek-ai/dsh-permission-presets': cap(
    '权限预设：常用权限模式的开关预设。',
    'Permission presets: local fences for common permission levels.',
  ),
  '@deepseek-ai/dsh-client-connection': cap(
    '前端连接：建立浏览器到 Host 的通道。',
    'Establishes the browser↔Host channel.',
  ),
  '@deepseek-ai/dsh-client-runtime': cap(
    '前端运行时：加载 Web 设置渲染环境。',
    'Loads the web settings/render runtime.',
  ),
  '@deepseek-ai/dsh-client-modules': cap(
    '前端模块注入：把各 UI 模块绑定到 Slots。',
    'Injects browser UI modules into Slots.',
  ),
  '@deepseek-ai/dsh-client-ui-settings': cap(
    '设置页面的容器与插槽。',
    'Provides the settings pages and their Slots.',
  ),
  '@deepseek-ai/dsh-client-ui-sidebar': cap(
    '侧边栏界面。',
    'Sidebar UI.',
  ),
  '@deepseek-ai/dsh-client-ui-conversation': cap(
    '对话主界面。',
    'Conversation UI.',
  ),
  '@deepseek-ai/dsh-client-ui-tool': cap(
    '工具调用卡片界面。',
    'Tool-call card UI.',
  ),
  '@deepseek-ai/dsh-host-webserver': cap(
    '内嵌 Web 服务器：把前端静态资源与后端接口一并托管。',
    'Embedded web server serving frontend static files and APIs.',
  ),
  '@deepseek-ai/dsh-host-frontend-static': cap(
    '前端静态资源服务（dist 托管）。',
    'Serves the built frontend dist.',
  ),
  '@deepseek-ai/dsh-host-plugin-inventory': cap(
    '插件盘点服务：供设置页读插件并持久化开关。',
    'Exposes the plugin list to settings and persists toggles.',
  ),
  '@deepseek-ai/dsh-client-ui-settings-plugin-inventory': cap(
    '设置里的「插件列表」界面：显示插件、状态与开关。',
    'The Plugin List settings panel: plugins, state, and switches.',
  ),
  '@deepseek-ai/dsh-client-ui-settings-plugins': cap(
    '设置里的「插件」入口页签。',
    'The Plugins settings tab entry.',
  ),
}

/**
 * Blurb for an unlisted module: does not invent any capability, explains that
 * the module is a DS plugin/component without a curated intro yet.
 */
export const UNLISTED: CapabilityText = cap(
  '本仓库的一个 DS 插件/组件（暂无专属简介）。',
  'A DS plugin/component (no curated blurb yet).',
)

/** Pick the active-locale blurb for a module name. */
export function capabilityFor(moduleName: string, locale: 'zh' | 'en'): string {
  return (CAPABILITY_CATALOG[moduleName] ?? UNLISTED)[locale]
}
