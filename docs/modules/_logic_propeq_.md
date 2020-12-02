**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/propEq"

# Module: "logic/propEq"

## Index

### Variables

* [propEq](_logic_propeq_.md#propeq)

## Variables

### propEq

• `Const` **propEq**: \<K, A, O>(key: K, value: A, object: O) => boolean\<K, A>(key: K, value: A) => \<O>(object: O) => boolean\<K>(key: K) => \<A, O>(value: A, object: O) => boolean\<A>(value: A) => \<O>(object: O) => boolean = (curry(\<O, K extends keyof O>(key: K, value: O[K], obj: O): boolean => equals(obj[key], value),) as any) as { \<K extends PropertyKey, A, O extends Readonly\<Record\<K, A>>>(key: K, value: A, object: O): boolean \<K extends PropertyKey, A>(key: K, value: A): \<O extends Readonly\<Record\<K, A>>>( object: O, ) => boolean \<K extends PropertyKey>(key: K): { \<A, O extends Readonly\<Record\<K, A>>>(value: A, object: O): boolean \<A>(value: A): \<O extends Readonly\<Record\<K, A>>>(object: O) => boolean }}

*Defined in [src/logic/propEq.ts:12](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/propEq.ts#L12)*

Returns true if a property is equal to a given value

**`param`** PropertyKey

**`param`** a

**`param`** 

**`returns`** boolean
