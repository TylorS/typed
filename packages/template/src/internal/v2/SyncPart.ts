/**
 * @since 1.0.0
 */

/**
 * @since 1.0.0
 */
export type SyncPart =
  | AttributeSyncPart
  | BooleanSyncPart
  | ClassNameSyncPart
  | CommentSyncPart
  | DataSyncPart
  | NodeSyncPart
  | PropertySyncPart
  | TextSyncPart
  | PropertiesSyncPart

/**
 * @since 1.0.0
 */
export interface AttributeSyncPart {
  readonly _tag: "attribute"
  readonly name: string
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => boolean
}

/**
 * @since 1.0.0
 */
export interface BooleanSyncPart {
  readonly _tag: "boolean"
  readonly name: string
  readonly value: boolean | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => boolean
}

/**
 * @since 1.0.0
 */
export interface ClassNameSyncPart {
  readonly _tag: "className"
  readonly value: ReadonlyArray<string>
  readonly index: number

  readonly update: (value: this["value"]) => boolean
}

/**
 * @since 1.0.0
 */
export interface DataSyncPart {
  readonly _tag: "data"
  readonly value: Readonly<Record<string, string | undefined>> | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => boolean
}

/**
 * @since 1.0.0
 */
export interface PropertySyncPart {
  readonly _tag: "property"
  readonly name: string
  readonly value: unknown
  readonly index: number

  readonly update: (value: this["value"]) => boolean
}

/**
 * @since 1.0.0
 */
export interface CommentSyncPart {
  readonly _tag: "comment"
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => boolean
}

/**
 * @since 1.0.0
 */
export interface TextSyncPart {
  readonly _tag: "text"
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => boolean
}

/**
 * @since 1.0.0
 */
export interface NodeSyncPart {
  readonly _tag: "node"
  readonly value: unknown
  readonly index: number

  readonly update: (value: this["value"]) => boolean
}

/**
 * @since 1.0.0
 */
export interface PropertiesSyncPart {
  readonly _tag: "properties"
  readonly value: Readonly<Record<string, any>> | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => boolean
}

/**
 * @since 1.0.0
 */
export type SyncParts = ReadonlyArray<SyncPart>
