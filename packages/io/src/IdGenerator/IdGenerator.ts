import { Tag } from '@fp-ts/data/Context'

export interface IdGenerator {
  readonly _tag: 'IdGenerator'
  (): number
}

export const IdGenerator = Object.assign(function makeIdGenerator(): IdGenerator {
  let id = 0

  function next() {
    return id++
  }
  next._tag = 'IdGenerator' as const

  return next
}, Tag<IdGenerator>())
