**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useDiffList"

# Module: "Shared/hooks/useDiffList"

## Index

### Type aliases

* [ListDiff](_shared_hooks_usedifflist_.md#listdiff)

### Variables

* [pureTrue](_shared_hooks_usedifflist_.md#puretrue)

### Functions

* [useDiffList](_shared_hooks_usedifflist_.md#usedifflist)

## Type aliases

### ListDiff

Ƭ  **ListDiff**\<A>: { added: ReadonlyArray\<A> ; removed: ReadonlyArray\<A> ; unchanged: ReadonlyArray\<A>  }

*Defined in [src/Shared/hooks/useDiffList.ts:11](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/hooks/useDiffList.ts#L11)*

#### Type parameters:

Name |
------ |
`A` |

#### Type declaration:

Name | Type |
------ | ------ |
`added` | ReadonlyArray\<A> |
`removed` | ReadonlyArray\<A> |
`unchanged` | ReadonlyArray\<A> |

## Variables

### pureTrue

• `Const` **pureTrue**: [Pure](_effect_effect_.md#pure)\<boolean> = Pure.of(true)

*Defined in [src/Shared/hooks/useDiffList.ts:9](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/hooks/useDiffList.ts#L9)*

## Functions

### useDiffList

▸ `Const`**useDiffList**\<A>(`list`: ReadonlyArray\<A>, `eq`: Eq\<A>): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [ListDiff](_shared_hooks_usedifflist_.md#listdiff)\<A>>

*Defined in [src/Shared/hooks/useDiffList.ts:20](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/hooks/useDiffList.ts#L20)*

Diff a list into added and removed values

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`list` | ReadonlyArray\<A> |
`eq` | Eq\<A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [ListDiff](_shared_hooks_usedifflist_.md#listdiff)\<A>>
