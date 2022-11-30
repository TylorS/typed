import { Tag } from '@fp-ts/data/Context'

export interface IdGenerator {
  readonly tag: 'IdGenerator'
  (): number
}

export const IdGenerator = Tag<IdGenerator>()

export const makeIdGenerator = (): IdGenerator => {
  let id = 0

  function next() {
    return id++
  }
  next.tag = 'IdGenerator' as const

  return next
}
