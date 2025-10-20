import { vectorStore } from '@workspace/vector-store'
import type {
  DatabaseSourceTableMetadata,
  SingleOrMultiple,
  SourceType,
} from '../lib/types'
import { generateEmbeddings } from './embeddings'
import { deterministicUuid } from './utils'

type VectorStoreCollection =
  | 'sources'
  | 'database-source-tables-metadata'
  | 'database-source-proper-nouns'
  | 'database-source-query-examples'

type VectorStoreSourcesCollectionUpsertParams = {
  collection: 'sources'
  sourceId: string
  sourceType: SourceType
  data: SingleOrMultiple<{
    content: string
    metadata?: never
  }>
}

type VectorStoreDatabaseSourceTablesMetadataCollectionUpsertParams = {
  collection: 'database-source-tables-metadata'
  sourceId: string
  sourceType: 'database'
  data: SingleOrMultiple<{
    content: string
    metadata: {
      tableMetadata: DatabaseSourceTableMetadata
    }
  }>
}

type VectorStoreDatabaseSourceProperNounsCollectionUpsertParams = {
  collection: 'database-source-proper-nouns'
  sourceId: string
  sourceType: 'database'
  data: SingleOrMultiple<{
    content: string
    metadata: {
      key: string
    }
  }>
}

type VectorStoreDatabaseSourceQueryExamplesCollectionUpsertParams = {
  collection: 'database-source-query-examples'
  sourceId: string
  sourceType: 'database'
  data: SingleOrMultiple<{
    content: string
    metadata?: never
  }>
}

type VectorStoreUpsertParams = {
  namespace: string
} & (
  | VectorStoreSourcesCollectionUpsertParams
  | VectorStoreDatabaseSourceTablesMetadataCollectionUpsertParams
  | VectorStoreDatabaseSourceProperNounsCollectionUpsertParams
  | VectorStoreDatabaseSourceQueryExamplesCollectionUpsertParams
)

export async function vectorStoreUpsert(params: VectorStoreUpsertParams) {
  const data = Array.isArray(params.data) ? params.data : [params.data]

  const embeddings = await generateEmbeddings({
    value: data.map((d) => d.content),
  })

  const documents = data.map((d, index) => ({
    id: deterministicUuid(
      [params.collection, params.sourceId, params.sourceType, d.content].join(
        ':',
      ),
    ),
    vector: embeddings[index],
    data: d.content,
    metadata: {
      __collection: params.collection,
      __sourceId: params.sourceId,
      __sourceType: params.sourceType,
      ...d.metadata,
    },
  }))

  if (!documents.length) {
    return 'No documents to upsert'
  }

  const result = await vectorStore.namespace(params.namespace).upsert(documents)

  return result
}

type VectorStoreQueryParams<T> = {
  namespace: string
  collection: T
  sourceId?: string
  sourceType?: SourceType
  query: string
  filter?: string
  topK?: number
}

type VectorStoreSourcesCollectionQueryResult = {
  collection: 'sources'
  sourceId: string
  sourceType: SourceType
  data: {
    content: string
    metadata?: never
  }
}

type VectorStoreDatabaseSourceTablesMetadataCollectionQueryResult = {
  collection: 'database-source-tables-metadata'
  sourceId: string
  sourceType: 'database'
  data: {
    content: string
    metadata: {
      tableMetadata: DatabaseSourceTableMetadata
    }
  }
}

type VectorStoreDatabaseSourceProperNounsCollectionQueryResult = {
  collection: 'database-source-proper-nouns'
  sourceId: string
  sourceType: 'database'
  data: {
    content: string
    metadata: {
      key: string
    }
  }
}

type VectorStoreDatabaseSourceQueryExamplesCollectionQueryResult = {
  collection: 'database-source-query-examples'
  sourceId: string
  sourceType: 'database'
  data: {
    content: string
    metadata?: never
  }
}

type VectorStoreQueryResult = {
  sources: VectorStoreSourcesCollectionQueryResult
  'database-source-tables-metadata': VectorStoreDatabaseSourceTablesMetadataCollectionQueryResult
  'database-source-proper-nouns': VectorStoreDatabaseSourceProperNounsCollectionQueryResult
  'database-source-query-examples': VectorStoreDatabaseSourceQueryExamplesCollectionQueryResult
}

export async function vectorStoreQuery<T extends VectorStoreCollection>(
  params: VectorStoreQueryParams<T>,
) {
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

  const documents = await vectorStore.namespace(params.namespace).query({
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

  return result as any as VectorStoreQueryResult[T][]
}
