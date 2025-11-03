'use client'

import {
  type GenerateUploadSignatureParams,
  generateUploadSignature,
} from '@/actions/upload-files'
import type { OrganizationTeamParams } from '@/lib/types'
import * as React from 'react'

type UploadedFile =
  | {
      status: 'success'
      id: string
      fileName: string
      fileMimeType: string
      fileSize: number
      filePath: string
      [key: string]: any
    }
  | {
      status: 'error'
      error: {
        code: string
        message: string
      }
      fileName: string
    }

export function useUploadFiles(
  { organizationSlug, teamId }: OrganizationTeamParams,
  params: GenerateUploadSignatureParams,
) {
  const [uploading, setUploading] = React.useState(false)

  const uploadFiles = async ({ files: filesToUpload }: { files: File[] }) => {
    const files: UploadedFile[] = []

    try {
      setUploading(true)

      const { data, error } = await generateUploadSignature(
        { organizationSlug, teamId },
        params,
      )

      if (error) {
        return { data: null, error }
      }

      let baseUrl = '/api/files'

      if (params.scope === 'conversations') {
        baseUrl = '/api/conversations/files'
      } else if (params.scope === 'sources') {
        baseUrl = '/api/sources/files'
      }

      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.set('file', file as File)

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'x-upload-signature': data.signature,
          },
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          files.push({
            status: 'error' as const,
            error: {
              code: 'FAILED_TO_UPLOAD_FILE',
              message: 'Failed to upload file',
            },
            fileName: file.name,
          })
        } else {
          const [file] = result.files

          files.push(file)
        }
      }

      return { data: { files }, error: null }
    } catch {
      return {
        data: null,
        error: { message: 'Error uploading files, please try again' },
      }
    } finally {
      setUploading(false)
    }
  }

  return { uploading, uploadFiles }
}
