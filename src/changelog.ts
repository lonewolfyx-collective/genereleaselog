import type { ResolvedChangelogOptions } from '@/src/types.ts'
import { createReadStream, createWriteStream, existsSync, writeFileSync } from 'node:fs'
import { rename } from 'node:fs/promises'
import * as path from 'node:path'
import { convert } from 'convert-gitmoji'

export async function writeChangeLog(content: string, options: ResolvedChangelogOptions) {
  const lines: string[] = []

  lines.push(`## ${options.version}\n`)

  lines.push(content)

  const logMD = convert(lines.join('\n').trim(), true)

  const filePath = path.resolve(options.cwd, options?.output || 'CHANGELOG.md')
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '')
  }
  const tmpFile = `${filePath}.tmp`

  const ws = createWriteStream(tmpFile, { encoding: 'utf-8' })
  ws.write(`${logMD}\n\n`)

  await new Promise<void>((resolve, reject) => {
    const rs = createReadStream(filePath)
    rs.pipe(ws, { end: false })
    rs.on('end', () => {
      ws.end()
      resolve()
    })
    rs.on('error', reject)
  })

  await rename(tmpFile, filePath)
}
