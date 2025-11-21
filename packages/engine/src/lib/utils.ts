import path from 'node:path'
import { env } from './env'
import type { DatabaseSourceTableMetadata } from './types'

export function tmpDir(...paths: string[]): string {
  const rootPath = '/tmp/.niceyup-engine' as const

  if (env.APP_ENV === 'development') {
    return path.join('./', rootPath, ...paths)
  }

  return path.join(rootPath, ...paths)
}

export function createSchemaDDL(tablesMetadata: DatabaseSourceTableMetadata[]) {
  const lines = []

  for (const table of tablesMetadata) {
    let tableLine = `CREATE TABLE "${table.name}" (\n`

    const columnsLine = []

    for (const column of table.columns) {
      let referenceLine = ''

      if (column.foreign_table && column.foreign_column) {
        referenceLine = ` REFERENCES "${column.foreign_table}" ("${column.foreign_column}")`
      }

      columnsLine.push(`  "${column.name}" ${column.data_type}${referenceLine}`)
    }

    tableLine += `${columnsLine.join(',\n')}\n)\n`

    lines.push(tableLine)
  }

  return lines.join('\n')
}
