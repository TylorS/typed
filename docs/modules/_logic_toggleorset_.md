**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/toggleOrSet"

# Module: "logic/toggleOrSet"

## Index

### Variables

* [toggleOrSet](_logic_toggleorset_.md#toggleorset)

## Variables

### toggleOrSet

• `Const` **toggleOrSet**: (bool: boolean \| undefined, toggleableBoolean: boolean) => boolean(bool: boolean \| undefined) => (toggleableBoolean: boolean) => boolean = curry((bool: boolean \| undefined, toggleableBoolean: boolean): boolean => bool === void 0 ? !toggleableBoolean : bool,) as { (bool: boolean \| undefined, toggleableBoolean: boolean): boolean (bool: boolean \| undefined): (toggleableBoolean: boolean) => boolean}

*Defined in [src/logic/toggleOrSet.ts:9](https://github.com/TylorS/typed-fp/blob/6ccb290/src/logic/toggleOrSet.ts#L9)*

Toggle a boolean off/on if given boolean is undefined or sets the value if boolean is not undefined.

**`param`** boolean | undefined

**`param`** boolean

**`returns`** boolean
