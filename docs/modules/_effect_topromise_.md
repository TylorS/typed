**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/toPromise"

# Module: "Effect/toPromise"

## Index

### Functions

* [toPromise](_effect_topromise_.md#topromise)
* [toTask](_effect_topromise_.md#totask)

## Functions

### toPromise

▸ `Const`**toPromise**\<A>(`pure`: [Pure](_effect_effect_.md#pure)\<A>): Promise\<A>

*Defined in [src/Effect/toPromise.ts:15](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Effect/toPromise.ts#L15)*

Converts a Pure<A> Effect into a Promise<A>

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`pure` | [Pure](_effect_effect_.md#pure)\<A> |

**Returns:** Promise\<A>

___

### toTask

▸ `Const`**toTask**\<A>(`pure`: [Pure](_effect_effect_.md#pure)\<A>): Task\<A>

*Defined in [src/Effect/toPromise.ts:10](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Effect/toPromise.ts#L10)*

Converts a Pure<A> Effect into a Task<A>

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`pure` | [Pure](_effect_effect_.md#pure)\<A> |

**Returns:** Task\<A>
