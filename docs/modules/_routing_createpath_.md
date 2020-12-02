**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "routing/createPath"

# Module: "routing/createPath"

## Index

### Type aliases

* [CreatePathOptions](_routing_createpath_.md#createpathoptions)

### Functions

* [createPath](_routing_createpath_.md#createpath)

## Type aliases

### CreatePathOptions

Ƭ  **CreatePathOptions**: ParseOptions & TokensToFunctionOptions

*Defined in [src/routing/createPath.ts:6](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/routing/createPath.ts#L6)*

## Functions

### createPath

▸ **createPath**\<A>(`route`: A, `options?`: [CreatePathOptions](_routing_createpath_.md#createpathoptions)): (Anonymous function)

*Defined in [src/routing/createPath.ts:11](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/routing/createPath.ts#L11)*

Create a function to generate a Path from a given set of Route values.

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Route](../interfaces/_routing_route_.route.md)\<[RouteParts](_routing_route_.md#routeparts)> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`route` | A | - |
`options` | [CreatePathOptions](_routing_createpath_.md#createpathoptions) | {} |

**Returns:** (Anonymous function)
