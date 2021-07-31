/**
 * @typed/fp/struct is an extension of fp-ts/struct with an additional constructor.
 * @since 0.9.2
 * @category Constructor
 */
export function make<K extends PropertyKey, V>(key: K, value: V): { readonly [_ in K]: V } {
  return {
    [key]: value,
  } as { readonly [_ in K]: V }
}

export * from 'fp-ts/struct'
