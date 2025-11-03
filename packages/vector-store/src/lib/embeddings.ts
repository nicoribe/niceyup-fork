import { embedMany } from '@workspace/ai'
import { openai } from '@workspace/ai/providers'

export async function generateEmbeddings({
  value,
}: {
  value: string | string[]
}) {
  const chunks = Array.isArray(value) ? value : [value]

  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: chunks,
  })

  return embeddings
}
