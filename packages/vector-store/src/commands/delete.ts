import { index } from '../upstash-vector'

type DeleteParams = {
  namespace: string
  sourceId: string
}

export async function del(params: DeleteParams) {
  await index.namespace(params.namespace).delete({
    filter: `__sourceId = '${params.sourceId}'`,
  })
}
