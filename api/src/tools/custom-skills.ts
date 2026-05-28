import campusNavigationSkill from "../skills/campus_navigation.json"
import compareDormsSkill from "../skills/compare_dorms.json"
import findByCriteriaSkill from "../skills/find_by_criteria.json"
import { type ToolRegistry } from "./registry"
import { type ToolDefinition, type ToolResult } from "./types"

type SkillParameterType = "string" | "number" | "boolean"

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

interface CustomSkillsArgs {
  skill_id: string
  parameters?: Record<string, unknown>
}

function isSkillParameterType(value: unknown): value is SkillParameterType {
  return value === "string" || value === "number" || value === "boolean"
}

function parseSkillConfig(rawConfig: unknown): SkillConfig {
  if (!isObjectRecord(rawConfig)) {
    throw new Error("Invalid skill config: expected object")
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
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof prompt_template !== "string" ||
    typeof output_format !== "string" ||
    !Array.isArray(required_tools) ||
    required_tools.some((toolName) => typeof toolName !== "string") ||
    !isObjectRecord(parameters)
  ) {
    throw new Error(`Invalid skill config: ${String(id ?? "unknown")}`)
  }

  const parsedParameters: Record<string, SkillParameterDefinition> = {}

  for (const [parameterName, definition] of Object.entries(parameters)) {
    if (!isObjectRecord(definition)) {
      throw new Error(`Invalid parameter definition: ${parameterName}`)
    }

    const { type, description: parameterDescription, required } = definition
    if (
      !isSkillParameterType(type) ||
      typeof parameterDescription !== "string" ||
      typeof required !== "boolean"
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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function matchesParameterType(
  type: SkillParameterType,
  value: unknown
): boolean {
  if (type === "string") {
    return typeof value === "string" && value.trim().length > 0
  }

  if (type === "number") {
    return typeof value === "number" && Number.isFinite(value)
  }

  return typeof value === "boolean"
}

function formatParameterValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim()
  }

  return String(value)
}

function validateSkillArgs(
  args: Record<string, unknown>
): CustomSkillsArgs | ToolResult {
  const { skill_id, parameters } = args

  if (typeof skill_id !== "string" || skill_id.trim().length === 0) {
    return {
      content: JSON.stringify(
        {
          error: "Invalid skill_id",
          message: "skill_id must be a non-empty string",
        },
        null,
        2
      ),
      metadata: {
        error: true,
      },
    }
  }

  if (parameters !== undefined && !isObjectRecord(parameters)) {
    return {
      content: JSON.stringify(
        {
          error: "Invalid parameters",
          message: "parameters must be an object when provided",
        },
        null,
        2
      ),
      metadata: {
        error: true,
      },
    }
  }

  return {
    skill_id: skill_id.trim(),
    parameters,
  }
}

function expandPromptTemplate(
  template: string,
  parameters: Record<string, unknown>
): string {
  return template.replaceAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) => {
    if (!(key in parameters)) {
      return match
    }

    return formatParameterValue(parameters[key])
  })
}

function validateSkillParameters(
  skill: SkillConfig,
  parameters: Record<string, unknown>
): ToolResult | null {
  const missingParameters: string[] = []
  const invalidParameters: Array<{
    parameter: string
    expected_type: SkillParameterType
    received_type: string
  }> = []

  for (const [name, definition] of Object.entries(skill.parameters)) {
    const value = parameters[name]
    if (value === undefined || value === null || value === "") {
      if (definition.required) {
        missingParameters.push(name)
      }
      continue
    }

    if (!matchesParameterType(definition.type, value)) {
      invalidParameters.push({
        parameter: name,
        expected_type: definition.type,
        received_type: Array.isArray(value) ? "array" : typeof value,
      })
    }
  }

  if (missingParameters.length === 0 && invalidParameters.length === 0) {
    return null
  }

  return {
    content: JSON.stringify(
      {
        error: "Invalid parameters",
        skill_id: skill.id,
        missing_parameters: missingParameters,
        invalid_parameters: invalidParameters,
      },
      null,
      2
    ),
    metadata: {
      error: true,
    },
  }
}

export function createCustomSkillsTool(registry: ToolRegistry): ToolDefinition {
  const tool: ToolDefinition = {
    name: "custom_skills",
    description:
      "Expand predefined structured-query skills into prompt instructions and required tool sequences.",
    parameters: {
      type: "object",
      properties: {
        skill_id: {
          type: "string",
          description: "Predefined skill ID to execute",
        },
        parameters: {
          type: "object",
          description:
            "Parameter values used to expand the skill prompt template",
          additionalProperties: true,
        },
      },
      required: ["skill_id", "parameters"],
    },
    execute: async (args: Record<string, unknown>): Promise<ToolResult> => {
      const parsedArgs = validateSkillArgs(args)
      if ("content" in parsedArgs) {
        return parsedArgs
      }

      const parameters = parsedArgs.parameters ?? {}
      const skill = SKILL_MAP.get(parsedArgs.skill_id)

      if (!skill) {
        return {
          content: JSON.stringify(
            {
              error: "Unknown skill",
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
          ),
          metadata: {
            error: true,
          },
        }
      }

      const validationError = validateSkillParameters(skill, parameters)
      if (validationError) {
        return validationError
      }

      return {
        content: JSON.stringify(
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
        ),
        metadata: {
          skill_id: skill.id,
          required_tools: skill.required_tools,
        },
      }
    },
  }

  registry.register(tool)
  return tool
}
