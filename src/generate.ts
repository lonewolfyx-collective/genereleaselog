import type { ResolvedChangelogOptions } from '@/src/types.ts'
import { resolveConfig } from '@/src/config.ts'
import { getCommitLogs } from '@/src/git.ts'
import { generateMarkdown } from '@/src/markdown.ts'
import { groupByCommits, parseCommits, transformCommits } from '@/src/parse.ts'

export async function generate(options: ResolvedChangelogOptions): Promise<any> {
  const config = await resolveConfig(options)
  const rawCommits = await getCommitLogs(config.from, config.to, config.cwd)
  const parsedCommits = await parseCommits(rawCommits)
  const commits = groupByCommits(parsedCommits, config)
  const markdown = generateMarkdown(commits, config)

  return {
    config,
    commits,
    markdown,
    rawCommits: transformCommits(rawCommits),
  }
}
