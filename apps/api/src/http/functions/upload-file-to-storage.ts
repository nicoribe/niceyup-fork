import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { BadRequestError } from '@/http/errors/bad-request-error'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import { env } from '@/lib/env'
import type { MultipartFile } from '@fastify/multipart'
import { queries } from '@workspace/db/queries'
import { DeleteObjectCommand, Upload, s3Client } from '@workspace/storage'
import { sign, verify } from 'jsonwebtoken'

export type FileBucket = 'default' | 'engine'

export type FileScope = 'public' | 'conversations' | 'sources'

export type FileMetadata = {
  authorId?: string
  agentId?: string
  conversationId?: string | null
  sourceId?: string
}

const BucketScope = {
  default: ['public', 'conversations'],
  engine: ['sources'],
}

type ContextValidateFileDataForUploadParams = {
  userId: string
} & (
  | {
      organizationId?: string | null
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug?: string | null
    }
) & {
    teamId?: string | null
  }

type ValidateFileDataForUploadParams = {
  bucket: FileBucket
  scope: FileScope
  metadata?: Omit<FileMetadata, 'authorId'>
}

export async function validateFileDataForUpload(
  context: ContextValidateFileDataForUploadParams,
  params: ValidateFileDataForUploadParams,
) {
  if (!BucketScope[params.bucket].includes(params.scope)) {
    throw new BadRequestError({
      code: 'INVALID_BUCKET_SCOPE',
      message: 'Invalid bucket scope',
    })
  }

  const ctx: {
    userId: string
    organizationId?: string
  } = {
    userId: context.userId,
  }

  if (context.organizationId || context.organizationSlug) {
    let organization = null

    if (context.organizationId) {
      organization = await queries.context.getOrganization(
        { userId: context.userId },
        { organizationId: context.organizationId },
      )
    }

    if (context.organizationSlug) {
      organization = await queries.context.getOrganization(
        { userId: context.userId },
        { organizationSlug: context.organizationSlug },
      )
    }

    if (!organization) {
      throw new BadRequestError({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      })
    }

    ctx.organizationId = organization.id
  }

  const fileMetadata: FileMetadata = {
    authorId: ctx.userId,
  }

  if (params.bucket === 'engine' && params.scope === 'sources') {
    if (!params.metadata?.sourceId) {
      throw new BadRequestError({
        code: 'SOURCE_REQUIRED',
        message: 'Source is required',
      })
    }

    const source = await queries.context.getSource(ctx, {
      sourceId: params.metadata.sourceId,
    })

    if (!source) {
      throw new BadRequestError({
        code: 'SOURCE_NOT_FOUND',
        message: 'Source not found or you don’t have access',
      })
    }

    fileMetadata.sourceId = params.metadata.sourceId
  }

  if (params.bucket === 'default' && params.scope === 'conversations') {
    if (!params.metadata?.agentId) {
      throw new BadRequestError({
        code: 'AGENT_REQUIRED',
        message: 'Agent is required',
      })
    }

    if (params.metadata.conversationId) {
      const conversation = await queries.context.getConversation(ctx, {
        agentId: params.metadata.agentId,
        conversationId: params.metadata.conversationId,
      })

      if (!conversation) {
        throw new BadRequestError({
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found or you don’t have access',
        })
      }

      fileMetadata.agentId = params.metadata.agentId
      fileMetadata.conversationId = params.metadata.conversationId
    } else {
      const agent = await queries.context.getAgent(ctx, {
        agentId: params.metadata.agentId,
      })

      if (!agent) {
        throw new BadRequestError({
          code: 'AGENT_NOT_FOUND',
          message: 'Agent not found or you don’t have access',
        })
      }

      fileMetadata.agentId = agent.id
    }
  }

  const ownerTypeCondition = ctx.organizationId
    ? { organizationId: ctx.organizationId }
    : { userId: ctx.userId }

  return {
    bucket: params.bucket,
    scope: params.scope,
    metadata: fileMetadata,
    owner: ownerTypeCondition,
  }
}

type FileData = {
  bucket: FileBucket
  scope: FileScope
  metadata: FileMetadata
  owner:
    | {
        userId: string
        organizationId?: never
      }
    | {
        userId?: never
        organizationId: string
      }
}

type FileUploadPayload = {
  data: FileData
  accept: string
}

type GenerateSignatureForUploadParams = {
  payload: FileUploadPayload
  expires: number
}

export function generateSignatureForUpload(
  params: GenerateSignatureForUploadParams,
) {
  const signature = sign(params.payload, env.UPLOAD_SECRET, {
    expiresIn: params.expires,
  })

  return signature
}

type VerifySignatureForUploadParams = {
  signature: string
}

export function verifySignatureForUpload(
  params: VerifySignatureForUploadParams,
) {
  try {
    return verify(params.signature, env.UPLOAD_SECRET) as FileUploadPayload
  } catch {
    throw new UnauthorizedError({
      code: 'INVALID_UPLOAD_SIGNATURE',
      message: 'Invalid upload signature',
    })
  }
}

type ValidatedFileForUploadParams = {
  file: MultipartFile
  accept: string
}

export async function validatedFileForUpload(
  params: ValidatedFileForUploadParams,
) {
  if (!params.file.filename) {
    throw new BadRequestError({
      code: 'FILE_NOT_FOUND',
      message: 'File not found in the request',
    })
  }

  if (params.accept !== '*') {
    const acceptedTypes = params.accept.split(',').map((type) => type.trim())

    const fileMimeType = params.file.mimetype
    const fileExtension = extname(params.file.filename)

    const isAccepted = acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return fileExtension.toLowerCase() === type.toLowerCase()
      }

      if (type.endsWith('/*')) {
        const [baseType] = type.split('/')
        return fileMimeType.startsWith(`${baseType}/`)
      }

      return fileMimeType === type
    })

    if (!isAccepted) {
      throw new BadRequestError({
        code: 'FILE_TYPE_NOT_ALLOWED',
        message: `File type "${fileMimeType}" is not allowed. Allowed types: "${params.accept}"`,
      })
    }
  }

  return params.file
}

type UploadFileToStorageParams = {
  data: FileData
  file: MultipartFile
}

export async function uploadFileToStorage(params: UploadFileToStorageParams) {
  if (!BucketScope[params.data.bucket].includes(params.data.scope)) {
    throw new BadRequestError({
      code: 'INVALID_BUCKET_SCOPE',
      message: 'Invalid bucket scope',
    })
  }

  const s3Bucket =
    params.data.bucket === 'engine'
      ? env.S3_ENGINE_BUCKET
      : env.S3_DEFAULT_BUCKET

  const uniqueFileName = `${Date.now().toString()}-${randomUUID()}`
  const fileExtension = extname(params.file.filename)

  const filePath = `${params.data.scope}/${uniqueFileName}${fileExtension}`

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: s3Bucket,
      Key: filePath,
      Body: params.file.file,
      ContentType: params.file.mimetype,
    },
  })

  await upload.done()

  const createdFile = await queries.createFile({
    fileName: params.file.filename,
    fileMimeType: params.file.mimetype,
    fileUri: filePath,
    bucket: params.data.bucket,
    scope: params.data.scope,
    metadata: params.data.metadata,
    owner: params.data.owner,
  })

  if (!createdFile) {
    // Delete the file from S3 if it was not created
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: s3Bucket, Key: filePath }),
    )

    throw new BadRequestError({
      code: 'FILE_NOT_CREATED',
      message: 'File not created',
    })
  }

  return createdFile
}
