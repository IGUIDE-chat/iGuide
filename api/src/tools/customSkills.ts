import { tool } from 'ai'
import { z } from 'zod'
import campusNavigationSkill from '../skills/campus_navigation.json'
import compareDormsSkill from '../skills/compare_dorms.json'
import findByCriteriaSkill from '../skills/find_by_criteria.json'
import type { RequestContext } from './types.ts'

type SkillParameterType = 'string' | 'number' | 'boolean'

interface SkillParameterDefinition {
  type: SkillParameterType
  description: string
  required: boolean
}

interface SkillConfig {
  id: string
  name: string
  description: string
  prompt_template: string
  required_tools: string[]
  output_format: string
  parameters: Record<string, SkillParameterDefinition>
}

function isSkillParameterType(value: unknown): value is SkillParameterType {
  return value === 'string' || value === 'number' || value === 'boolean'
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseSkillConfig(rawConfig: unknown): SkillConfig {
  if (!isObjectRecord(rawConfig)) {
    throw new Error('Invalid skill config: expected object')
  }

  const {
    id,
    name,
    description,
    prompt_template,
    required_tools,
    output_format,
    parameters,
  } = rawConfig

  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof description !== 'string' ||
    typeof prompt_template !== 'string' ||
    typeof output_format !== 'string' ||
    !Array.isArray(required_tools) ||
    required_tools.some((toolName) => typeof toolName !== 'string') ||
    !isObjectRecord(parameters)
  ) {
    throw new Error(`Invalid skill config: ${String(id ?? 'unknown')}`)
  }

  const parsedParameters: Record<string, SkillParameterDefinition> = {}

  for (const [parameterName, definition] of Object.entries(parameters)) {
    if (!isObjectRecord(definition)) {
      throw new Error(`Invalid parameter definition: ${parameterName}`)
    }

    const { type, description: parameterDescription, required } = definition
    if (
      !isSkillParameterType(type) ||
      typeof parameterDescription !== 'string' ||
      typeof required !== 'boolean'
    ) {
      throw new Error(`Invalid parameter definition: ${parameterName}`)
    }

    parsedParameters[parameterName] = {
      type,
      description: parameterDescription,
      required,
    }
  }

  return {
    id,
    name,
    description,
    prompt_template,
    required_tools,
    output_format,
    parameters: parsedParameters,
  }
}

const SKILL_CONFIGS: SkillConfig[] = [
  parseSkillConfig(compareDormsSkill),
  parseSkillConfig(findByCriteriaSkill),
  parseSkillConfig(campusNavigationSkill),
]

const SKILL_MAP = new Map(SKILL_CONFIGS.map((skill) => [skill.id, skill]))

function matchesParameterType(
  type: SkillParameterType,
  value: unknown
): boolean {
  if (type === 'string') {
    return typeof value === 'string' && value.trim().length > 0
  }

  if (type === 'number') {
    return typeof value === 'number' && Number.isFinite(value)
  }

  return typeof value === 'boolean'
}

function formatParameterValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  return String(value)
}

function expandPromptTemplate(
  template: string,
  parameters: Record<string, unknown>
): string {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) => {
    if (!(key in parameters)) {
      return match
    }

    return formatParameterValue(parameters[key])
  })
}

function validateSkillParameters(
  skill: SkillConfig,
  parameters: Record<string, unknown>
): void {
  const missingParameters: string[] = []
  const invalidParameters: Array<{
    parameter: string
    expected_type: SkillParameterType
    received_type: string
  }> = []

  for (const [name, definition] of Object.entries(skill.parameters)) {
    const value = parameters[name]
    if (value === undefined || value === null || value === '') {
      if (definition.required) {
        missingParameters.push(name)
      }
      continue
    }

    if (!matchesParameterType(definition.type, value)) {
      invalidParameters.push({
        parameter: name,
        expected_type: definition.type,
        received_type: Array.isArray(value) ? 'array' : typeof value,
      })
    }
  }

  if (missingParameters.length > 0 || invalidParameters.length > 0) {
    throw new Error(
      JSON.stringify(
        {
          error: 'Invalid parameters',
          skill_id: skill.id,
          missing_parameters: missingParameters,
          invalid_parameters: invalidParameters,
        },
        null,
        2
      )
    )
  }
}

const customSkillsSchema = z.object({
  skill_id: z.string().describe('Predefined skill ID to execute'),
  parameters: z
    .record(z.string(), z.unknown())
    .describe('Parameter values used to expand the skill prompt template'),
})

export function createCustomSkillsTool(_ctx: RequestContext) {
  return tool({
    description:
      'Expand predefined structured-query skills into prompt instructions and required tool sequences.',
    inputSchema: customSkillsSchema,
    execute: async (args: any) => {
      const { skill_id, parameters } = args as z.infer<
        typeof customSkillsSchema
      >
      const skill = SKILL_MAP.get(skill_id)

      if (!skill) {
        throw new Error(
          JSON.stringify(
            {
              error: 'Unknown skill',
              available_skills: SKILL_CONFIGS.map(
                ({ id, name, description }) => ({
                  id,
                  name,
                  description,
                })
              ),
            },
            null,
            2
          )
        )
      }

      validateSkillParameters(skill, parameters)

      return JSON.stringify(
        {
          skill_id: skill.id,
          name: skill.name,
          description: skill.description,
          expanded_prompt: expandPromptTemplate(
            skill.prompt_template,
            parameters
          ),
          tool_sequence: skill.required_tools,
          output_format: skill.output_format,
          parameters,
        },
        null,
        2
      )
    },
  })
}
