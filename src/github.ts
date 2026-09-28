import type { IReleaseAsset, IReleaseResult, ResolvedChangelogOptions } from '@/src/types.ts'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { cyan, green } from 'ansis'
import { glob } from 'glob'
import { $fetch } from 'ofetch'

export async function createRelease(options: ResolvedChangelogOptions, markdown: string, draft = options.draft): Promise<IReleaseResult> {
  const headers = getGithubHeader(options)

  const url = `https://${options.baseUrlApi}/repos/${options.owner}/${options.repo}/releases`

  const result = await $fetch<IReleaseResult>(url, {
    method: 'post',
    headers,
    body: JSON.stringify({
      owner: options.owner,
      repo: options.repo,
      tag_name: options.version,
      name: options.version,
      body: markdown,
      draft,
      prerelease: false,
    }),
  })

  if (draft)
    console.log(green(`Draft release created at ${result.html_url}`))
  else
    console.log(green(`Released on ${result.html_url}`))

  return result
}

export async function createDraftRelease(options: ResolvedChangelogOptions, markdown: string): Promise<IReleaseResult> {
  return createRelease(options, markdown, true)
}

export function getGithubHeader(options: ResolvedChangelogOptions) {
  return {
    accept: 'application/vnd.github.v3+json',
    authorization: `token ${options.token}`,
  }
}

export async function updateReleaseAssets(options: ResolvedChangelogOptions, release: IReleaseResult): Promise<string[]> {
  const headers = getGithubHeader(options)

  let assetList: string[] = []
  if (typeof options.assets === 'string') {
    assetList = options.assets.split(',').map(s => resolve(options.cwd, s.trim())).filter(Boolean)
  }
  else if (Array.isArray(options.assets)) {
    assetList = options.assets.flatMap(item =>
      item.split(',').map(s => resolve(options.cwd, s.trim())),
    ).filter(Boolean)
  }

  const expandedAssets: string[] = []
  for (const pattern of assetList) {
    const matches = await glob(pattern)
    if (matches.length) {
      expandedAssets.push(...matches)
    }
    else {
      expandedAssets.push(pattern)
    }
  }

  const uploadedAssets: string[] = []
  for (const asset of expandedAssets) {
    const filePath = resolve(asset)
    const fileData = await readFile(filePath)
    const fileName = basename(filePath)

    const uploadUrl = release.upload_url.replace('{?name,label}', `?name=${encodeURIComponent(fileName)}`)
    console.log(cyan(`Uploading ${fileName}...`))
    await $fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/octet-stream',
      },
      body: fileData,
    })
    uploadedAssets.push(fileName)
    console.log(green(`Uploaded ${fileName} successfully.`))
  }

  return uploadedAssets
}

export async function verifyReleaseAssets(options: ResolvedChangelogOptions, release: IReleaseResult, expectedAssets: string[]): Promise<void> {
  const assetsUrl = new URL(release.assets_url)
  assetsUrl.searchParams.set('per_page', '100')

  const assets = await $fetch<IReleaseAsset[]>(assetsUrl.toString(), {
    headers: getGithubHeader(options),
  })
  const uploadedAssetNames = new Set(assets.map(asset => asset.name))
  const missingAssets = expectedAssets.filter(asset => !uploadedAssetNames.has(asset))

  if (missingAssets.length > 0)
    throw new Error(`Release assets failed verification: ${missingAssets.join(', ')}`)

  console.log(green(`Verified ${expectedAssets.length} release asset${expectedAssets.length === 1 ? '' : 's'}.`))
}

export async function publishRelease(options: ResolvedChangelogOptions, release: IReleaseResult): Promise<IReleaseResult> {
  const result = await $fetch<IReleaseResult>(release.url, {
    method: 'patch',
    headers: getGithubHeader(options),
    body: JSON.stringify({ draft: false }),
  })

  console.log(green(`Released on ${result.html_url}`))

  return result
}
