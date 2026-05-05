export interface KVNamespaceLike {
  get(key: string, type: 'text'): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
  list(options?: {
    prefix?: string
    cursor?: string
    limit?: number
  }): Promise<{
    keys: Array<{ name: string }>
    list_complete: boolean
    cursor?: string
  }>
}

export interface MCPStoreRecord<T> {
  key: string
  value: T
}

export interface MCPStore {
  get<T>(key: string): Promise<T | null>
  put<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  list<T>(prefix: string): Promise<MCPStoreRecord<T>[]>
}

export interface MCPStoreOptions {
  kv?: KVNamespaceLike | null
  env?: Record<string, unknown> | null
  bindingName?: string
  namespace?: string
}

const DEFAULT_NAMESPACE = 'mcp'
const DEFAULT_BINDING_NAME = 'KV'

const globalScope = globalThis as typeof globalThis & {
  __mcpStoreMap__?: Map<string, string>
}

function getSharedMap(): Map<string, string> {
  if (!globalScope.__mcpStoreMap__) {
    globalScope.__mcpStoreMap__ = new Map<string, string>()
  }

  return globalScope.__mcpStoreMap__
}

function serialize<T>(value: T): string {
  return JSON.stringify(value)
}

function deserialize<T>(value: string | null): T | null {
  if (value === null) {
    return null
  }

  return JSON.parse(value) as T
}

function buildKey(namespace: string, key: string): string {
  return `${namespace}:${key}`
}

class MapMCPStore implements MCPStore {
  private readonly storage: Map<string, string>
  private readonly namespace: string

  constructor(storage: Map<string, string>, namespace: string) {
    this.storage = storage
    this.namespace = namespace
  }

  async get<T>(key: string): Promise<T | null> {
    return deserialize<T>(
      this.storage.get(buildKey(this.namespace, key)) ?? null
    )
  }

  async put<T>(key: string, value: T): Promise<void> {
    this.storage.set(buildKey(this.namespace, key), serialize(value))
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(buildKey(this.namespace, key))
  }

  async list<T>(prefix: string): Promise<MCPStoreRecord<T>[]> {
    const qualifiedPrefix = buildKey(this.namespace, prefix)
    const matches: MCPStoreRecord<T>[] = []

    for (const [qualifiedKey, rawValue] of this.storage.entries()) {
      if (!qualifiedKey.startsWith(qualifiedPrefix)) {
        continue
      }

      matches.push({
        key: qualifiedKey.slice(`${this.namespace}:`.length),
        value: JSON.parse(rawValue) as T,
      })
    }

    return matches.sort((left, right) => left.key.localeCompare(right.key))
  }
}

class KVMCPStore implements MCPStore {
  private readonly kv: KVNamespaceLike
  private readonly namespace: string

  constructor(kv: KVNamespaceLike, namespace: string) {
    this.kv = kv
    this.namespace = namespace
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(buildKey(this.namespace, key), 'text')
    return deserialize<T>(value)
  }

  async put<T>(key: string, value: T): Promise<void> {
    await this.kv.put(buildKey(this.namespace, key), serialize(value))
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(buildKey(this.namespace, key))
  }

  async list<T>(prefix: string): Promise<MCPStoreRecord<T>[]> {
    const qualifiedPrefix = buildKey(this.namespace, prefix)
    const keys: string[] = []
    let cursor: string | undefined

    while (true) {
      const page = await this.kv.list({
        prefix: qualifiedPrefix,
        cursor,
      })

      keys.push(...page.keys.map((entry) => entry.name))
      if (page.list_complete) {
        break
      }

      cursor = page.cursor
    }

    const records = await Promise.all(
      keys.sort().map(async (qualifiedKey) => {
        const value = await this.kv.get(qualifiedKey, 'text')
        if (value === null) {
          return null
        }

        return {
          key: qualifiedKey.slice(`${this.namespace}:`.length),
          value: JSON.parse(value) as T,
        }
      })
    )

    return records.filter(
      (record): record is MCPStoreRecord<T> => record !== null
    )
  }
}

function resolveKV(options?: MCPStoreOptions): KVNamespaceLike | null {
  if (options?.kv) {
    return options.kv
  }

  const bindingName = options?.bindingName ?? DEFAULT_BINDING_NAME
  const maybeKV = options?.env?.[bindingName]

  if (!maybeKV || typeof maybeKV !== 'object') {
    return null
  }

  return maybeKV as KVNamespaceLike
}

export function createMCPStore(options?: MCPStoreOptions): MCPStore {
  const namespace = options?.namespace ?? DEFAULT_NAMESPACE
  const kv = resolveKV(options)

  if (kv) {
    return new KVMCPStore(kv, namespace)
  }

  return new MapMCPStore(getSharedMap(), namespace)
}

export const defaultMCPStore = createMCPStore()
