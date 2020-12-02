**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Effect/Effect"](_effect_effect_.md) / Effect

# Namespace: Effect\<E, A>

An Iterable used to simulate algebraic effects using generator functions.

## Type parameters

Name |
------ |
`E` |
`A` |

## Hierarchy

* **Effect**

  ↳ [HttpRequest](../interfaces/_http_httprequest_.httprequest.md)

## Index

### Properties

* [[Symbol.iterator]](_effect_effect_.effect.md#[symbol.iterator])

### Functions

* [fromIO](_effect_effect_.effect.md#fromio)
* [of](_effect_effect_.effect.md#of)

## Properties

### [Symbol.iterator]

• `Readonly` **[Symbol.iterator]**: () => [EffectGenerator](_effect_effect_.md#effectgenerator)\<E, A>

*Defined in [src/Effect/Effect.ts:11](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/Effect.ts#L11)*

## Functions

### fromIO

▸ `Const`**fromIO**\<A>(`io`: IO\<A>): [Pure](_effect_effect_.md#pure)\<A>

*Defined in [src/Effect/Effect.ts:23](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/Effect.ts#L23)*

Create an Effect from an IO

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`io` | IO\<A> |

**Returns:** [Pure](_effect_effect_.md#pure)\<A>

___

### of

▸ `Const`**of**\<A>(`value`: A): [Pure](_effect_effect_.md#pure)\<A>

*Defined in [src/Effect/Effect.ts:18](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/Effect.ts#L18)*

Create an Effect containing a given value

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |

**Returns:** [Pure](_effect_effect_.md#pure)\<A>
