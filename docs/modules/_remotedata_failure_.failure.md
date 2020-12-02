**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["RemoteData/Failure"](_remotedata_failure_.md) / Failure

# Namespace: Failure\<A>

The Failure case of a RemoteData

## Type parameters

Name |
------ |
`A` |

## Index

### Properties

* [status](_remotedata_failure_.failure.md#status)
* [value](_remotedata_failure_.failure.md#value)

### Functions

* [of](_remotedata_failure_.failure.md#of)

## Properties

### status

• `Readonly` **status**: [Failure](../enums/_remotedata_enums_.remotedatastatus.md#failure)

*Defined in [src/RemoteData/Failure.ts:7](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/Failure.ts#L7)*

___

### value

• `Readonly` **value**: A

*Defined in [src/RemoteData/Failure.ts:8](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/Failure.ts#L8)*

## Functions

### of

▸ `Const`**of**\<A>(`value`: A): [Failure](_remotedata_failure_.failure.md)\<A>

*Defined in [src/RemoteData/Failure.ts:15](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/Failure.ts#L15)*

Create a Failure containing a specific value.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |

**Returns:** [Failure](_remotedata_failure_.failure.md)\<A>
