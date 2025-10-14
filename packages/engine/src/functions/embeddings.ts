import { embedMany } from '@workspace/ai'
import { embeddingModel } from './models'

export async function generateEmbeddings({
  value,
}: {
  value: string | string[]
}) {
  const chunks = Array.isArray(value) ? value : [value]

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  })

  return embeddings
}
