export type ConfigTypes = Record<string, { title: string }>

export interface IChangelogOptions {
    '--'?: any[]
    'types': ConfigTypes
    'from'?: string
    'to'?: string
    'cwd'?: string
    'owner'?: string
    'repo'?: string
    'baseUrl'?: string
    'baseUrlApi'?: string
    'version'?: string
    'token'?: string
    'output'?: string
    'filter'?: string
    'assets'?: string | string[]
    'description'?: string
    'draft'?: boolean
}

export type ResolvedChangelogOptions = Required<IChangelogOptions>

export interface IRawGitCommit {
    commits: string
    shortHash: string
    body: string
    message: string
    author: {
        authorName: string
        authorEmail: string
    }
    date: string
}

export interface IParseCommit {
    raw: IRawGitCommit
    type: string
    scope: string
    message: string
    pr: string
    issue: string
    breaking: string
}

export type CategoryGitCommit = Record<string, ICategoryRawCommit>

export interface ICategoryRawCommit {
    title: string
    scopes: GitScopeCommit
}

export type GitScopeCommit = Record<string, IParseCommit[]>

export type IGitCommit = Record<string, {
    title: string
    commits: IRawGitCommit[]
}>

interface IUserConfigBase {
    types?: ConfigTypes
    overrideTypes?: boolean
    assets?: string | string[]
    description?: string
    draft?: boolean
}

type ExclusiveConfig<T> = T extends { include: any }
    ? T extends { exclude: any }
        ? never // Never when both include and exclude exist
        : T
    : T extends { exclude: any }
        ? T
        : T

export type IUserConfig = ExclusiveConfig<
    IUserConfigBase & {
        include?: string | string[]
        exclude?: string | string[]
    }
>

export interface IReleaseResult {
    url: string
    html_url: string
    assets_url: string
    upload_url: string
    tarball_url: string
    zipball_url: string
    discussion_url: string
    id: string
    node_id: string
    tag_name: string
    target_commitish: string
    name: string
    body: string
}

export interface IReleaseAsset {
    id: number
    name: string
}
