**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "routing/matchRoute"

# Module: "routing/matchRoute"

## Index

### Type aliases

* [MatchRouteOptions](_routing_matchroute_.md#matchrouteoptions)

### Functions

* [matchRoute](_routing_matchroute_.md#matchroute)

## Type aliases

### MatchRouteOptions

Ƭ  **MatchRouteOptions**: ParseOptions & TokensToRegexpOptions & RegexpToFunctionOptions

*Defined in [src/routing/matchRoute.ts:7](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/routing/matchRoute.ts#L7)*

## Functions

### matchRoute

▸ `Const`**matchRoute**\<A>(`route`: A, `options?`: [MatchRouteOptions](_routing_matchroute_.md#matchrouteoptions)): [Match](_logic_types_.match.md)\<string, [GetRouteValue](_routing_route_.md#getroutevalue)\<A>>

*Defined in [src/routing/matchRoute.ts:15](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/routing/matchRoute.ts#L15)*

Create Match function for a Route. It does *not* do decoding
of your values into types, if that is required you'll do it separate to this.

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Route](../interfaces/_routing_route_.route.md)\<[RouteParts](_routing_route_.md#routeparts)> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`route` | A | - |
`options` | [MatchRouteOptions](_routing_matchroute_.md#matchrouteoptions) | {} |

**Returns:** [Match](_logic_types_.match.md)\<string, [GetRouteValue](_routing_route_.md#getroutevalue)\<A>>
