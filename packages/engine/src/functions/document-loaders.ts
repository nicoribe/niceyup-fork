import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { MultiFileLoader } from 'langchain/document_loaders/fs/multi_file'
import { TextLoader } from 'langchain/document_loaders/fs/text'

export const fileLoaders = {
  '.txt': (path: string) => new TextLoader(path),
  '.pdf': (path: string) =>
    new PDFLoader(path, {
      // See: https://docs.langchain.com/oss/javascript/integrations/document_loaders/file_loaders/pdf#usage%2C-custom-pdfjs-build
      pdfjs: () => import('pdfjs-dist/legacy/build/pdf.mjs'),
    }),
}

export async function filesLoader({ filePaths }: { filePaths: string[] }) {
  const loader = new MultiFileLoader(filePaths, fileLoaders)

  const docs = await loader.load()

  return docs
}

export async function directoryLoader({
  directoryPath,
}: { directoryPath: string }) {
  const loader = new DirectoryLoader(directoryPath, fileLoaders)

  const docs = await loader.load()

  return docs
}
