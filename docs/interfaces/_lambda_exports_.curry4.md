**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["lambda/exports"](../modules/_lambda_exports_.md) / Curry4

# Interface: Curry4\<A, B, C, D, E>

## Type parameters

Name |
------ |
`A` |
`B` |
`C` |
`D` |
`E` |

## Hierarchy

* (a: A, b: B, c: C, d: D) => E

* (a: A, b: B, c: C) => D

* (a: A, b: B) => C

* (value: A) => B

  ↳ **Curry4**

## Callable

▸ (`a`: A, `b`: B, `c`: C, `d`: D): E

*Defined in [src/common/types.ts:29](https://github.com/TylorS/typed-fp/blob/559f273/src/common/types.ts#L29)*

#### Parameters:

Name | Type |
------ | ------ |
`a` | A |
`b` | B |
`c` | C |
`d` | D |

**Returns:** E

▸ (`a`: A, `b`: B, `c`: C): D

*Defined in [src/common/types.ts:24](https://github.com/TylorS/typed-fp/blob/559f273/src/common/types.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`a` | A |
`b` | B |
`c` | C |

**Returns:** D

▸ (`a`: A, `b`: B): C

*Defined in [src/common/types.ts:19](https://github.com/TylorS/typed-fp/blob/559f273/src/common/types.ts#L19)*

#### Parameters:

Name | Type |
------ | ------ |
`a` | A |
`b` | B |

**Returns:** C

▸ (`value`: A): B

*Defined in [src/common/types.ts:14](https://github.com/TylorS/typed-fp/blob/559f273/src/common/types.ts#L14)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |

**Returns:** B
