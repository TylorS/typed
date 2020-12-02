**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Path/exports"](_path_exports_.md) / Path

# Namespace: Path

A NewType for Paths

## Index

### Variables

* [schema](_path_exports_.path.md#schema)
* [unwrap](_path_exports_.path.md#unwrap)
* [wrap](_path_exports_.path.md#wrap)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[Path](_path_exports_.path.md)> = createSchema\<Path>((t) => t.newtype\<Path>(t.string, pathPrism.getOption, 'Path'), )

*Defined in [src/Path/exports.ts:24](https://github.com/TylorS/typed-fp/blob/f129829/src/Path/exports.ts#L24)*

A Schema for Path

___

### unwrap

•  **unwrap**: (s: S) => A

*Defined in [src/Path/exports.ts:19](https://github.com/TylorS/typed-fp/blob/f129829/src/Path/exports.ts#L19)*

___

### wrap

•  **wrap**: (a: A) => S

*Defined in [src/Path/exports.ts:19](https://github.com/TylorS/typed-fp/blob/f129829/src/Path/exports.ts#L19)*
