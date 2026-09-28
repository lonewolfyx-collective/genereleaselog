/**
 * Filter git commits type
 * @param obj
 * @param keysToRemove
 */
export function filterGitCommitsType<T extends object, K extends keyof T>(
  obj: T,
  keysToRemove: readonly (keyof T | string)[],
): Omit<T, K> {
  const entries = Object.entries(obj).filter(
    ([key]) => !keysToRemove.includes(key as K),
  )
  return Object.fromEntries(entries) as Omit<T, K>
}

export function pick<T, K extends keyof T>(data: T, keys: K | K[]): Pick<T, K> {
  if (Array.isArray(keys)) {
    return keys.reduce((acc, key) => {
      acc[key] = data[key]
      return acc
    }, {} as Pick<T, K>)
  }
  else {
    return { [keys]: data[keys] } as Pick<T, K>
  }
}

type DeepMerge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? K extends keyof T
      ? T[K] extends object
        ? U[K] extends object
          ? DeepMerge<T[K], U[K]>
          : U[K]
        : U[K]
      : U[K]
    : K extends keyof T
      ? T[K]
      : never;
}

/**
 * Merge config
 * @param baseConfig
 * @param overrideConfig
 */
export function mergeConfig<T extends object, U extends object>(
  baseConfig: T,
  overrideConfig: U,
): DeepMerge<T, U> {
  const result = { ...baseConfig } as any

  for (const key in overrideConfig) {
    const baseValue = (baseConfig as any)[key]
    const overrideValue = (overrideConfig as any)[key]

    if (
      isPlainObject(baseValue)
      && isPlainObject(overrideValue)
    ) {
      result[key] = mergeConfig(baseValue, overrideValue)
    }
    else {
      result[key] = overrideValue
    }
  }

  return result
}

function isPlainObject(value: any): value is Record<string, any> {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

export function normalizeArray(value: string | string[]): string[] {
  if (typeof value === 'string')
    return value.split(',').map(s => s.trim())
  if (Array.isArray(value))
    return value.map(s => s.trim())

  return []
}

export function isNotNull<T>(value: T | null): value is T {
  return value !== null
}
