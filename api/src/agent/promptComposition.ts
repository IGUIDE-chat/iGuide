export function joinPromptSections(
  sections: Array<string | null | undefined>
): string {
  return sections
    .map((section) => section?.trim())
    .filter((section): section is string => Boolean(section))
    .join("\n\n")
}

export function fillPromptTemplate(
  template: string,
  values: Record<string, string | null | undefined>
): string {
  return template.replaceAll(/{{\s*([\w-]+)\s*}}/g, (_match, key: string) => {
    return values[key]?.trim() ?? ""
  })
}
