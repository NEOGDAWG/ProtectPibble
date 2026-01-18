function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.prototype.toString.call(value) === '[object Object]'
  )
}

export function toSnakeCaseKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase()
}

export function toCamelCaseKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

export function decamelizeKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(decamelizeKeys) as T
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[toSnakeCaseKey(k)] = decamelizeKeys(v)
    }
    return out as T
  }
  return value
}

export function camelizeKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(camelizeKeys) as T
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[toCamelCaseKey(k)] = camelizeKeys(v)
    }
    return out as T
  }
  return value
}

