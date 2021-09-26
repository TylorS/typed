import { Cancelable, cancelAll } from '@/Cancelable'
import { Settable } from '@/Cancelable/settable'

export class Scope {
  public references: Map<any, any>
  #resources: Settable = new Settable()

  constructor(options: ScopeOptions = {}) {
    this.references = options.references ?? new Map()
  }

  readonly cloneReferences = (): Map<any, any> => new Map(this.references)

  readonly inheritRefs = (...toInherit: ReadonlyArray<Map<any, any>>): void => {
    this.references = new Map(combineMaps(this.references, ...toInherit))
  }

  readonly trackResources = (...cancelables: readonly Cancelable[]): Cancelable =>
    cancelAll(...cancelables.map((c) => this.#resources.add(c)))

  readonly close = (): void | Promise<void> => this.#resources.cancel()

  readonly isClosed = (): boolean => this.#resources.isCanceled()
}

export interface ScopeOptions {
  readonly references?: Map<any, any>
}

function* combineMaps(...maps: ReadonlyArray<Map<any, any>>): Iterable<[any, any]> {
  for (const map of maps) {
    yield* map
  }
}
