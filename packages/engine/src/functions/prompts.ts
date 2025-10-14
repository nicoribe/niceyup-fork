export function templatePromptAnswer({
  question,
}: {
  question: string
}) {
  return [
    {
      role: 'system' as const,
      content: `You are a helpful assistant. Check your knowledge base before answering any questions.
Only respond to questions using information from tool calls.
if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    },
    {
      role: 'user' as const,
      content: `Question: ${question}`,
    },
  ]
}

export function templatePromptWriteQuery({
  schema,
  queryExamples,
  question,
}: {
  schema: string
  queryExamples: string
  question: string
}) {
  return [
    {
      role: 'system' as const,
      content: `You are a helpful assistant.

Write a query to get the data.`,
    },
    {
      role: 'user' as const,
      content: `Question: ${question}

Dialect: DuckDB

Schema:
${schema}

Query Examples:
${queryExamples}`,
    },
  ]
}

export function templatePromptQueryEnhancementWithProperNouns({
  query,
}: {
  query: string
}) {
  return [
    {
      role: 'system' as const,
      content: `You are an assistant that helps to find the proper nouns in a query.

1. Extract all literal string values from the query (values between single quotes, e.g., 'Brazil').
2. For each unique literal string value, call the function \`searchProperNouns({ tableName, columnName, search })\` to validate or correct the value.
    - Do this only for string literals, not table names or column names.
    - Skip repeated values; validate each unique string only once.
3. Replace the original literal string in the query with the result returned by \`searchProperNouns\`.

Return "properNouns" with the proper nouns replaced. Example:
Query: \`SELECT * FROM "region_country" WHERE "name" = 'Brazil' OR "name" = 'United States';\`
Proper nouns: \`Brasil → Brazil, Estados Unidos → United States\``,
    },
    {
      role: 'user' as const,
      content: `Query: ${query}`,
    },
  ]
}
