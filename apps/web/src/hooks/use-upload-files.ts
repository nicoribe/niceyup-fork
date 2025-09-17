'use client'

import { generateUploadSignature } from '@/actions/upload-files'
import type { sdk } from '@/lib/sdk'
import type { OrganizationTeamParams } from '@/lib/types'
import * as React from 'react'

type ParametersGenerateUploadSignature = Parameters<
  typeof generateUploadSignature
>[1]

type UploadedFile = NonNullable<
  Awaited<ReturnType<typeof sdk.uploadFile>>['data']
>['file']

type ReturnUploadFiles = {
  data: { files: UploadedFile[] }
  error: Awaited<ReturnType<typeof sdk.uploadFile>>['error']
}

export function useUploadFiles(
  { organizationSlug, teamId }: OrganizationTeamParams,
  params: ParametersGenerateUploadSignature,
) {
  const [uploading, setUploading] = React.useState(false)

  const uploadFiles = async ({
    files: filesToUpload,
  }: { files: File[] }): Promise<ReturnUploadFiles> => {
    const files: UploadedFile[] = []

    try {
      setUploading(true)

      const { data, error } = await generateUploadSignature(
        { organizationSlug, teamId },
        params,
      )

      if (error) {
        return { data: { files }, error }
      }

      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file as File)

        const response = await fetch('/api/files', {
          method: 'POST',
          headers: {
            'x-upload-signature': data.signature,
          },
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          return { data: { files }, error: result }
        }

        files.push(result.file)
      }

      return { data: { files }, error: null }
    } catch {
      return {
        data: { files },
        error: { message: 'Error uploading files, please try again' },
      }
    } finally {
      setUploading(false)
    }
  }

  return { uploading, uploadFiles }
}
