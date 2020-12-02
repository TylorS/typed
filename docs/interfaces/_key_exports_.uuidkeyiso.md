**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Key/exports"](../modules/_key_exports_.md) / UuidKeyIso

# Interface: UuidKeyIso\<A>

An Isomorphism for a UuidKey<A> and a Uuid

## Type parameters

Name |
------ |
`A` |

## Hierarchy

* Iso\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

  ↳ **UuidKeyIso**

## Index

### Constructors

* [constructor](_key_exports_.uuidkeyiso.md#constructor)

### Properties

* [\_tag](_key_exports_.uuidkeyiso.md#_tag)
* [from](_key_exports_.uuidkeyiso.md#from)
* [get](_key_exports_.uuidkeyiso.md#get)
* [reverseGet](_key_exports_.uuidkeyiso.md#reverseget)
* [to](_key_exports_.uuidkeyiso.md#to)
* [unwrap](_key_exports_.uuidkeyiso.md#unwrap)
* [wrap](_key_exports_.uuidkeyiso.md#wrap)

### Methods

* [asFold](_key_exports_.uuidkeyiso.md#asfold)
* [asGetter](_key_exports_.uuidkeyiso.md#asgetter)
* [asLens](_key_exports_.uuidkeyiso.md#aslens)
* [asOptional](_key_exports_.uuidkeyiso.md#asoptional)
* [asPrism](_key_exports_.uuidkeyiso.md#asprism)
* [asSetter](_key_exports_.uuidkeyiso.md#assetter)
* [asTraversal](_key_exports_.uuidkeyiso.md#astraversal)
* [compose](_key_exports_.uuidkeyiso.md#compose)
* [composeFold](_key_exports_.uuidkeyiso.md#composefold)
* [composeGetter](_key_exports_.uuidkeyiso.md#composegetter)
* [composeIso](_key_exports_.uuidkeyiso.md#composeiso)
* [composeLens](_key_exports_.uuidkeyiso.md#composelens)
* [composeOptional](_key_exports_.uuidkeyiso.md#composeoptional)
* [composePrism](_key_exports_.uuidkeyiso.md#composeprism)
* [composeSetter](_key_exports_.uuidkeyiso.md#composesetter)
* [composeTraversal](_key_exports_.uuidkeyiso.md#composetraversal)
* [modify](_key_exports_.uuidkeyiso.md#modify)
* [reverse](_key_exports_.uuidkeyiso.md#reverse)

## Constructors

### constructor

\+ **new UuidKeyIso**(`get`: (s: [UuidKey](_key_exports_.uuidkey.md)\<A>) => [Uuid](../modules/_uuid_common_.uuid.md), `reverseGet`: (a: [Uuid](../modules/_uuid_common_.uuid.md)) => [UuidKey](_key_exports_.uuidkey.md)\<A>): [UuidKeyIso](_key_exports_.uuidkeyiso.md)

*Inherited from [KeyIso](_key_exports_.keyiso.md).[constructor](_key_exports_.keyiso.md#constructor)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:74*

#### Parameters:

Name | Type |
------ | ------ |
`get` | (s: [UuidKey](_key_exports_.uuidkey.md)\<A>) => [Uuid](../modules/_uuid_common_.uuid.md) |
`reverseGet` | (a: [Uuid](../modules/_uuid_common_.uuid.md)) => [UuidKey](_key_exports_.uuidkey.md)\<A> |

**Returns:** [UuidKeyIso](_key_exports_.uuidkeyiso.md)

## Properties

### \_tag

• `Readonly` **\_tag**: \"Iso\"

*Inherited from [KeyIso](_key_exports_.keyiso.md).[_tag](_key_exports_.keyiso.md#_tag)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:58*

**`since`** 1.0.0

___

### from

• `Readonly` **from**: (a: [Uuid](../modules/_uuid_common_.uuid.md)) => [UuidKey](_key_exports_.uuidkey.md)\<A>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[from](_key_exports_.keyiso.md#from)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:74*

**`since`** 1.0.0

___

### get

• `Readonly` **get**: (s: [UuidKey](_key_exports_.uuidkey.md)\<A>) => [Uuid](../modules/_uuid_common_.uuid.md)

*Inherited from [KeyIso](_key_exports_.keyiso.md).[get](_key_exports_.keyiso.md#get)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:53*

___

### reverseGet

• `Readonly` **reverseGet**: (a: [Uuid](../modules/_uuid_common_.uuid.md)) => [UuidKey](_key_exports_.uuidkey.md)\<A>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[reverseGet](_key_exports_.keyiso.md#reverseget)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:54*

___

### to

• `Readonly` **to**: (s: [UuidKey](_key_exports_.uuidkey.md)\<A>) => [Uuid](../modules/_uuid_common_.uuid.md)

*Inherited from [KeyIso](_key_exports_.keyiso.md).[to](_key_exports_.keyiso.md#to)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:66*

**`since`** 1.0.0

___

### unwrap

• `Readonly` **unwrap**: (s: [UuidKey](_key_exports_.uuidkey.md)\<A>) => [Uuid](../modules/_uuid_common_.uuid.md)

*Inherited from [KeyIso](_key_exports_.keyiso.md).[unwrap](_key_exports_.keyiso.md#unwrap)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:62*

**`since`** 1.0.0

___

### wrap

• `Readonly` **wrap**: (a: [Uuid](../modules/_uuid_common_.uuid.md)) => [UuidKey](_key_exports_.uuidkey.md)\<A>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[wrap](_key_exports_.keyiso.md#wrap)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:70*

**`since`** 1.0.0

## Methods

### asFold

▸ **asFold**(): Fold\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asFold](_key_exports_.keyiso.md#asfold)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:114*

view an `Iso` as a `Fold`

**`since`** 1.0.0

**Returns:** Fold\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

___

### asGetter

▸ **asGetter**(): Getter\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asGetter](_key_exports_.keyiso.md#asgetter)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:120*

view an `Iso` as a `Getter`

**`since`** 1.0.0

**Returns:** Getter\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

___

### asLens

▸ **asLens**(): Lens\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asLens](_key_exports_.keyiso.md#aslens)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:90*

view an `Iso` as a `Lens`

**`since`** 1.0.0

**Returns:** Lens\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

___

### asOptional

▸ **asOptional**(): Optional\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asOptional](_key_exports_.keyiso.md#asoptional)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:102*

view an `Iso` as a `Optional`

**`since`** 1.0.0

**Returns:** Optional\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

___

### asPrism

▸ **asPrism**(): Prism\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asPrism](_key_exports_.keyiso.md#asprism)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:96*

view an `Iso` as a `Prism`

**`since`** 1.0.0

**Returns:** Prism\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

___

### asSetter

▸ **asSetter**(): Setter\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asSetter](_key_exports_.keyiso.md#assetter)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:126*

view an `Iso` as a `Setter`

**`since`** 1.0.0

**Returns:** Setter\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

___

### asTraversal

▸ **asTraversal**(): Traversal\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asTraversal](_key_exports_.keyiso.md#astraversal)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:108*

view an `Iso` as a `Traversal`

**`since`** 1.0.0

**Returns:** Traversal\<[UuidKey](_key_exports_.uuidkey.md)\<A>, [Uuid](../modules/_uuid_common_.uuid.md)>

___

### compose

▸ **compose**\<B>(`ab`: Iso\<[Uuid](../modules/_uuid_common_.uuid.md), B>): Iso\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[compose](_key_exports_.keyiso.md#compose)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:132*

compose an `Iso` with an `Iso`

**`since`** 1.0.0

#### Type parameters:

Name |
------ |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`ab` | Iso\<[Uuid](../modules/_uuid_common_.uuid.md), B> |

**Returns:** Iso\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

___

### composeFold

▸ **composeFold**\<B>(`ab`: Fold\<[Uuid](../modules/_uuid_common_.uuid.md), B>): Fold\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[composeFold](_key_exports_.keyiso.md#composefold)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:168*

compose an `Iso` with a `Fold`

**`since`** 1.0.0

#### Type parameters:

Name |
------ |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`ab` | Fold\<[Uuid](../modules/_uuid_common_.uuid.md), B> |

**Returns:** Fold\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

___

### composeGetter

▸ **composeGetter**\<B>(`ab`: Getter\<[Uuid](../modules/_uuid_common_.uuid.md), B>): Getter\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[composeGetter](_key_exports_.keyiso.md#composegetter)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:174*

compose an `Iso` with a `Getter`

**`since`** 1.0.0

#### Type parameters:

Name |
------ |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`ab` | Getter\<[Uuid](../modules/_uuid_common_.uuid.md), B> |

**Returns:** Getter\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

___

### composeIso

▸ **composeIso**\<B>(`ab`: Iso\<[Uuid](../modules/_uuid_common_.uuid.md), B>): Iso\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[composeIso](_key_exports_.keyiso.md#composeiso)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:138*

Alias of `compose`

**`since`** 1.0.0

#### Type parameters:

Name |
------ |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`ab` | Iso\<[Uuid](../modules/_uuid_common_.uuid.md), B> |

**Returns:** Iso\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

___

### composeLens

▸ **composeLens**\<B>(`ab`: Lens\<[Uuid](../modules/_uuid_common_.uuid.md), B>): Lens\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[composeLens](_key_exports_.keyiso.md#composelens)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:144*

compose an `Iso` with a `Lens `

**`since`** 1.0.0

#### Type parameters:

Name |
------ |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`ab` | Lens\<[Uuid](../modules/_uuid_common_.uuid.md), B> |

**Returns:** Lens\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

___

### composeOptional

▸ **composeOptional**\<B>(`ab`: Optional\<[Uuid](../modules/_uuid_common_.uuid.md), B>): Optional\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[composeOptional](_key_exports_.keyiso.md#composeoptional)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:156*

compose an `Iso` with an `Optional`

**`since`** 1.0.0

#### Type parameters:

Name |
------ |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`ab` | Optional\<[Uuid](../modules/_uuid_common_.uuid.md), B> |

**Returns:** Optional\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

___

### composePrism

▸ **composePrism**\<B>(`ab`: Prism\<[Uuid](../modules/_uuid_common_.uuid.md), B>): Prism\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[composePrism](_key_exports_.keyiso.md#composeprism)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:150*

compose an `Iso` with a `Prism`

**`since`** 1.0.0

#### Type parameters:

Name |
------ |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`ab` | Prism\<[Uuid](../modules/_uuid_common_.uuid.md), B> |

**Returns:** Prism\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

___

### composeSetter

▸ **composeSetter**\<B>(`ab`: Setter\<[Uuid](../modules/_uuid_common_.uuid.md), B>): Setter\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[composeSetter](_key_exports_.keyiso.md#composesetter)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:180*

compose an `Iso` with a `Setter`

**`since`** 1.0.0

#### Type parameters:

Name |
------ |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`ab` | Setter\<[Uuid](../modules/_uuid_common_.uuid.md), B> |

**Returns:** Setter\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

___

### composeTraversal

▸ **composeTraversal**\<B>(`ab`: Traversal\<[Uuid](../modules/_uuid_common_.uuid.md), B>): Traversal\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[composeTraversal](_key_exports_.keyiso.md#composetraversal)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:162*

compose an `Iso` with a `Traversal`

**`since`** 1.0.0

#### Type parameters:

Name |
------ |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`ab` | Traversal\<[Uuid](../modules/_uuid_common_.uuid.md), B> |

**Returns:** Traversal\<[UuidKey](_key_exports_.uuidkey.md)\<A>, B>

___

### modify

▸ **modify**(`f`: (a: [Uuid](../modules/_uuid_common_.uuid.md)) => [Uuid](../modules/_uuid_common_.uuid.md)): function

*Inherited from [KeyIso](_key_exports_.keyiso.md).[modify](_key_exports_.keyiso.md#modify)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:84*

**`since`** 1.0.0

#### Parameters:

Name | Type |
------ | ------ |
`f` | (a: [Uuid](../modules/_uuid_common_.uuid.md)) => [Uuid](../modules/_uuid_common_.uuid.md) |

**Returns:** function

___

### reverse

▸ **reverse**(): Iso\<[Uuid](../modules/_uuid_common_.uuid.md), [UuidKey](_key_exports_.uuidkey.md)\<A>>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[reverse](_key_exports_.keyiso.md#reverse)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:80*

reverse the `Iso`: the source becomes the target and the target becomes the source

**`since`** 1.0.0

**Returns:** Iso\<[Uuid](../modules/_uuid_common_.uuid.md), [UuidKey](_key_exports_.uuidkey.md)\<A>>
