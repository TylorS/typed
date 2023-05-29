import { AttrPart } from './AttrPart.js'
import { BooleanPart } from './BooleanPart.js'
import { ClassNamePart } from './ClassNamePart.js'
import { DataPart } from './DataPart.js'
import { EventPart } from './EventPart.js'
import { NodePart } from './NodePart.js'
import { PropertyPart } from './PropertyPart.js'
import { RefPart } from './RefPart.js'
import { TextPart } from './TextPart.js'

export type Part<R = never, E = never> =
  | AttrPart
  | BooleanPart
  | ClassNamePart
  | DataPart
  | EventPart<R, E>
  | NodePart
  | PropertyPart
  | RefPart
  | TextPart
