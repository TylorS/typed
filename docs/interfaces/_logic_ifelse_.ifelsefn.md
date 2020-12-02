**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["logic/ifElse"](../modules/_logic_ifelse_.md) / IfElseFn

# Interface: IfElseFn

## Hierarchy

* **IfElseFn**

## Callable

▸ \<A, B, C>(`predicate`: [Is](../modules/_logic_types_.md#is)\<B>, `thenFn`: [Arity1](../modules/_common_types_.md#arity1)\<B, C>, `elseFn`: [Arity1](../modules/_common_types_.md#arity1)\<A, C>, `value`: A): C

*Defined in [src/logic/ifElse.ts:29](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/ifElse.ts#L29)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | - |
`B` | A |
`C` | - |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | [Is](../modules/_logic_types_.md#is)\<B> |
`thenFn` | [Arity1](../modules/_common_types_.md#arity1)\<B, C> |
`elseFn` | [Arity1](../modules/_common_types_.md#arity1)\<A, C> |
`value` | A |

**Returns:** C

▸ \<A, B>(`predicate`: Predicate\<A>, `thenFn`: [Arity1](../modules/_common_types_.md#arity1)\<A, B>, `elseFn`: [Arity1](../modules/_common_types_.md#arity1)\<A, B>, `value`: A): B

*Defined in [src/logic/ifElse.ts:30](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/ifElse.ts#L30)*

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | Predicate\<A> |
`thenFn` | [Arity1](../modules/_common_types_.md#arity1)\<A, B> |
`elseFn` | [Arity1](../modules/_common_types_.md#arity1)\<A, B> |
`value` | A |

**Returns:** B

▸ \<A, B, C>(`predicate`: [Is](../modules/_logic_types_.md#is)\<B>, `thenFn`: [Arity1](../modules/_common_types_.md#arity1)\<B, C>, `elseFn`: [Arity1](../modules/_common_types_.md#arity1)\<A, C>): function

*Defined in [src/logic/ifElse.ts:31](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/ifElse.ts#L31)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | - |
`B` | A |
`C` | - |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | [Is](../modules/_logic_types_.md#is)\<B> |
`thenFn` | [Arity1](../modules/_common_types_.md#arity1)\<B, C> |
`elseFn` | [Arity1](../modules/_common_types_.md#arity1)\<A, C> |

**Returns:** function

▸ \<A, B>(`predicate`: Predicate\<A>, `thenFn`: [Arity1](../modules/_common_types_.md#arity1)\<A, B>, `elseFn`: [Arity1](../modules/_common_types_.md#arity1)\<A, B>): function

*Defined in [src/logic/ifElse.ts:33](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/ifElse.ts#L33)*

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | Predicate\<A> |
`thenFn` | [Arity1](../modules/_common_types_.md#arity1)\<A, B> |
`elseFn` | [Arity1](../modules/_common_types_.md#arity1)\<A, B> |

**Returns:** function

▸ \<A, B, C>(`predicate`: [Is](../modules/_logic_types_.md#is)\<B>, `thenFn`: [Arity1](../modules/_common_types_.md#arity1)\<B, C>): function

*Defined in [src/logic/ifElse.ts:34](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/ifElse.ts#L34)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | - |
`B` | A |
`C` | - |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | [Is](../modules/_logic_types_.md#is)\<B> |
`thenFn` | [Arity1](../modules/_common_types_.md#arity1)\<B, C> |

**Returns:** function

▸ \<A, B>(`predicate`: Predicate\<A>, `thenFn`: [Arity1](../modules/_common_types_.md#arity1)\<A, B>): function

*Defined in [src/logic/ifElse.ts:39](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/ifElse.ts#L39)*

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | Predicate\<A> |
`thenFn` | [Arity1](../modules/_common_types_.md#arity1)\<A, B> |

**Returns:** function

▸ \<A, B>(`predicate`: [Is](../modules/_logic_types_.md#is)\<B>): function

*Defined in [src/logic/ifElse.ts:43](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/ifElse.ts#L43)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | - |
`B` | A |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | [Is](../modules/_logic_types_.md#is)\<B> |

**Returns:** function

▸ \<A>(`predicate`: Predicate\<A>): function

*Defined in [src/logic/ifElse.ts:52](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/ifElse.ts#L52)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | Predicate\<A> |

**Returns:** function
