import { execCommand } from '@/src/exec.ts'

/**
 * Get github repo
 * @param baseUrl
 * @param cwd
 */
export async function getGithubRepo(baseUrl: string, cwd: string): Promise<{ owner: string, repo: string }> {
  // git config --get remote.origin.url | sed -E 's#(git@|https://)github.com[:/]([^/]+)/([^/]+)\.git#{"owner":"\2","repo":"\3"}#'
  const url = await execCommand('git', ['config', '--get', 'remote.origin.url'], cwd)
  const escapedBaseUrl = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`${escapedBaseUrl}[\/:]([\\w\\d._-]+?)\\/([\\w\\d._-]+?)(\\.git)?$`, 'i')
  const match = regex.exec(url)
  if (!match)
    throw new Error(`Can not parse GitHub repo from url ${url}`)

  return {
    owner: match[1] as string,
    repo: match[2] as string,
  }
}

/**
 * Get the last commit hash
 * @param cwd
 */
export async function getLastTagCommit(cwd: string): Promise<string> {
  // git rev-list -1 HEAD
  return await execCommand('git', ['rev-list', '-1', 'HEAD'], cwd)
}

/**
 * Get the prev tags commit
 * @param cwd
 */
export async function getMatchingTagsCommit(cwd: string): Promise<string> {
  // git tag --sort=-creatordate | sed -n 2p
  const tag = await execCommand('git', ['tag', '--sort=-creatordate', '|', 'sed', '-n', '2p'], cwd)
  return await getCommitByTag(tag, cwd) || await getFirstGitCommit(cwd)
}

/**
 * Get the latest tag
 * @param cwd
 */
export async function getLatestTag(cwd: string): Promise<string> {
  // git describe --tags --abbrev=0
  return await execCommand('git', ['describe', '--tags', '--abbrev=0'], cwd)
}

/**
 * Get all git tags
 * @param cwd
 */
export async function getAllTags(cwd: string) {
  // git tag --sort=-creatordate
  return await execCommand('git', ['tag', '--sort=-creatordate'], cwd)
}

/**
 * Get first git commit
 * @param cwd
 */
export async function getFirstGitCommit(cwd: string): Promise<string> {
  // git rev-list --max-parents=0 HEAD
  return await execCommand('git', ['rev-list', '--max-parents=0', 'HEAD'], cwd)
}

/**
 * Get commit by tag
 * @param tag
 * @param cwd
 */
export async function getCommitByTag(tag: string, cwd: string): Promise<string> {
  // git rev-list -n 1 v0.0.4
  return await execCommand('git', ['rev-list', '-n', '1', `${tag}`], cwd)
}

/**
 * Get commit logs
 * @param from
 * @param to
 * @param cwd
 */
export async function getCommitLogs(from: string, to: string, cwd: string): Promise<string> {
  // git --no-pager log <from>>..<to> --pretty=format:"---%H|%h|%s|%an|%ae|%ad" --date=format:"%Y-%m-%d %H:%M:%S"
  return await execCommand('git', [
    '--no-pager',
    'log',
    `${from}..${to}`,
    '--pretty=format:"---%n%H|%h|%s|%an|%ae|%ad"',
    '--date=format:"%Y-%m-%d %H:%M:%S"',
    '--name-status',
  ], cwd)
}
