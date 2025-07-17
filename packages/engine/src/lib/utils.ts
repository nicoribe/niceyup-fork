export function scriptPath(filePath: string): string {
  return `src/python/${filePath}`
}

export function scriptArgs(args: Record<string, unknown>): string[] {
  return [JSON.stringify(args)]
}
