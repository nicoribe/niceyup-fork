import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  paginateListObjectsV2,
} from '@aws-sdk/client-s3'
import { s3Client } from '../s3-client'

type DeleteParams = {
  bucket: string
  key: string
}

export async function del(params: DeleteParams) {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: params.bucket, Key: params.key }),
  )
}

type DeleteDirectoryParams = {
  bucket: string
  path: `/${string}/`
}

export async function deleteDirectory(params: DeleteDirectoryParams) {
  const prefix = `${params.path.replace(/^\/+|\/+$/g, '')}/`

  let deletedCount = 0

  const paginator = paginateListObjectsV2(
    { client: s3Client },
    { Bucket: params.bucket, Prefix: prefix },
  )

  for await (const page of paginator) {
    if (!page.Contents?.length) {
      continue
    }

    const objects = page.Contents

    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: params.bucket,
        Delete: { Objects: objects.map(({ Key }) => ({ Key })) },
      }),
    )

    deletedCount += objects.length
  }

  return deletedCount
}
