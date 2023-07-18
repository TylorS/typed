import { AttrPart } from './AttrPart.js'
import { BooleanPart } from './BooleanPart.js'
import { ClassNamePart } from './ClassNamePart.js'
import { CommentPart } from './CommentPart.js'
import { DataPart } from './DataPart.js'
import { EventPart } from './EventPart.js'
import { NodePart } from './NodePart.js'
import { PropertyPart } from './PropertyPart.js'
import { RefPart } from './RefPart.js'
import { SparseAttrPart } from './SparseAttrPart.js'
import { SparseClassNamePart } from './SparseClassNamePart.js'
import { TextPart } from './TextPart.js'

export type Part =
  | AttrPart
  | BooleanPart
  | ClassNamePart
  | CommentPart
  | DataPart
  | EventPart
  | NodePart
  | PropertyPart
  | RefPart
  | TextPart

export type SparsePart = SparseAttrPart | SparseClassNamePart
