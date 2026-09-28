import type { ConfigTypes, IChangelogOptions, IUserConfig, ResolvedChangelogOptions } from '@/src/types.ts'
import { resolve } from 'node:path'
import { findUp } from 'find-up'
import { createJiti } from 'jiti'
import { DEFAULT_CONFIG_FILES } from '@/src/constants.ts'
import { getGithubRepo, getLastTagCommit, getLatestTag, getMatchingTagsCommit } from '@/src/git.ts'
import { filterGitCommitsType, mergeConfig, normalizeArray, pick } from '@/src/utils.ts'

const defaultConfig = {
    types: {
        feat: {
            title: '🎉 Features',
        },
        perf: {
            title: '🔥 Performance',
        },
        fix: {
            title: '🐞 Bug Fixes',
        },
        refactor: {
            title: '💅 Refactors',
        },
        docs: {
            title: '📚 Documentation',
        },
        build: {
            title: '📦 Build',
        },
        types: {
            title: '🌊 Types',
        },
        chore: {
            title: '🏡 Chore',
        },
        examples: {
            title: '🏀 Examples',
        },
        test: {
            title: '✅ Tests',
        },
        style: {
            title: '🎨 Styles',
        },
        ci: {
            title: '🤖 CI',
        },
    },
    from: '',
    to: '',
    cwd: '',
    version: '',
    draft: false,
} satisfies IChangelogOptions

export function defineConfig(config: IUserConfig): IUserConfig {
    return config
}

/**
 * Resolve config
 * @param options
 */
export async function resolveConfig(options: IChangelogOptions) {
    const { loadConfig } = await import('c12')
    const config = await loadConfig<IChangelogOptions>({
        name: 'genereleaselog',
        defaults: defaultConfig,
        overrides: options,
    }).then((r) => {
        return {
            ...r.config || defaultConfig,
            cwd: r.cwd || process.cwd(),
        }
    })

    config.baseUrl = config.baseUrl ?? 'github.com'
    config.baseUrlApi = config.baseUrlApi ?? 'api.github.com'
    config.token = config.token || process.env.GITHUB_TOKEN
    config.version = config.version || await getLatestTag(config.cwd)
    config.from = config.from || await getMatchingTagsCommit(config.cwd)
    config.to = config.to || await getLastTagCommit(config.cwd)

    const remote = await getGithubRepo(config.baseUrl, config.cwd)
    config.owner = remote.owner
    config.repo = remote.repo

    const loaderResult = await loadConfigFromFile(config.cwd)

    if (loaderResult) {
        let types = config.types

        if (loaderResult.overrideTypes && loaderResult.types) {
            types = mergeConfig(types, loaderResult.types)
        }
        else {
            types = loaderResult.types ?? types
        }

        config.types = Object.fromEntries(
            Object.entries(applyIncludeExclude(types, loaderResult)).filter(([_, value]) => value !== undefined),
        )

        config.assets = loaderResult.assets
        config.description = loaderResult.description
    }
    else {
        config.types = options.filter && options.filter !== '' ? filterGitCommitsType(config.types, options.filter.split(',')) : config.types
    }

    return config as ResolvedChangelogOptions
}

export function applyIncludeExclude(types: ConfigTypes, userConfig: IUserConfig): ConfigTypes {
    if (userConfig.include && userConfig.exclude) {
        return filterGitCommitsType(
            pick(types, normalizeArray(userConfig.include)),
            normalizeArray(userConfig.exclude),
        )
    }

    if (userConfig.exclude)
        return filterGitCommitsType(types, normalizeArray(userConfig.exclude))

    if (userConfig.include)
        return pick(types, normalizeArray(userConfig.include))

    return types
}

export async function loadConfigFromFile(cwd: string): Promise<IUserConfig | null> {
    const resolvedPath = await findUp(
        DEFAULT_CONFIG_FILES.map((filePath: string) => resolve(cwd, filePath)),
    ) as string | undefined

    if (!resolvedPath) {
        return null
    }

    const loader = createJiti(cwd, {
        extensions: ['.js', '.ts', '.mjs', '.cjs', '.mts', '.cts'],
    })

    return await loader.import(resolvedPath, { default: true })
}
