export interface Encoder<I, O> {
  readonly encode: (input: I) => O
}
