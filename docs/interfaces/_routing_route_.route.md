**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["routing/Route"](../modules/_routing_route_.md) / Route

# Interface: Route\<P>

A data-type to represent a Route as is usable by path-to-regexp

## Type parameters

Name | Type |
------ | ------ |
`P` | [RouteParts](../modules/_routing_route_.md#routeparts) |

## Hierarchy

* **Route**

## Index

### Properties

* [parts](_routing_route_.route.md#parts)
* [path](_routing_route_.route.md#path)

## Properties

### parts

• `Readonly` **parts**: [NormalizeParts](../modules/_routing_route_.md#normalizeparts)\<P>

*Defined in [src/routing/Route.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/routing/Route.ts#L14)*

___

### path

• `Readonly` **path**: [PartsToPath](../modules/_routing_route_.md#partstopath)\<[NormalizeParts](../modules/_routing_route_.md#normalizeparts)\<P>>

*Defined in [src/routing/Route.ts:13](https://github.com/TylorS/typed-fp/blob/41076ce/src/routing/Route.ts#L13)*
