**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Path/exports"

# Module: "Path/exports"

## Index

### Namespaces

* [Path](_path_exports_.path.md)

### Variables

* [DUPLICATE\_PATH\_SEPARATOR\_REGEX](_path_exports_.md#duplicate_path_separator_regex)
* [PATH\_SEPARATOR](_path_exports_.md#path_separator)
* [pathIso](_path_exports_.md#pathiso)
* [pathMonoid](_path_exports_.md#pathmonoid)
* [pathPrism](_path_exports_.md#pathprism)

### Functions

* [pathJoin](_path_exports_.md#pathjoin)

## Variables

### DUPLICATE\_PATH\_SEPARATOR\_REGEX

• `Const` **DUPLICATE\_PATH\_SEPARATOR\_REGEX**: RegExp = /\/{2,}/g

*Defined in [src/Path/exports.ts:42](https://github.com/TylorS/typed-fp/blob/559f273/src/Path/exports.ts#L42)*

___

### PATH\_SEPARATOR

• `Const` **PATH\_SEPARATOR**: \"/\" = \`/\`

*Defined in [src/Path/exports.ts:43](https://github.com/TylorS/typed-fp/blob/559f273/src/Path/exports.ts#L43)*

___

### pathIso

• `Const` **pathIso**: Iso\<[Path](_path_exports_.path.md), string> = iso\<Path>()

*Defined in [src/Path/exports.ts:13](https://github.com/TylorS/typed-fp/blob/559f273/src/Path/exports.ts#L13)*

An Iso instance ofr Path

___

### pathMonoid

• `Const` **pathMonoid**: Monoid\<[Path](_path_exports_.path.md)> = getMonoid\<Path>({ empty: '/', concat: (a: string, b: string) => Path.unwrap(pathJoin([a, b])),})

*Defined in [src/Path/exports.ts:37](https://github.com/TylorS/typed-fp/blob/559f273/src/Path/exports.ts#L37)*

A Monoid instance for Path.

___

### pathPrism

• `Const` **pathPrism**: Prism\<string, [Path](_path_exports_.path.md)> = prism\<Path>((s: string) => s.length > 0 && s[0] === '/')

*Defined in [src/Path/exports.ts:32](https://github.com/TylorS/typed-fp/blob/559f273/src/Path/exports.ts#L32)*

A Prism instance for Path

## Functions

### pathJoin

▸ **pathJoin**(`paths`: ReadonlyArray\<string \| [Path](_path_exports_.path.md) \| undefined \| null \| void \| boolean>, `trailingSlash?`: boolean): [Path](_path_exports_.path.md)

*Defined in [src/Path/exports.ts:48](https://github.com/TylorS/typed-fp/blob/559f273/src/Path/exports.ts#L48)*

Join together Paths to create a Path. Filterrs out non-strings.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`paths` | ReadonlyArray\<string \| [Path](_path_exports_.path.md) \| undefined \| null \| void \| boolean> | - |
`trailingSlash` | boolean | false |

**Returns:** [Path](_path_exports_.path.md)
