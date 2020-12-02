**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "routing/Route"

# Module: "routing/Route"

## Index

### Interfaces

* [Route](../interfaces/_routing_route_.route.md)

### Type aliases

* [GetRouteParts](_routing_route_.md#getrouteparts)
* [GetRoutePath](_routing_route_.md#getroutepath)
* [GetRouteValue](_routing_route_.md#getroutevalue)
* [NormalizePart](_routing_route_.md#normalizepart)
* [NormalizeParts](_routing_route_.md#normalizeparts)
* [PartToPath](_routing_route_.md#parttopath)
* [PartsToPath](_routing_route_.md#partstopath)
* [PartsToValues](_routing_route_.md#partstovalues)
* [RoutePart](_routing_route_.md#routepart)
* [RouteParts](_routing_route_.md#routeparts)

### Variables

* [pathSplitRegex](_routing_route_.md#pathsplitregex)

### Functions

* [createRoute](_routing_route_.md#createroute)

## Type aliases

### GetRouteParts

Ƭ  **GetRouteParts**\<A>: A[\"parts\"]

*Defined in [src/routing/Route.ts:52](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L52)*

Get a tuple of path parts from a Route

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Route](../interfaces/_routing_route_.route.md)\<[RouteParts](_routing_route_.md#routeparts)> |

___

### GetRoutePath

Ƭ  **GetRoutePath**\<A>: A[\"path\"]

*Defined in [src/routing/Route.ts:47](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L47)*

Get the generated path from a Route

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Route](../interfaces/_routing_route_.route.md)\<[RouteParts](_routing_route_.md#routeparts)> |

___

### GetRouteValue

Ƭ  **GetRouteValue**\<A>: [PartsToValues](_routing_route_.md#partstovalues)\<[GetRouteParts](_routing_route_.md#getrouteparts)\<A>>

*Defined in [src/routing/Route.ts:42](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L42)*

Extract an object from RouteParts

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Route](../interfaces/_routing_route_.route.md)\<[RouteParts](_routing_route_.md#routeparts)> |

___

### NormalizePart

Ƭ  **NormalizePart**\<A>: [A] *extends* [Route\<*infer* Parts>] ? Parts : [A] *extends* [RouteParam\<*infer* K>] ? [RouteParam\<K>] : [RemoveSlash\<Cast\<A, string>>]

*Defined in [src/routing/Route.ts:90](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L90)*

Remove slashes from a RoutePart

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [RoutePart](_routing_route_.md#routepart) |

___

### NormalizeParts

Ƭ  **NormalizeParts**\<P, Normalized>: P *extends* readonly [*infer* A] ? NormalizeParts\<Cast\<Rest, RouteParts>, [NormalizePart\<Cast\<A, RoutePart>>]> : P *extends* readonly [*infer* A] ? [NormalizePart\<Cast\<A, RoutePart>>] : Normalized

*Defined in [src/routing/Route.ts:78](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L78)*

Ensure double-slashes don't end up in paths

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [RouteParts](_routing_route_.md#routeparts) | - |
`Normalized` | [RouteParts](_routing_route_.md#routeparts) | [] |

___

### PartToPath

Ƭ  **PartToPath**\<A>: A *extends* Route\<*infer* Parts> ? PartsToPath\<Parts> : A *extends* RouteParam\<*infer* R> ? \`:${R}\` : Cast\<A, string>

*Defined in [src/routing/Route.ts:69](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L69)*

Convert a RoutePart into a Path

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [RoutePart](_routing_route_.md#routepart) |

___

### PartsToPath

Ƭ  **PartsToPath**\<P, R>: P *extends* readonly [*infer* A] ? PartsToPath\<Cast\<Rest, RouteParts>, \`${R}/${PartToPath\<Cast\<A, RoutePart>>}\`> : P *extends* readonly [*infer* A] ? \`${R}/${PartToPath\<Cast\<A, RoutePart>>}\` : R

*Defined in [src/routing/Route.ts:57](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L57)*

Convert a Tuple of Path parts back into a Path

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [RouteParts](_routing_route_.md#routeparts) | - |
`R` | string | "" |

___

### PartsToValues

Ƭ  **PartsToValues**\<A>: [And](_common_and_.md#and)\<{}>

*Defined in [src/routing/Route.ts:99](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L99)*

Converts RouteParts into a Record of values.

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [RouteParts](_routing_route_.md#routeparts) |

___

### RoutePart

Ƭ  **RoutePart**: string \| [RouteParam](_routing_routeparam_.md#routeparam)\<string> \| [Route](../interfaces/_routing_route_.route.md)\<[RouteParts](_routing_route_.md#routeparts)>

*Defined in [src/routing/Route.ts:20](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L20)*

Valid Route Parts

___

### RouteParts

Ƭ  **RouteParts**: ReadonlyArray\<[RoutePart](_routing_route_.md#routepart)>

*Defined in [src/routing/Route.ts:25](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L25)*

A Tuple of Route Parts

## Variables

### pathSplitRegex

• `Const` **pathSplitRegex**: RegExp = /\/+/g

*Defined in [src/routing/Route.ts:7](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L7)*

## Functions

### createRoute

▸ **createRoute**\<A>(`path`: A[\"path\"]): A

*Defined in [src/routing/Route.ts:30](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/routing/Route.ts#L30)*

A constructor for creating a type-safe path from a Route.

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Route](../interfaces/_routing_route_.route.md)\<[RouteParts](_routing_route_.md#routeparts)> |

#### Parameters:

Name | Type |
------ | ------ |
`path` | A[\"path\"] |

**Returns:** A
