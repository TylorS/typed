export function createOverrides<T extends Readonly<Record<string, any>>>(
  target: T,
  overrides: {
    readonly [K in keyof T]?: (original: T[K]) => T[K]
  },
): T {
  for (const key in overrides) {
    const override = overrides[key]

    if (override) {
      target[key] = override(bindIfFunction(target, key))
    }
  }

  return target
}

function bindIfFunction<T, K extends keyof T>(target: T, key: K): T[K] {
  const original = target[key]

  if (typeof original === 'function') {
    return (target[key] = original.bind(target))
  }

  return original
}
