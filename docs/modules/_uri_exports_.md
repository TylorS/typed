**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Uri/exports"

# Module: "Uri/exports"

## Index

### Namespaces

* [Uri](_uri_exports_.uri.md)

### Type aliases

* [ParsedUri](_uri_exports_.md#parseduri)
* [QueryParams](_uri_exports_.md#queryparams)

### Variables

* [URI\_REGEX](_uri_exports_.md#uri_regex)
* [parsedUriKeyCount](_uri_exports_.md#parsedurikeycount)
* [parsedUriKeys](_uri_exports_.md#parsedurikeys)
* [uriEq](_uri_exports_.md#urieq)
* [uriPrism](_uri_exports_.md#uriprism)

### Functions

* [\_\_addQueryParameters](_uri_exports_.md#__addqueryparameters)
* [addQueryParameters](_uri_exports_.md#addqueryparameters)
* [parseUri](_uri_exports_.md#parseuri)
* [queryParam](_uri_exports_.md#queryparam)

## Type aliases

### ParsedUri

Ƭ  **ParsedUri**: { directory: string ; file: string ; hash: string ; host: string ; hostname: string ; href: string ; password: string ; pathname: [Path](_path_exports_.path.md) ; port: string ; protocol: string ; relative: string ; search: string ; userInfo: string ; username: string  }

*Defined in [src/Uri/exports.ts:68](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L68)*

ParsedUri JSON data structure

**`name`** ParsedUri

#### Type declaration:

Name | Type |
------ | ------ |
`directory` | string |
`file` | string |
`hash` | string |
`host` | string |
`hostname` | string |
`href` | string |
`password` | string |
`pathname` | [Path](_path_exports_.path.md) |
`port` | string |
`protocol` | string |
`relative` | string |
`search` | string |
`userInfo` | string |
`username` | string |

___

### QueryParams

Ƭ  **QueryParams**: ReadonlyRecord\<string, string \| undefined>

*Defined in [src/Uri/exports.ts:33](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L33)*

## Variables

### URI\_REGEX

• `Const` **URI\_REGEX**: RegExp = /^(?:([^:/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?))?((((?:[^?#/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/

*Defined in [src/Uri/exports.ts:31](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L31)*

Regex for URIs

___

### parsedUriKeyCount

• `Const` **parsedUriKeyCount**: number = parsedUriKeys.length

*Defined in [src/Uri/exports.ts:136](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L136)*

___

### parsedUriKeys

• `Const` **parsedUriKeys**: ReadonlyArray\<keyof [ParsedUri](_uri_exports_.md#parseduri)> = [ 'href', 'protocol', 'host', 'userInfo', 'username', 'password', 'hostname', 'port', 'relative', 'pathname', 'directory', 'file', 'search', 'hash',]

*Defined in [src/Uri/exports.ts:119](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L119)*

___

### uriEq

• `Const` **uriEq**: Eq\<[Uri](_uri_exports_.uri.md)> = getEq\<Uri>(eqString)

*Defined in [src/Uri/exports.ts:19](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L19)*

Eq instance for Uri

___

### uriPrism

• `Const` **uriPrism**: Prism\<string, [Uri](_uri_exports_.uri.md)> = prism\<Uri>((s: string) => URI\_REGEX.test(s))

*Defined in [src/Uri/exports.ts:14](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L14)*

Prism instance for Uri

## Functions

### \_\_addQueryParameters

▸ **__addQueryParameters**(`url`: [Uri](_uri_exports_.uri.md), `queryParams`: [QueryParams](_uri_exports_.md#queryparams)): [Uri](_uri_exports_.uri.md)

*Defined in [src/Uri/exports.ts:49](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L49)*

#### Parameters:

Name | Type |
------ | ------ |
`url` | [Uri](_uri_exports_.uri.md) |
`queryParams` | [QueryParams](_uri_exports_.md#queryparams) |

**Returns:** [Uri](_uri_exports_.uri.md)

___

### addQueryParameters

▸ **addQueryParameters**(`url`: [Uri](_uri_exports_.uri.md), `queryParams`: [QueryParams](_uri_exports_.md#queryparams)): [Uri](_uri_exports_.uri.md)

*Defined in [src/Uri/exports.ts:35](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L35)*

Append Query Parameters to a Url

#### Parameters:

Name | Type |
------ | ------ |
`url` | [Uri](_uri_exports_.uri.md) |
`queryParams` | [QueryParams](_uri_exports_.md#queryparams) |

**Returns:** [Uri](_uri_exports_.uri.md)

▸ **addQueryParameters**(`url`: [Uri](_uri_exports_.uri.md)): function

*Defined in [src/Uri/exports.ts:36](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L36)*

Append Query Parameters to a Url

#### Parameters:

Name | Type |
------ | ------ |
`url` | [Uri](_uri_exports_.uri.md) |

**Returns:** function

___

### parseUri

▸ **parseUri**(`url`: [Uri](_uri_exports_.uri.md)): [ParsedUri](_uri_exports_.md#parseduri)

*Defined in [src/Uri/exports.ts:90](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L90)*

Parses an URL into JSON.

**`name`** parseUri(url: Uri): ParsedUri

#### Parameters:

Name | Type |
------ | ------ |
`url` | [Uri](_uri_exports_.uri.md) |

**Returns:** [ParsedUri](_uri_exports_.md#parseduri)

___

### queryParam

▸ **queryParam**(`queryParams`: [QueryParams](_uri_exports_.md#queryparams)): (Anonymous function)

*Defined in [src/Uri/exports.ts:55](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uri/exports.ts#L55)*

#### Parameters:

Name | Type |
------ | ------ |
`queryParams` | [QueryParams](_uri_exports_.md#queryparams) |

**Returns:** (Anonymous function)
