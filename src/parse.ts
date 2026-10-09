import type {
  CategoryGitCommit,
  ConfigTypes,
  IParseCommit,
  IRawGitCommit,
  ResolvedChangelogOptions,
} from '@/src/types.ts'
import { isNotNull } from '@/src/utils.ts'

const authorCache = new Map<string, string>()
async function fetchAuthorName(
  email: string,
  fallback: string,
): Promise<string> {
  if (!email)
    return fallback

  if (authorCache.has(email)) {
    return authorCache.get(email)!
  }

  try {
    const res = await fetch(`https://ungh.cc/users/find/${email}`)
    const data = await res.json()
    const authorName = data?.user?.username || fallback

    authorCache.set(email, authorName)
    return authorName
  }
  catch {
    return fallback
  }
}

export async function transformCommits(
  commit: string,
): Promise<IRawGitCommit[]> {
  const chunks = commit
    .split('---\n')
    .slice(1)

  return Promise.all(
    chunks.map(async (item) => {
      const [firstLine = '', ...bodyLines] = item.split('\n')

      const [
        commits = '',
        shortHash = '',
        message = '',
        authorName = '',
        authorEmail = '',
        date = '',
      ] = firstLine.split('|').map(s => s.trim())

      const resolvedAuthorName = await fetchAuthorName(
        authorEmail,
        authorName,
      )

      return {
        commits,
        shortHash,
        message,
        date,
        body: bodyLines.join('\n').trim(),
        author: {
          authorName: resolvedAuthorName,
          authorEmail,
        },
      }
    }),
  )
}

export async function parseCommits(commit: string): Promise<IParseCommit[]> {
  const parsed = await transformCommits(commit)
  return parsed.map(commit => parseGitCommit(commit))
    .filter(isNotNull)
}

const ConventionalCommitRegex = /^(?<breaking>!)?(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking1>!)?: (?<message>.+?)(?: \((?<pr>#\d+)\))?$/i
// /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?: (?<message>.+?)(?: \((?<pr>#\d+)\))?$/

const IssueRE = /(#\d+)/

/**
 * Parse a conventional commit message
 * @param commit
 */
export function parseGitCommit(commit: IRawGitCommit): IParseCommit | null {
  const match = commit.message.match(ConventionalCommitRegex)
  if (!match) {
    return null
  }

  const [, breaking = '', type = '', scope = '', breaking1 = '', message = '', pr = ''] = match
  const issue = commit.message.match(IssueRE)

  return {
    raw: commit,
    type,
    scope: scope.trim(),
    message: message.trim(),
    pr,
    issue: issue ? pr !== issue[0] ? issue[0] : '' : '',
    breaking: breaking || breaking1,
  }
}

interface Category {
  title: string
  scopes: Record<string, IParseCommit[]>
}

export function groupByCommits(commits: IParseCommit[], options: ResolvedChangelogOptions): CategoryGitCommit {
  const configTypes: ConfigTypes = options.types
  const BREAKING_KEY = 'breaking'

  const categories: Record<string, Category> = {
    [BREAKING_KEY]: { title: '💥 Breaking Changes', scopes: {} },
    ...Object.fromEntries(
      Object.entries(configTypes).map(([type, config]) => [
        type,
        { title: config.title, scopes: {} },
      ]),
    ),
  }

  for (const parsed of commits) {
    const { type, scope, breaking } = parsed

    const categoryKey = breaking ? BREAKING_KEY : configTypes[type] ? type : null
    if (!categoryKey)
      continue

    const scopeKey = scope || 'other'
    const category = categories[categoryKey]!

    if (!category.scopes[scopeKey]) {
      category.scopes[scopeKey] = []
    }

    category.scopes[scopeKey].push(parsed)
  }

  return Object.fromEntries(
    Object.entries(categories).filter(([_, value]) => Object.keys(value.scopes).length > 0),
  ) as CategoryGitCommit
}
