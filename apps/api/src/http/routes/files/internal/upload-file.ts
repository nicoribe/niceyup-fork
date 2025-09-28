import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import {
  uploadFileToStorage,
  validatedFileForUpload,
  verifySignatureForUpload,
} from '@/http/functions/upload-file-to-storage'
import type { FastifyTypedInstance } from '@/types/fastify'
import { z } from 'zod'

export async function uploadFile(app: FastifyTypedInstance) {
  app.post(
    '/files',
    {
      schema: {
        consumes: ['multipart/form-data'],
        tags: ['[Internal] Files'],
        description: 'Upload File',
        operationId: 'uploadFile',
        headers: z.object({
          'x-upload-signature': z.string(),
        }),
        // body: z.object({
        //   file: z.custom<MultipartFile>(),
        // }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              file: z.object({
                id: z.string(),
                fileName: z.string(),
                fileMimeType: z.string(),
                fileUri: z.string(),
                bucket: z.enum(['default', 'engine']),
                scope: z.enum(['public', 'conversations', 'sources']),
              }),
            })
            .describe('Success'),
        }),
      },
    },
    async (request) => {
      const { 'x-upload-signature': signature } = request.headers

      const { data, accept } = verifySignatureForUpload({ signature })

      const file = await request.file({
        limits: {
          files: 1,
          fileSize: 15 * 1024 * 1024, // 15 MB
        },
      })

      if (!file) {
        throw new BadRequestError({
          code: 'FILE_NOT_FOUND',
          message: 'File not found in the request',
        })
      }

      if (file.file.truncated) {
        throw new BadRequestError({
          code: 'FILE_SIZE_LIMIT_REACHED',
          message: 'File size limit reached',
        })
      }

      const validatedFile = await validatedFileForUpload({ file, accept })

      const uploadedFile = await uploadFileToStorage({
        data,
        file: validatedFile,
      })

      return { file: uploadedFile }
    },
  )
}
