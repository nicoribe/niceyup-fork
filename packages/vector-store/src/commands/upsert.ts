import type {
  DatabaseSourceTableMetadata,
  SourceType,
} from '@workspace/db/types'
import { generateEmbeddings } from '../lib/embeddings'
import type { SingleOrMultiple, SourcesDocument } from '../lib/types'
import { deterministicUuid } from '../lib/utils'
import { index } from '../upstash-vector'

export type DatabaseSourceTablesMetadataDocument = {
  content: string
  metadata: {
    tableMetadata: DatabaseSourceTableMetadata
  }
}

export type DatabaseSourceProperNounsDocument = {
  content: string
  metadata: {
    key: string
  }
}

export type DatabaseSourceQueryExamplesDocument = {
  content: string
  metadata?: never
}

type SourcesCollectionUpsertParams = {
  collection: 'sources'
  sourceId: string
  sourceType: SourceType
  data: SingleOrMultiple<SourcesDocument>
}

type DatabaseSourceTablesMetadataCollectionUpsertParams = {
  collection: 'database-source-tables-metadata'
  sourceId: string
  sourceType: 'database'
  data: SingleOrMultiple<DatabaseSourceTablesMetadataDocument>
}

type DatabaseSourceProperNounsCollectionUpsertParams = {
  collection: 'database-source-proper-nouns'
  sourceId: string
  sourceType: 'database'
  data: SingleOrMultiple<DatabaseSourceProperNounsDocument>
}

type DatabaseSourceQueryExamplesCollectionUpsertParams = {
  collection: 'database-source-query-examples'
  sourceId: string
  sourceType: 'database'
  data: SingleOrMultiple<DatabaseSourceQueryExamplesDocument>
}

type UpsertParams = {
  namespace: string
} & (
  | SourcesCollectionUpsertParams
  | DatabaseSourceTablesMetadataCollectionUpsertParams
  | DatabaseSourceProperNounsCollectionUpsertParams
  | DatabaseSourceQueryExamplesCollectionUpsertParams
)

export async function upsert(params: UpsertParams) {
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

  const result = await index.namespace(params.namespace).upsert(documents)

  return result
}
