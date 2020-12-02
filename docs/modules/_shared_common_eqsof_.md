**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/common/EqsOf"

# Module: "Shared/common/EqsOf"

## Index

### Type aliases

* [EqFrom](_shared_common_eqsof_.md#eqfrom)
* [EqsOf](_shared_common_eqsof_.md#eqsof)

### Functions

* [defaultEqs](_shared_common_eqsof_.md#defaulteqs)
* [tupleEqOf](_shared_common_eqsof_.md#tupleeqof)

## Type aliases

### EqFrom

Ƭ  **EqFrom**\<A>: [A] *extends* [EqsOf\<*infer* R>] ? Eq\<R> : never

*Defined in [src/Shared/common/EqsOf.ts:7](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/common/EqsOf.ts#L7)*

#### Type parameters:

Name |
------ |
`A` |

___

### EqsOf

Ƭ  **EqsOf**\<A>: {}

*Defined in [src/Shared/common/EqsOf.ts:3](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/common/EqsOf.ts#L3)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | ReadonlyArray\<any> |

## Functions

### defaultEqs

▸ `Const`**defaultEqs**\<A>(`deps`: A): [EqsOf](_shared_common_eqsof_.md#eqsof)\<A>

*Defined in [src/Shared/common/EqsOf.ts:9](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/common/EqsOf.ts#L9)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | ReadonlyArray\<any> |

#### Parameters:

Name | Type |
------ | ------ |
`deps` | A |

**Returns:** [EqsOf](_shared_common_eqsof_.md#eqsof)\<A>

___

### tupleEqOf

▸ `Const`**tupleEqOf**\<A>(`eqsOf`: A): [EqFrom](_shared_common_eqsof_.md#eqfrom)\<A>

*Defined in [src/Shared/common/EqsOf.ts:12](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/common/EqsOf.ts#L12)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [EqsOf](_shared_common_eqsof_.md#eqsof)\<ReadonlyArray\<any>> |

#### Parameters:

Name | Type |
------ | ------ |
`eqsOf` | A |

**Returns:** [EqFrom](_shared_common_eqsof_.md#eqfrom)\<A>
