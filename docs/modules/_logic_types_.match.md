**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["logic/types"](_logic_types_.md) / Match

# Namespace: Match\<A, B>

A type for matching against a particular value.

## Type parameters

Name |
------ |
`A` |
`B` |

## Callable

▸ (`value`: A): B

*Defined in [src/common/types.ts:14](https://github.com/TylorS/typed-fp/blob/8639976/src/common/types.ts#L14)*

A type for matching against a particular value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |

**Returns:** B

## Index

### Variables

* [map](_logic_types_.match.md#map)

### Functions

* [fromPredicate](_logic_types_.match.md#frompredicate)

## Variables

### map

• `Const` **map**: \<A, B, C>(fn: (value: B) => C, match: [Match](_logic_types_.match.md)\<A, B>) => [Match](_logic_types_.match.md)\<A, C>\<B, C>(fn: (value: B) => C) => \<A>(match: [Match](_logic_types_.match.md)\<A, B>) => [Match](_logic_types_.match.md)\<A, C> = curry( \<A, B, C>(fn: (value: B) => C, match: Match\<A, B>): Match\<A, C> => (value: A) => pipe(value, match, mapO(fn)), ) as { \<A, B, C>(fn: (value: B) => C, match: Match\<A, B>): Match\<A, C> \<B, C>(fn: (value: B) => C): \<A>(match: Match\<A, B>) => Match\<A, C> }

*Defined in [src/logic/types.ts:25](https://github.com/TylorS/typed-fp/blob/8639976/src/logic/types.ts#L25)*

Map over a Match

## Functions

### fromPredicate

▸ **fromPredicate**\<A>(`predicate`: Predicate\<A>): [Match](_logic_types_.match.md)\<A, A>

*Defined in [src/logic/types.ts:36](https://github.com/TylorS/typed-fp/blob/8639976/src/logic/types.ts#L36)*

Create a match from a predicate.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | Predicate\<A> |

**Returns:** [Match](_logic_types_.match.md)\<A, A>

▸ **fromPredicate**\<A, B>(`predicate`: [Is](_logic_types_.md#is)\<B>): [Match](_logic_types_.match.md)\<A, B>

*Defined in [src/logic/types.ts:37](https://github.com/TylorS/typed-fp/blob/8639976/src/logic/types.ts#L37)*

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | [Is](_logic_types_.md#is)\<B> |

**Returns:** [Match](_logic_types_.match.md)\<A, B>
