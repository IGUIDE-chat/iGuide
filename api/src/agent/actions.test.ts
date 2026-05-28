import assert from 'node:assert/strict'
import test from 'node:test'

import { executeToolAction } from './actions.ts'
import { ToolRegistry } from '../tools/registry.ts'
import { createEchoTool, createFailingTool } from '../test/utils/stubTools.ts'
import  {
  type RequestContext,
  type ToolDefinition,
  type ToolResult,
} from '../tools/types.ts'

const MOCK_CTX: RequestContext = {
  env: {},
  userId: 'test-user',
  region: 'global',
}

function createToolCall(options: {
  id?: string
  name?: string
  arguments?: string
}) {
  return {
    id: options.id ?? 'call_1',
    type: 'function' as const,
    function: {
      name: options.name ?? 'web_search',
      arguments: options.arguments ?? '{}',
    },
  }
}

test('executeToolAction executes a valid tool call through the registry', async () => {
  const registry = new ToolRegistry()
  let capturedArgs: Record<string, unknown> | undefined
  let capturedCtx: RequestContext | undefined

  const tool: ToolDefinition = {
    name: 'web_search',
    description: 'Searches the web',
    parameters: {},
    async execute(args, ctx): Promise<ToolResult> {
      capturedArgs = args
      capturedCtx = ctx
      return { content: 'UIUC housing search result' }
    },
  }
  registry.register(tool)

  const observation = await executeToolAction({
    toolCall: createToolCall({
      id: 'call_1',
      name: 'web_search',
      arguments: JSON.stringify({ query: 'UIUC housing' }),
    }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 2,
  })

  assert.deepEqual(capturedArgs, { query: 'UIUC housing' })
  assert.equal(capturedCtx, MOCK_CTX)
  assert.equal(observation.toolCallId, 'call_1')
  assert.equal(observation.toolName, 'web_search')
  assert.deepEqual(observation.input, { query: 'UIUC housing' })
  assert.equal(observation.status, 'success')
  assert.equal(observation.summary, 'UIUC housing search result')
  assert.equal(observation.stepIndex, 2)
  assert.equal(observation.providerMessage?.tool_call_id, 'call_1')
})

test('executeToolAction returns an error observation for invalid JSON arguments', async () => {
  const registry = new ToolRegistry()
  registry.register(createEchoTool('web_search'))

  const observation = await executeToolAction({
    toolCall: createToolCall({
      id: 'call_bad_args',
      name: 'web_search',
      arguments: '{"query":',
    }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 0,
  })

  assert.equal(observation.toolCallId, 'call_bad_args')
  assert.equal(observation.toolName, 'web_search')
  assert.deepEqual(observation.input, {})
  assert.equal(observation.status, 'error')
  assert.equal(observation.error?.code, 'invalid_arguments')
  assert.match(observation.summary, /JSON|Unexpected|Expected/i)
  assert.deepEqual(JSON.parse(observation.raw), {
    error: 'invalid_arguments',
    tool: 'web_search',
    message: observation.summary,
    raw_arguments: '{"query":',
  })
  assert.equal(registry.getCallCount(), 0)
})

test('executeToolAction returns an error observation for missing tools', async () => {
  const registry = new ToolRegistry()

  const observation = await executeToolAction({
    toolCall: createToolCall({ id: 'call_missing', name: 'missing_tool' }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 1,
  })

  assert.equal(observation.toolCallId, 'call_missing')
  assert.equal(observation.toolName, 'missing_tool')
  assert.equal(observation.status, 'error')
  assert.equal(observation.error?.code, 'tool_not_found')
  assert.deepEqual(JSON.parse(observation.raw), {
    error: 'tool_not_found',
    tool: 'missing_tool',
  })
})

test('executeToolAction returns an error observation when a tool throws', async () => {
  const registry = new ToolRegistry()
  registry.register(createFailingTool('web_search'))

  const observation = await executeToolAction({
    toolCall: createToolCall({ id: 'call_throw', name: 'web_search' }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 1,
  })

  assert.equal(observation.toolCallId, 'call_throw')
  assert.equal(observation.status, 'error')
  assert.equal(observation.error?.code, 'execution_failed')
  assert.equal(observation.summary, 'stub tool failure')
})

test('executeToolAction returns an error observation when registry budget is exceeded', async () => {
  const registry = new ToolRegistry({ maxCalls: 1 })
  registry.register(createEchoTool('web_search'))

  await executeToolAction({
    toolCall: createToolCall({ id: 'call_allowed', name: 'web_search' }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 0,
  })

  const observation = await executeToolAction({
    toolCall: createToolCall({ id: 'call_budget', name: 'web_search' }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 1,
  })

  assert.equal(observation.toolCallId, 'call_budget')
  assert.equal(observation.status, 'error')
  assert.equal(observation.error?.code, 'budget_exceeded')
  assert.deepEqual(JSON.parse(observation.raw), {
    error: 'budget_exceeded',
    max_calls: 1,
  })
})
