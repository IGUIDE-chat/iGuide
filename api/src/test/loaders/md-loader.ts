import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

interface LoadContext {
  format?: string
  importAttributes?: Record<string, string>
}

interface LoadResult {
  format: string
  shortCircuit?: boolean
  source: string | ArrayBuffer | Uint8Array
}

type NextLoad = (url: string, context?: LoadContext) => LoadResult

export function load(
  url: string,
  context: LoadContext,
  nextLoad: NextLoad
): LoadResult {
  if (url.endsWith('.md')) {
    const path = fileURLToPath(url)
    const content = readFileSync(path, 'utf-8')
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(content)};`,
    }
  }
  return nextLoad(url, context)
}
