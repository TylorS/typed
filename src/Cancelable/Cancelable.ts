import { constVoid } from 'fp-ts/function'

/**
 * Abortable is an interface for
 */
export interface Cancelable {
  readonly cancel: () => void | Promise<void>
}

export const Uncancelable: Cancelable = {
  cancel: constVoid,
}

export async function cancel(cancelable: Cancelable): Promise<void> {
  await cancelable.cancel()
}
