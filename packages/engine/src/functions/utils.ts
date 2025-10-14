import { createHash } from 'node:crypto'
import { v5 as uuidv5 } from 'uuid'
import type { TableMetadata } from '../lib/types'

const NAMESPACE = '00000000-0000-0000-0000-000000000000' as const

export function deterministicUuid(content: string): string {
  const hashHex = createHash('sha256').update(content).digest('hex')
  return uuidv5(hashHex, NAMESPACE)
}

export function createSchema(tablesMetadata: TableMetadata[]) {
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
