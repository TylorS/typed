export function make<K extends PropertyKey, V>(key: K, value: V): { readonly [_ in K]: V } {
  return {
    [key]: value,
  } as { readonly [_ in K]: V }
}

export * from 'fp-ts/struct'
