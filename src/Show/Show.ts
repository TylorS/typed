import { Show } from 'fp-ts/Show'

export const JsonStringify: Show<unknown> = {
  show: (x) => JSON.stringify(x),
}
