**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["http/HttpRequest"](../modules/_http_httprequest_.md) / HttpRequest

# Interface: HttpRequest

An Effect representing an Http Request that can fail with an Error

## Hierarchy

* [Effect](../modules/_effect_effect_.effect.md)\<[HttpEnv](_http_httpenv_.httpenv.md), Error, [HttpResponse](_http_httpresponse_.httpresponse.md)>

  ↳ **HttpRequest**

## Index

### Properties

* [[Symbol.iterator]](_http_httprequest_.httprequest.md#[symbol.iterator])

### Methods

* [fromIO](_http_httprequest_.httprequest.md#fromio)
* [of](_http_httprequest_.httprequest.md#of)

## Properties

### [Symbol.iterator]

• `Readonly` **[Symbol.iterator]**: () => [EffectGenerator](../modules/_effect_effect_.md#effectgenerator)\<[HttpEnv](_http_httpenv_.httpenv.md), Error>

*Inherited from [Effect](../modules/_effect_effect_.effect.md).[[Symbol.iterator]](../modules/_effect_effect_.effect.md#[symbol.iterator])*

*Defined in [src/Effect/Effect.ts:11](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Effect/Effect.ts#L11)*

## Methods

### fromIO

▸ **fromIO**\<A>(`io`: IO\<A>): [Pure](../modules/_effect_effect_.md#pure)\<A>

*Defined in [src/Effect/Effect.ts:23](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Effect/Effect.ts#L23)*

Create an Effect from an IO

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`io` | IO\<A> |

**Returns:** [Pure](../modules/_effect_effect_.md#pure)\<A>

___

### of

▸ **of**\<A>(`value`: A): [Pure](../modules/_effect_effect_.md#pure)\<A>

*Defined in [src/Effect/Effect.ts:18](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Effect/Effect.ts#L18)*

Create an Effect containing a given value

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |

**Returns:** [Pure](../modules/_effect_effect_.md#pure)\<A>
