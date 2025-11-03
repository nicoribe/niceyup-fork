import type { SourceType } from '@workspace/db/types'
import { generateEmbeddings } from '../lib/embeddings'
import type { Collection, SourcesDocument } from '../lib/types'
import { index } from '../upstash-vector'
import type {
  DatabaseSourceProperNounsDocument,
  DatabaseSourceQueryExamplesDocument,
  DatabaseSourceTablesMetadataDocument,
} from './upsert'

type QueryParams<T> = {
  namespace: string
  collection: T
  sourceId?: string
  sourceType?: SourceType
  query: string
  filter?: string
  topK?: number
}

type SourcesCollectionQueryResult = {
  collection: 'sources'
  sourceId: string
  sourceType: SourceType
  data: SourcesDocument
}

type DatabaseSourceTablesMetadataCollectionQueryResult = {
  collection: 'database-source-tables-metadata'
  sourceId: string
  sourceType: 'database'
  data: DatabaseSourceTablesMetadataDocument
}

type DatabaseSourceProperNounsCollectionQueryResult = {
  collection: 'database-source-proper-nouns'
  sourceId: string
  sourceType: 'database'
  data: DatabaseSourceProperNounsDocument
}

type DatabaseSourceQueryExamplesCollectionQueryResult = {
  collection: 'database-source-query-examples'
  sourceId: string
  sourceType: 'database'
  data: DatabaseSourceQueryExamplesDocument
}

type QueryResult = {
  sources: SourcesCollectionQueryResult
  'database-source-tables-metadata': DatabaseSourceTablesMetadataCollectionQueryResult
  'database-source-proper-nouns': DatabaseSourceProperNounsCollectionQueryResult
  'database-source-query-examples': DatabaseSourceQueryExamplesCollectionQueryResult
}

export async function query<T extends Collection>(params: QueryParams<T>) {
  let filter = `__collection = '${params.collection}'`

  if (params.sourceId) {
    filter += ` AND __sourceId = '${params.sourceId}'`
  }

  if (params.sourceType) {
    filter += ` AND __sourceType = '${params.sourceType}'`
  }

  if (params.filter) {
    filter += ` AND (${params.filter})`
  }

  const [vector] = await generateEmbeddings({ value: params.query })

  const documents = await index.namespace(params.namespace).query({
    vector: vector || [],
    filter,
    topK: params.topK || 5,
    includeMetadata: true,
    includeData: true,
  })

  const result = documents.map((doc) => {
    const { __collection, __sourceId, __sourceType, ...metadata } =
      doc.metadata as any

    return {
      id: doc.id,
      collection: __collection,
      sourceId: __sourceId,
      sourceType: __sourceType,
      data: {
        content: doc.data,
        metadata,
      },
    }
  })

  return result as any as QueryResult[T][]
}
