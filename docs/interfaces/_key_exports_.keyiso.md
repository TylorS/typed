**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Key/exports"](../modules/_key_exports_.md) / KeyIso

# Interface: KeyIso\<A>

An Isomorphism for a Key<A> and a string

## Type parameters

Name |
------ |
`A` |

## Hierarchy

* Iso\<[Key](_key_exports_.key.md)\<A>, string>

  ↳ **KeyIso**

## Index

### Constructors

* [constructor](_key_exports_.keyiso.md#constructor)

### Properties

* [\_tag](_key_exports_.keyiso.md#_tag)
* [from](_key_exports_.keyiso.md#from)
* [get](_key_exports_.keyiso.md#get)
* [reverseGet](_key_exports_.keyiso.md#reverseget)
* [to](_key_exports_.keyiso.md#to)
* [unwrap](_key_exports_.keyiso.md#unwrap)
* [wrap](_key_exports_.keyiso.md#wrap)

### Methods

* [asFold](_key_exports_.keyiso.md#asfold)
* [asGetter](_key_exports_.keyiso.md#asgetter)
* [asLens](_key_exports_.keyiso.md#aslens)
* [asOptional](_key_exports_.keyiso.md#asoptional)
* [asPrism](_key_exports_.keyiso.md#asprism)
* [asSetter](_key_exports_.keyiso.md#assetter)
* [asTraversal](_key_exports_.keyiso.md#astraversal)
* [compose](_key_exports_.keyiso.md#compose)
* [composeFold](_key_exports_.keyiso.md#composefold)
* [composeGetter](_key_exports_.keyiso.md#composegetter)
* [composeIso](_key_exports_.keyiso.md#composeiso)
* [composeLens](_key_exports_.keyiso.md#composelens)
* [composeOptional](_key_exports_.keyiso.md#composeoptional)
* [composePrism](_key_exports_.keyiso.md#composeprism)
* [composeSetter](_key_exports_.keyiso.md#composesetter)
* [composeTraversal](_key_exports_.keyiso.md#composetraversal)
* [modify](_key_exports_.keyiso.md#modify)
* [reverse](_key_exports_.keyiso.md#reverse)

## Constructors

### constructor

\+ **new KeyIso**(`get`: (s: [Key](_key_exports_.key.md)\<A>) => string, `reverseGet`: (a: string) => [Key](_key_exports_.key.md)\<A>): [KeyIso](_key_exports_.keyiso.md)

*Inherited from [KeyIso](_key_exports_.keyiso.md).[constructor](_key_exports_.keyiso.md#constructor)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:74*

#### Parameters:

Name | Type |
------ | ------ |
`get` | (s: [Key](_key_exports_.key.md)\<A>) => string |
`reverseGet` | (a: string) => [Key](_key_exports_.key.md)\<A> |

**Returns:** [KeyIso](_key_exports_.keyiso.md)

## Properties

### \_tag

• `Readonly` **\_tag**: \"Iso\"

*Inherited from [KeyIso](_key_exports_.keyiso.md).[_tag](_key_exports_.keyiso.md#_tag)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:58*

**`since`** 1.0.0

___

### from

• `Readonly` **from**: (a: string) => [Key](_key_exports_.key.md)\<A>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[from](_key_exports_.keyiso.md#from)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:74*

**`since`** 1.0.0

___

### get

• `Readonly` **get**: (s: [Key](_key_exports_.key.md)\<A>) => string

*Inherited from [KeyIso](_key_exports_.keyiso.md).[get](_key_exports_.keyiso.md#get)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:53*

___

### reverseGet

• `Readonly` **reverseGet**: (a: string) => [Key](_key_exports_.key.md)\<A>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[reverseGet](_key_exports_.keyiso.md#reverseget)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:54*

___

### to

• `Readonly` **to**: (s: [Key](_key_exports_.key.md)\<A>) => string

*Inherited from [KeyIso](_key_exports_.keyiso.md).[to](_key_exports_.keyiso.md#to)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:66*

**`since`** 1.0.0

___

### unwrap

• `Readonly` **unwrap**: (s: [Key](_key_exports_.key.md)\<A>) => string

*Inherited from [KeyIso](_key_exports_.keyiso.md).[unwrap](_key_exports_.keyiso.md#unwrap)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:62*

**`since`** 1.0.0

___

### wrap

• `Readonly` **wrap**: (a: string) => [Key](_key_exports_.key.md)\<A>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[wrap](_key_exports_.keyiso.md#wrap)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:70*

**`since`** 1.0.0

## Methods

### asFold

▸ **asFold**(): Fold\<[Key](_key_exports_.key.md)\<A>, string>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asFold](_key_exports_.keyiso.md#asfold)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:114*

view an `Iso` as a `Fold`

**`since`** 1.0.0

**Returns:** Fold\<[Key](_key_exports_.key.md)\<A>, string>

___

### asGetter

▸ **asGetter**(): Getter\<[Key](_key_exports_.key.md)\<A>, string>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asGetter](_key_exports_.keyiso.md#asgetter)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:120*

view an `Iso` as a `Getter`

**`since`** 1.0.0

**Returns:** Getter\<[Key](_key_exports_.key.md)\<A>, string>

___

### asLens

▸ **asLens**(): Lens\<[Key](_key_exports_.key.md)\<A>, string>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asLens](_key_exports_.keyiso.md#aslens)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:90*

view an `Iso` as a `Lens`

**`since`** 1.0.0

**Returns:** Lens\<[Key](_key_exports_.key.md)\<A>, string>

___

### asOptional

▸ **asOptional**(): Optional\<[Key](_key_exports_.key.md)\<A>, string>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asOptional](_key_exports_.keyiso.md#asoptional)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:102*

view an `Iso` as a `Optional`

**`since`** 1.0.0

**Returns:** Optional\<[Key](_key_exports_.key.md)\<A>, string>

___

### asPrism

▸ **asPrism**(): Prism\<[Key](_key_exports_.key.md)\<A>, string>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asPrism](_key_exports_.keyiso.md#asprism)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:96*

view an `Iso` as a `Prism`

**`since`** 1.0.0

**Returns:** Prism\<[Key](_key_exports_.key.md)\<A>, string>

___

### asSetter

▸ **asSetter**(): Setter\<[Key](_key_exports_.key.md)\<A>, string>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asSetter](_key_exports_.keyiso.md#assetter)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:126*

view an `Iso` as a `Setter`

**`since`** 1.0.0

**Returns:** Setter\<[Key](_key_exports_.key.md)\<A>, string>

___

### asTraversal

▸ **asTraversal**(): Traversal\<[Key](_key_exports_.key.md)\<A>, string>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[asTraversal](_key_exports_.keyiso.md#astraversal)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:108*

view an `Iso` as a `Traversal`

**`since`** 1.0.0

**Returns:** Traversal\<[Key](_key_exports_.key.md)\<A>, string>

___

### compose

▸ **compose**\<B>(`ab`: Iso\<string, B>): Iso\<[Key](_key_exports_.key.md)\<A>, B>

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
`ab` | Iso\<string, B> |

**Returns:** Iso\<[Key](_key_exports_.key.md)\<A>, B>

___

### composeFold

▸ **composeFold**\<B>(`ab`: Fold\<string, B>): Fold\<[Key](_key_exports_.key.md)\<A>, B>

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
`ab` | Fold\<string, B> |

**Returns:** Fold\<[Key](_key_exports_.key.md)\<A>, B>

___

### composeGetter

▸ **composeGetter**\<B>(`ab`: Getter\<string, B>): Getter\<[Key](_key_exports_.key.md)\<A>, B>

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
`ab` | Getter\<string, B> |

**Returns:** Getter\<[Key](_key_exports_.key.md)\<A>, B>

___

### composeIso

▸ **composeIso**\<B>(`ab`: Iso\<string, B>): Iso\<[Key](_key_exports_.key.md)\<A>, B>

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
`ab` | Iso\<string, B> |

**Returns:** Iso\<[Key](_key_exports_.key.md)\<A>, B>

___

### composeLens

▸ **composeLens**\<B>(`ab`: Lens\<string, B>): Lens\<[Key](_key_exports_.key.md)\<A>, B>

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
`ab` | Lens\<string, B> |

**Returns:** Lens\<[Key](_key_exports_.key.md)\<A>, B>

___

### composeOptional

▸ **composeOptional**\<B>(`ab`: Optional\<string, B>): Optional\<[Key](_key_exports_.key.md)\<A>, B>

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
`ab` | Optional\<string, B> |

**Returns:** Optional\<[Key](_key_exports_.key.md)\<A>, B>

___

### composePrism

▸ **composePrism**\<B>(`ab`: Prism\<string, B>): Prism\<[Key](_key_exports_.key.md)\<A>, B>

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
`ab` | Prism\<string, B> |

**Returns:** Prism\<[Key](_key_exports_.key.md)\<A>, B>

___

### composeSetter

▸ **composeSetter**\<B>(`ab`: Setter\<string, B>): Setter\<[Key](_key_exports_.key.md)\<A>, B>

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
`ab` | Setter\<string, B> |

**Returns:** Setter\<[Key](_key_exports_.key.md)\<A>, B>

___

### composeTraversal

▸ **composeTraversal**\<B>(`ab`: Traversal\<string, B>): Traversal\<[Key](_key_exports_.key.md)\<A>, B>

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
`ab` | Traversal\<string, B> |

**Returns:** Traversal\<[Key](_key_exports_.key.md)\<A>, B>

___

### modify

▸ **modify**(`f`: (a: string) => string): function

*Inherited from [KeyIso](_key_exports_.keyiso.md).[modify](_key_exports_.keyiso.md#modify)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:84*

**`since`** 1.0.0

#### Parameters:

Name | Type |
------ | ------ |
`f` | (a: string) => string |

**Returns:** function

___

### reverse

▸ **reverse**(): Iso\<string, [Key](_key_exports_.key.md)\<A>>

*Inherited from [KeyIso](_key_exports_.keyiso.md).[reverse](_key_exports_.keyiso.md#reverse)*

*Defined in node_modules/monocle-ts/lib/index.d.ts:80*

reverse the `Iso`: the source becomes the target and the target becomes the source

**`since`** 1.0.0

**Returns:** Iso\<string, [Key](_key_exports_.key.md)\<A>>
