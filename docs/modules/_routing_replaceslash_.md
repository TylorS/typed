**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "routing/ReplaceSlash"

# Module: "routing/ReplaceSlash"

## Index

### Type aliases

* [RemoveSlash](_routing_replaceslash_.md#removeslash)
* [ReplacePostfix](_routing_replaceslash_.md#replacepostfix)
* [ReplacePrefix](_routing_replaceslash_.md#replaceprefix)

## Type aliases

### RemoveSlash

Ƭ  **RemoveSlash**\<A>: [ReplacePrefix](_routing_replaceslash_.md#replaceprefix)\<[ReplacePostfix](_routing_replaceslash_.md#replacepostfix)\<A>>

*Defined in [src/routing/ReplaceSlash.ts:4](https://github.com/TylorS/typed-fp/blob/8639976/src/routing/ReplaceSlash.ts#L4)*

Remove all of the "/"s in a string

#### Type parameters:

Name | Type |
------ | ------ |
`A` | string |

___

### ReplacePostfix

Ƭ  **ReplacePostfix**\<A>: A *extends* \`${R}/\` ? ReplacePostfix\<R> : A

*Defined in [src/routing/ReplaceSlash.ts:8](https://github.com/TylorS/typed-fp/blob/8639976/src/routing/ReplaceSlash.ts#L8)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | string |

___

### ReplacePrefix

Ƭ  **ReplacePrefix**\<A>: A *extends* \`/${R}\` ? ReplacePrefix\<R> : A

*Defined in [src/routing/ReplaceSlash.ts:6](https://github.com/TylorS/typed-fp/blob/8639976/src/routing/ReplaceSlash.ts#L6)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | string |
