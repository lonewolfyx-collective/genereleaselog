import type { CategoryGitCommit, GitScopeCommit, IParseCommit, ResolvedChangelogOptions } from '@/src/types.ts'
import { convert } from 'convert-gitmoji'

export function generateMarkdown(commits: CategoryGitCommit, options: ResolvedChangelogOptions) {
  const lines: string[] = []

  if (options.description) {
    lines.push(`${options.description}`)
  }

  for (const [_, raw] of Object.entries(commits)) {
    lines.push(`### ${raw.title}\n`)
    for (const scope in raw.scopes as GitScopeCommit) {
      const scopeCommit = raw.scopes[scope] as IParseCommit[]
      const scopeLength = scopeCommit.length
      if (scope === 'other') {
        scopeCommit.forEach((commit: IParseCommit, index: number) => {
          lines.push(`- ${formatCommits(commit, options)}`)
          if (index === scopeLength - 1) {
            lines.push(` `)
          }
        })
      }
      else {
        if (scopeLength === 1) {
          lines.push(`- **${scope}**: ${formatCommits(scopeCommit[0], options)}`)
          lines.push(` `)
        }
        else {
          lines.push(`- **${scope}**`)
          scopeCommit.forEach((commit: IParseCommit, index: number) => {
            lines.push(`  - ${formatCommits(commit, options)}`)
            if (index === scopeLength - 1) {
              lines.push(` `)
            }
          })
        }
      }
    }
  }

  if (!lines.length)
    lines.push('*No significant changes*')

  const url = `https://${options.baseUrl}/${options.owner}/${options.repo}/compare/${options.from}...${options.to}`

  lines.push('', `##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](${url})`)

  return convert(lines.join('\n').trim(), true)
}

export function formatCommits(commit: IParseCommit, options: ResolvedChangelogOptions): string {
  return [
    ' ',
    `${commit.message}`,
    ' - ',
    'by',
    ' ',
    `**@${commit.raw.author.authorName}**`,
    ' ',
    commit.pr || commit.issue
      ? ` (${
        commit.pr ? `${formatReference('pull', commit.pr, options)}` : ''
      } ${
        commit.issue ? formatReference('issue', commit.issue, options) : ''
      }) `
      : '',
    `[<samp>(${commit.raw.shortHash})</samp>]`,
    `(https://${options.baseUrl}/${options.owner}/${options.repo}/commit/${commit.raw.shortHash})`,
  ].join('')
}

export function formatReference(type: string, value: string, options: ResolvedChangelogOptions): string {
  return `[${value}](https://${options.baseUrl}/${options.owner}/${options.repo}/${type}/${value.replace(/^#/, '')})`
}
