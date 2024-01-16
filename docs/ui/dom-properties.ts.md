---
title: dom-properties.ts
nav_order: 2
parent: "@typed/ui"
---

## dom-properties overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ElementProperties (type alias)](#elementproperties-type-alias)
  - [HTMLAnchorElementProperties (type alias)](#htmlanchorelementproperties-type-alias)
  - [HTMLAppletElementProperties (type alias)](#htmlappletelementproperties-type-alias)
  - [HTMLAreaElementProperties (type alias)](#htmlareaelementproperties-type-alias)
  - [HTMLAudioElementProperties (type alias)](#htmlaudioelementproperties-type-alias)
  - [HTMLBRElementProperties (type alias)](#htmlbrelementproperties-type-alias)
  - [HTMLBaseElementProperties (type alias)](#htmlbaseelementproperties-type-alias)
  - [HTMLBaseFontElementProperties (type alias)](#htmlbasefontelementproperties-type-alias)
  - [HTMLBodyElementProperties (type alias)](#htmlbodyelementproperties-type-alias)
  - [HTMLButtonElementProperties (type alias)](#htmlbuttonelementproperties-type-alias)
  - [HTMLCanvasElementProperties (type alias)](#htmlcanvaselementproperties-type-alias)
  - [HTMLDListElementProperties (type alias)](#htmldlistelementproperties-type-alias)
  - [HTMLDataElementProperties (type alias)](#htmldataelementproperties-type-alias)
  - [HTMLDataListElementProperties (type alias)](#htmldatalistelementproperties-type-alias)
  - [HTMLDirectoryElementProperties (type alias)](#htmldirectoryelementproperties-type-alias)
  - [HTMLDivElementProperties (type alias)](#htmldivelementproperties-type-alias)
  - [HTMLElementProperties (type alias)](#htmlelementproperties-type-alias)
  - [HTMLEmbedElementProperties (type alias)](#htmlembedelementproperties-type-alias)
  - [HTMLFieldSetElementProperties (type alias)](#htmlfieldsetelementproperties-type-alias)
  - [HTMLFontElementProperties (type alias)](#htmlfontelementproperties-type-alias)
  - [HTMLFormElementProperties (type alias)](#htmlformelementproperties-type-alias)
  - [HTMLFrameElementProperties (type alias)](#htmlframeelementproperties-type-alias)
  - [HTMLFrameSetElementProperties (type alias)](#htmlframesetelementproperties-type-alias)
  - [HTMLHRElementProperties (type alias)](#htmlhrelementproperties-type-alias)
  - [HTMLHeadElementProperties (type alias)](#htmlheadelementproperties-type-alias)
  - [HTMLHeadingElementProperties (type alias)](#htmlheadingelementproperties-type-alias)
  - [HTMLHtmlElementProperies (type alias)](#htmlhtmlelementproperies-type-alias)
  - [HTMLIFrameElementProperties (type alias)](#htmliframeelementproperties-type-alias)
  - [HTMLImageElementProperties (type alias)](#htmlimageelementproperties-type-alias)
  - [HTMLInputElementProperties (type alias)](#htmlinputelementproperties-type-alias)
  - [HTMLLIElementProperties (type alias)](#htmllielementproperties-type-alias)
  - [HTMLLabelElementProperties (type alias)](#htmllabelelementproperties-type-alias)
  - [HTMLLegendElementProperties (type alias)](#htmllegendelementproperties-type-alias)
  - [HTMLLinkElementProperties (type alias)](#htmllinkelementproperties-type-alias)
  - [HTMLMapElementProperties (type alias)](#htmlmapelementproperties-type-alias)
  - [HTMLMarqueeElementProperties (type alias)](#htmlmarqueeelementproperties-type-alias)
  - [HTMLMediaElementProperties (type alias)](#htmlmediaelementproperties-type-alias)
  - [HTMLMenuElementProperties (type alias)](#htmlmenuelementproperties-type-alias)
  - [HTMLMetaElementProperties (type alias)](#htmlmetaelementproperties-type-alias)
  - [HTMLMeterElementProperties (type alias)](#htmlmeterelementproperties-type-alias)
  - [HTMLModElementProperties (type alias)](#htmlmodelementproperties-type-alias)
  - [HTMLOListElementProperteis (type alias)](#htmlolistelementproperteis-type-alias)
  - [HTMLObjectElementProperties (type alias)](#htmlobjectelementproperties-type-alias)
  - [HTMLOptGroupElementProperties (type alias)](#htmloptgroupelementproperties-type-alias)
  - [HTMLOptionElementProperties (type alias)](#htmloptionelementproperties-type-alias)
  - [HTMLOutputElementProperties (type alias)](#htmloutputelementproperties-type-alias)
  - [HTMLParagraphElementProperties (type alias)](#htmlparagraphelementproperties-type-alias)
  - [HTMLParamElementProperties (type alias)](#htmlparamelementproperties-type-alias)
  - [HTMLPreElementProperties (type alias)](#htmlpreelementproperties-type-alias)
  - [HTMLProgressElementProperties (type alias)](#htmlprogresselementproperties-type-alias)
  - [HTMLPropertiesMap (interface)](#htmlpropertiesmap-interface)
  - [HTMLQuoteElementProperties (type alias)](#htmlquoteelementproperties-type-alias)
  - [HTMLScriptElementProperties (type alias)](#htmlscriptelementproperties-type-alias)
  - [HTMLSelectElementProperties (type alias)](#htmlselectelementproperties-type-alias)
  - [HTMLSourceElementProperties (type alias)](#htmlsourceelementproperties-type-alias)
  - [HTMLSpanElementProperties (type alias)](#htmlspanelementproperties-type-alias)
  - [HTMLStyleElementProperties (type alias)](#htmlstyleelementproperties-type-alias)
  - [HTMLTableCaptionElementProperties (type alias)](#htmltablecaptionelementproperties-type-alias)
  - [HTMLTableCellElementProperties (type alias)](#htmltablecellelementproperties-type-alias)
  - [HTMLTableColElementProperties (type alias)](#htmltablecolelementproperties-type-alias)
  - [HTMLTableDataCellElementProperties (type alias)](#htmltabledatacellelementproperties-type-alias)
  - [HTMLTableElementProperties (type alias)](#htmltableelementproperties-type-alias)
  - [HTMLTableHeaderCellElementProperties (type alias)](#htmltableheadercellelementproperties-type-alias)
  - [HTMLTableRowElementProperties (type alias)](#htmltablerowelementproperties-type-alias)
  - [HTMLTableSectionElementProperties (type alias)](#htmltablesectionelementproperties-type-alias)
  - [HTMLTemplateElementProperties (type alias)](#htmltemplateelementproperties-type-alias)
  - [HTMLTextAreaElementProperties (type alias)](#htmltextareaelementproperties-type-alias)
  - [HTMLTimeElementProperties (type alias)](#htmltimeelementproperties-type-alias)
  - [HTMLTitleElementProperties (type alias)](#htmltitleelementproperties-type-alias)
  - [HTMLTrackElementProperties (type alias)](#htmltrackelementproperties-type-alias)
  - [HTMLUListElementProperties (type alias)](#htmlulistelementproperties-type-alias)
  - [HTMLUnknownElementProperties (type alias)](#htmlunknownelementproperties-type-alias)
  - [HTMLVideoElementProperties (type alias)](#htmlvideoelementproperties-type-alias)

---

# utils

## ElementProperties (type alias)

**Signature**

```ts
export type ElementProperties = {
  className?: string | null | undefined
  id?: string | null | undefined
  scrollLeft?: number | null | undefined
  scrollTop?: number | null | undefined
  slot?: string | null | undefined
}
```

Added in v1.0.0

## HTMLAnchorElementProperties (type alias)

**Signature**

```ts
export type HTMLAnchorElementProperties = HTMLElementProperties & {
  Methods?: string | null | undefined
  charset?: string | null | undefined
  coords?: string | null | undefined
  download?: string | null | undefined
  hash?: string | null | undefined
  host?: string | null | undefined
  hostname?: string | null | undefined
  href?: string | null | undefined
  hreflang?: string | null | undefined
  name?: string | null | undefined
  pathname?: string | null | undefined
  port?: string | null | undefined
  protocol?: string | null | undefined
  rel?: string | null | undefined
  rev?: string | null | undefined
  search?: string | null | undefined
  shape?: string | null | undefined
  target?: string | null | undefined
  text?: string | null | undefined
  type?: string | null | undefined
  urn?: string | null | undefined
}
```

Added in v1.0.0

## HTMLAppletElementProperties (type alias)

**Signature**

```ts
export type HTMLAppletElementProperties = HTMLElementProperties & {
  align?: string
  alt?: string
  altHtml?: string
  archive?: string
  border?: string
  code?: string
  codeBase?: string
  codeType?: string
  data?: string
  declare?: boolean
  height?: string
  hspace?: number
  name?: string
  object?: string | null
  standby?: string
  type?: string
  vspace?: number
  width?: number
}
```

Added in v1.0.0

## HTMLAreaElementProperties (type alias)

**Signature**

```ts
export type HTMLAreaElementProperties = HTMLElementProperties & {
  alt?: string
  coords?: string
  download?: string
  hash?: string
  host?: string
  hostname?: string
  href?: string
  noHref?: string
  pathname?: string
  port?: string
  protocol?: string
  rel?: string
  search?: string
  shape?: string
  target?: string
}
```

Added in v1.0.0

## HTMLAudioElementProperties (type alias)

**Signature**

```ts
export type HTMLAudioElementProperties = HTMLElementProperties
```

Added in v1.0.0

## HTMLBRElementProperties (type alias)

**Signature**

```ts
export type HTMLBRElementProperties = HTMLElementProperties & {
  clear?: string
}
```

Added in v1.0.0

## HTMLBaseElementProperties (type alias)

**Signature**

```ts
export type HTMLBaseElementProperties = HTMLElementProperties & {
  href?: string
  target?: string
}
```

Added in v1.0.0

## HTMLBaseFontElementProperties (type alias)

**Signature**

```ts
export type HTMLBaseFontElementProperties = HTMLElementProperties & {
  face?: string
  size?: number
}
```

Added in v1.0.0

## HTMLBodyElementProperties (type alias)

**Signature**

```ts
export type HTMLBodyElementProperties = HTMLElementProperties & {
  aLink?: any
  background?: string
  bgColor?: any
  bgProperties?: string
  link?: any
  noWrap?: boolean
  text?: any
  vLink?: any
}
```

Added in v1.0.0

## HTMLButtonElementProperties (type alias)

**Signature**

```ts
export type HTMLButtonElementProperties = HTMLElementProperties & {
  autofocus?: boolean
  disabled?: boolean
  formAction?: string
  formEnctype?: string
  formMethod?: string
  formNoValidate?: string
  formTarget?: string
  name?: string
  status?: any
  type?: string
  value?: string
}
```

Added in v1.0.0

## HTMLCanvasElementProperties (type alias)

**Signature**

```ts
export type HTMLCanvasElementProperties = HTMLElementProperties & {
  height?: number
  width?: number
}
```

Added in v1.0.0

## HTMLDListElementProperties (type alias)

**Signature**

```ts
export type HTMLDListElementProperties = HTMLElementProperties & {
  compact?: boolean
}
```

Added in v1.0.0

## HTMLDataElementProperties (type alias)

**Signature**

```ts
export type HTMLDataElementProperties = HTMLElementProperties & {
  value?: string
}
```

Added in v1.0.0

## HTMLDataListElementProperties (type alias)

**Signature**

```ts
export type HTMLDataListElementProperties = HTMLElementProperties & {
  options?: HTMLCollectionOf<HTMLOptionElement>
}
```

Added in v1.0.0

## HTMLDirectoryElementProperties (type alias)

**Signature**

```ts
export type HTMLDirectoryElementProperties = HTMLElementProperties & {
  compact?: boolean
}
```

Added in v1.0.0

## HTMLDivElementProperties (type alias)

**Signature**

```ts
export type HTMLDivElementProperties = HTMLElementProperties & {
  align?: string
  noWrap?: boolean
}
```

Added in v1.0.0

## HTMLElementProperties (type alias)

**Signature**

```ts
export type HTMLElementProperties = ElementProperties & {
  accessKey?: string | null | undefined
  contentEditable?: string | null | undefined
  dir?: string | null | undefined
  draggable?: boolean | null | undefined
  hidden?: boolean | null | undefined
  hideFocus?: boolean | null | undefined
  lang?: string | null | undefined
  spellcheck?: boolean | null | undefined
  tabIndex?: boolean | null | undefined
  title?: string | null | undefined
}
```

Added in v1.0.0

## HTMLEmbedElementProperties (type alias)

**Signature**

```ts
export type HTMLEmbedElementProperties = HTMLElementProperties & {
  height?: string
  hidden?: any
  msPlayToDisabled?: boolean
  msPlayToPreferredSourceUri?: string
  msPlayToPrimary?: boolean
  name?: string
  src?: string
  units?: string
  width?: string
}
```

Added in v1.0.0

## HTMLFieldSetElementProperties (type alias)

**Signature**

```ts
export type HTMLFieldSetElementProperties = HTMLElementProperties & {
  align?: string
  disabled?: boolean
  name?: string
}
```

Added in v1.0.0

## HTMLFontElementProperties (type alias)

**Signature**

```ts
export type HTMLFontElementProperties = HTMLElementProperties & {
  face?: string
}
```

Added in v1.0.0

## HTMLFormElementProperties (type alias)

**Signature**

```ts
export type HTMLFormElementProperties = HTMLElementProperties & {
  acceptCharset?: string
  action?: string
  autocomplete?: string
  encoding?: string
  enctype?: string
  method?: string
  name?: string
  noValidate?: boolean
  target?: string
}
```

Added in v1.0.0

## HTMLFrameElementProperties (type alias)

**Signature**

```ts
export type HTMLFrameElementProperties = HTMLElementProperties & {
  border?: string
  borderColor?: any
  frameBorder?: string
  frameSpacing?: any
  height?: string | number
  longDesc?: string
  marginHeight?: string
  marginWidth?: string
  name?: string
  noResize?: boolean
  scrolling?: string
  src?: string
  width?: string | number
}
```

Added in v1.0.0

## HTMLFrameSetElementProperties (type alias)

**Signature**

```ts
export type HTMLFrameSetElementProperties = HTMLElementProperties & {
  border?: string
  borderColor?: string
  cols?: string
  frameBorder?: string
  frameSpacing?: any
  name?: string
  rows?: string
}
```

Added in v1.0.0

## HTMLHRElementProperties (type alias)

**Signature**

```ts
export type HTMLHRElementProperties = HTMLElementProperties & {
  align?: string
  noShade?: boolean
  width?: number
}
```

Added in v1.0.0

## HTMLHeadElementProperties (type alias)

**Signature**

```ts
export type HTMLHeadElementProperties = HTMLElementProperties & {
  profile?: string
}
```

Added in v1.0.0

## HTMLHeadingElementProperties (type alias)

**Signature**

```ts
export type HTMLHeadingElementProperties = HTMLElementProperties & {
  align?: string
}
```

Added in v1.0.0

## HTMLHtmlElementProperies (type alias)

**Signature**

```ts
export type HTMLHtmlElementProperies = HTMLElementProperties & {
  version?: string
}
```

Added in v1.0.0

## HTMLIFrameElementProperties (type alias)

**Signature**

```ts
export type HTMLIFrameElementProperties = HTMLElementProperties & {
  align?: string
  allowFullscreen?: boolean
  allowPaymentRequest?: boolean
  border?: string
  frameBorder?: string
  frameSpacing?: any
  height?: string
  hspace?: number
  longDesc?: string
  marginHeight?: string
  marginWidth?: string
  name?: string
  noResize?: boolean
  scrolling?: string
  src?: string
  vspace?: number
  width?: string
}
```

Added in v1.0.0

## HTMLImageElementProperties (type alias)

**Signature**

```ts
export type HTMLImageElementProperties = HTMLElementProperties & {
  align?: string
  alt?: string
  border?: string
  crossOrigin?: string | null
  height?: number
  hspace?: number
  isMap?: boolean
  longDesc?: string
  lowsrc?: string
  msPlayToDisabled?: boolean
  msPlayToPreferredSourceUri?: string
  msPlayToPrimary?: boolean
  name?: string
  sizes?: string
  src?: string
  srcset?: string
  useMap?: string
  vspace?: number
  width?: number
}
```

Added in v1.0.0

## HTMLInputElementProperties (type alias)

**Signature**

```ts
export type HTMLInputElementProperties = HTMLElementProperties & {
  accept?: string
  align?: string
  alt?: string
  autocomplete?: string
  autofocus?: boolean
  border?: string
  checked?: boolean
  defaultChecked?: boolean
  defaultValue?: string
  disabled?: boolean
  formAction?: string
  formEnctype?: string
  formMethod?: string
  formNoValidate?: string
  formTarget?: string
  height?: string
  hspace?: number
  indeterminate?: boolean
  max?: string
  maxLength?: number
  min?: string
  minLength?: number
  multiple?: boolean
  name?: string
  pattern?: string
  placeholder?: string
  readOnly?: string
  required?: boolean
  selectionDirection?: string
  selectionEnd?: number
  selectionStart?: number
  size?: number
  src?: string
  status?: boolean
  step?: string
  type?: string
  useMap?: string
  value?: string
  valueAsDate?: Date
  valueAsNumber?: number
  vspace?: number
  webkitdirectory?: boolean
  width?: string
}
```

Added in v1.0.0

## HTMLLIElementProperties (type alias)

**Signature**

```ts
export type HTMLLIElementProperties = HTMLElementProperties & {
  type?: string
  value?: number
}
```

Added in v1.0.0

## HTMLLabelElementProperties (type alias)

**Signature**

```ts
export type HTMLLabelElementProperties = HTMLElementProperties & {
  htmlFor?: string
}
```

Added in v1.0.0

## HTMLLegendElementProperties (type alias)

**Signature**

```ts
export type HTMLLegendElementProperties = HTMLElementProperties & {
  align?: string
}
```

Added in v1.0.0

## HTMLLinkElementProperties (type alias)

**Signature**

```ts
export type HTMLLinkElementProperties = HTMLElementProperties & {
  charset?: string
  disabled?: boolean
  href?: string
  hreflang?: string
  media?: string
  rel?: string
  rev?: string
  target?: string
  type?: string
  import?: Document
  integrity?: string
}
```

Added in v1.0.0

## HTMLMapElementProperties (type alias)

**Signature**

```ts
export type HTMLMapElementProperties = HTMLElementProperties & {
  name?: string
}
```

Added in v1.0.0

## HTMLMarqueeElementProperties (type alias)

**Signature**

```ts
export type HTMLMarqueeElementProperties = HTMLElementProperties & {
  behavior?: string
  bgColor?: any
  direction?: string
  height?: string
  hspace?: number
  loop?: number
  scrollAmount?: number
  scrollDelay?: number
  trueSpeed?: boolean
  vspace?: number
  width?: string
}
```

Added in v1.0.0

## HTMLMediaElementProperties (type alias)

**Signature**

```ts
export type HTMLMediaElementProperties = HTMLElementProperties & {
  autoplay?: boolean
  controls?: boolean
  crossOrigin?: string | null
  currentTime?: number
  defaultMuted?: boolean
  defaultPlaybackRate?: number
  loop?: boolean
  msAudioCategory?: string
  msAudioDeviceType?: string
  msPlayToDisabled?: boolean
  msPlayToPreferredSourceUri?: string
  msPlayToPrimary?: string
  msRealTime?: boolean
  muted?: boolean
  playbackRate?: number
  preload?: string
  readyState?: number
  src?: string
  srcObject?: MediaStream | null
  volume?: number
}
```

Added in v1.0.0

## HTMLMenuElementProperties (type alias)

**Signature**

```ts
export type HTMLMenuElementProperties = HTMLElementProperties & {
  compact?: boolean
  type?: string
}
```

Added in v1.0.0

## HTMLMetaElementProperties (type alias)

**Signature**

```ts
export type HTMLMetaElementProperties = HTMLElementProperties & {
  charset?: string
  content?: string
  httpEquiv?: string
  name?: string
  scheme?: string
  url?: string
}
```

Added in v1.0.0

## HTMLMeterElementProperties (type alias)

**Signature**

```ts
export type HTMLMeterElementProperties = HTMLElementProperties & {
  high?: number
  low?: number
  max?: number
  min?: number
  optimum?: number
  value?: number
}
```

Added in v1.0.0

## HTMLModElementProperties (type alias)

**Signature**

```ts
export type HTMLModElementProperties = HTMLElementProperties & {
  cite?: string
  dateTime?: string
}
```

Added in v1.0.0

## HTMLOListElementProperteis (type alias)

**Signature**

```ts
export type HTMLOListElementProperteis = HTMLElementProperties & {
  compact?: boolean
  start?: number
  type?: string
}
```

Added in v1.0.0

## HTMLObjectElementProperties (type alias)

**Signature**

```ts
export type HTMLObjectElementProperties = HTMLElementProperties & {
  align?: string
  alt?: string
  altHtml?: string
  archive?: string
  border?: string
  code?: string
  codeBase?: string
  codeType?: string
  data?: string
  declare?: boolean
  height?: string
  hspace?: number
  msPlayToDisabled?: boolean
  msPlayToPreferredSourceUri?: string
  msPlayToPrimary?: boolean
  name?: string
  standby?: string
  type?: string
  useMap?: string
  vspace?: number
  width?: string
}
```

Added in v1.0.0

## HTMLOptGroupElementProperties (type alias)

**Signature**

```ts
export type HTMLOptGroupElementProperties = HTMLElementProperties & {
  defaultSelected?: boolean
  disabled?: boolean
  label?: string
  selected?: boolean
  value?: string
}
```

Added in v1.0.0

## HTMLOptionElementProperties (type alias)

**Signature**

```ts
export type HTMLOptionElementProperties = HTMLElementProperties & {
  defaultSelected?: boolean
  disabled?: boolean
  label?: string
  selected?: boolean
  text?: string
  value?: string
}
```

Added in v1.0.0

## HTMLOutputElementProperties (type alias)

**Signature**

```ts
export type HTMLOutputElementProperties = HTMLElementProperties & {
  defaultValue?: string
  name?: string
  value?: string
}
```

Added in v1.0.0

## HTMLParagraphElementProperties (type alias)

**Signature**

```ts
export type HTMLParagraphElementProperties = HTMLElementProperties & {
  align?: string
  clear?: string
}
```

Added in v1.0.0

## HTMLParamElementProperties (type alias)

**Signature**

```ts
export type HTMLParamElementProperties = HTMLElementProperties & {
  name?: string
  type?: string
  value?: string
  valueType?: string
}
```

Added in v1.0.0

## HTMLPreElementProperties (type alias)

**Signature**

```ts
export type HTMLPreElementProperties = HTMLElementProperties & {
  width?: number
}
```

Added in v1.0.0

## HTMLProgressElementProperties (type alias)

**Signature**

```ts
export type HTMLProgressElementProperties = HTMLElementProperties & {
  max?: number
  value?: number
}
```

Added in v1.0.0

## HTMLPropertiesMap (interface)

**Signature**

```ts
export interface HTMLPropertiesMap {
  a: HTMLAnchorElementProperties
  abbr: HTMLElementProperties
  address: HTMLElementProperties
  applet: HTMLAppletElementProperties
  area: HTMLAreaElementProperties
  article: HTMLElementProperties
  aside: HTMLElementProperties
  audio: HTMLAudioElementProperties
  b: HTMLElementProperties
  base: HTMLBaseElementProperties
  basefont: HTMLBaseFontElementProperties
  bdi: HTMLElementProperties
  bdo: HTMLElementProperties
  big: HTMLElementProperties
  blockquote: HTMLElementProperties
  body: HTMLBodyElementProperties
  br: HTMLBRElementProperties
  button: HTMLButtonElementProperties
  canvas: HTMLCanvasElementProperties
  caption: HTMLElementProperties
  center: HTMLElementProperties
  cite: HTMLElementProperties
  code: HTMLElementProperties
  col: HTMLTableColElementProperties
  colgroup: HTMLTableColElementProperties
  data: HTMLDataElementProperties
  datalist: HTMLDataListElementProperties
  dd: HTMLElementProperties
  del: HTMLModElementProperties
  details: HTMLElementProperties
  dfn: HTMLElementProperties
  dialog: HTMLElementProperties
  dir: HTMLDirectoryElementProperties
  div: HTMLDivElementProperties
  dl: HTMLDListElementProperties
  dt: HTMLElementProperties
  em: HTMLElementProperties
  embed: HTMLEmbedElementProperties
  fieldset: HTMLFieldSetElementProperties
  figcaption: HTMLElementProperties
  figure: HTMLElementProperties
  font: HTMLFontElementProperties
  footer: HTMLElementProperties
  form: HTMLFormElementProperties
  frame: HTMLFrameElementProperties
  frameset: HTMLFrameSetElementProperties
  h1: HTMLHeadingElementProperties
  h2: HTMLHeadingElementProperties
  h3: HTMLHeadingElementProperties
  h4: HTMLHeadingElementProperties
  h5: HTMLHeadingElementProperties
  h6: HTMLHeadingElementProperties
  head: HTMLHeadElementProperties
  header: HTMLElementProperties
  hgroup: HTMLElementProperties
  hr: HTMLHRElementProperties
  html: HTMLHtmlElementProperies
  i: HTMLElementProperties
  iframe: HTMLIFrameElementProperties
  img: HTMLImageElementProperties
  input: HTMLInputElementProperties
  ins: HTMLModElementProperties
  kbd: HTMLElementProperties
  label: HTMLLabelElementProperties
  legend: HTMLLegendElementProperties
  li: HTMLLIElementProperties
  link: HTMLLinkElementProperties
  main: HTMLElementProperties
  map: HTMLMapElementProperties
  mark: HTMLElementProperties
  marquee: HTMLMarqueeElementProperties
  menu: HTMLMenuElementProperties
  menuitem: HTMLElementProperties
  meta: HTMLMetaElementProperties
  meter: HTMLMeterElementProperties
  nav: HTMLElementProperties
  noframes: HTMLElementProperties
  noscript: HTMLElementProperties
  object: HTMLObjectElementProperties
  ol: HTMLOListElementProperteis
  optgroup: HTMLOptGroupElementProperties
  option: HTMLOptionElementProperties
  output: HTMLOutputElementProperties
  p: HTMLParagraphElementProperties
  param: HTMLParamElementProperties
  picture: HTMLElementProperties
  pre: HTMLPreElementProperties
  progress: HTMLProgressElementProperties
  q: HTMLQuoteElementProperties
  rp: HTMLElementProperties
  rt: HTMLElementProperties
  ruby: HTMLElementProperties
  s: HTMLElementProperties
  samp: HTMLElementProperties
  script: HTMLScriptElementProperties
  section: HTMLElementProperties
  select: HTMLSelectElementProperties
  small: HTMLElementProperties
  source: HTMLSourceElementProperties
  span: HTMLSpanElementProperties
  strike: HTMLElementProperties
  strong: HTMLElementProperties
  style: HTMLStyleElementProperties
  sub: HTMLElementProperties
  summary: HTMLElementProperties
  sup: HTMLElementProperties
  table: HTMLTableElementProperties
  tbody: HTMLTableSectionElementProperties
  td: HTMLTableCellElementProperties
  template: HTMLTemplateElementProperties
  textarea: HTMLTextAreaElementProperties
  tfoot: HTMLTableSectionElementProperties
  th: HTMLTableHeaderCellElementProperties
  thead: HTMLTableSectionElementProperties
  time: HTMLTimeElementProperties
  title: HTMLTitleElementProperties
  tr: HTMLTableRowElementProperties
  track: HTMLTrackElementProperties
  tt: HTMLElementProperties
  u: HTMLElementProperties
  ul: HTMLUListElementProperties
  var: HTMLElementProperties
  video: HTMLVideoElementProperties
  wbr: HTMLElementProperties
}
```

Added in v1.0.0

## HTMLQuoteElementProperties (type alias)

**Signature**

```ts
export type HTMLQuoteElementProperties = HTMLElementProperties & {
  cite?: string
}
```

Added in v1.0.0

## HTMLScriptElementProperties (type alias)

**Signature**

```ts
export type HTMLScriptElementProperties = HTMLElementProperties & {
  async?: boolean
  charset?: string
  crossOrigin?: string | null
  defer?: boolean
  event?: string
  htmlFor?: string
  src?: string
  text?: string
  type?: string
  integrity?: string
}
```

Added in v1.0.0

## HTMLSelectElementProperties (type alias)

**Signature**

```ts
export type HTMLSelectElementProperties = HTMLElementProperties & {
  autofocus?: boolean
  disabled?: boolean
  length?: number
  multiple?: boolean
  name?: string
  required?: boolean
  selectedIndex?: number
  selectedOptions?: HTMLCollectionOf<HTMLOptionElement>
  size?: number
  value?: string
}
```

Added in v1.0.0

## HTMLSourceElementProperties (type alias)

**Signature**

```ts
export type HTMLSourceElementProperties = HTMLElementProperties & {
  media?: string
  msKeySystem?: string
  sizes?: string
  src?: string
  srcset?: string
  type?: string
}
```

Added in v1.0.0

## HTMLSpanElementProperties (type alias)

**Signature**

```ts
export type HTMLSpanElementProperties = HTMLElementProperties
```

Added in v1.0.0

## HTMLStyleElementProperties (type alias)

**Signature**

```ts
export type HTMLStyleElementProperties = HTMLElementProperties & {
  disabled?: boolean
  media?: string
  type?: string
}
```

Added in v1.0.0

## HTMLTableCaptionElementProperties (type alias)

**Signature**

```ts
export type HTMLTableCaptionElementProperties = HTMLElementProperties & {
  align?: string
  vAlign?: string
}
```

Added in v1.0.0

## HTMLTableCellElementProperties (type alias)

**Signature**

```ts
export type HTMLTableCellElementProperties = HTMLElementProperties & {
  abbr?: string
  align?: string
  axis?: string
  bgColor?: any
  colSpan?: number
  headers?: string
  height?: any
  noWrap?: boolean
  rowSpan?: number
  scope?: string
  width?: string
}
```

Added in v1.0.0

## HTMLTableColElementProperties (type alias)

**Signature**

```ts
export type HTMLTableColElementProperties = HTMLElementProperties & {
  align?: string
  span?: number
  width?: any
}
```

Added in v1.0.0

## HTMLTableDataCellElementProperties (type alias)

**Signature**

```ts
export type HTMLTableDataCellElementProperties = HTMLElementProperties
```

Added in v1.0.0

## HTMLTableElementProperties (type alias)

**Signature**

```ts
export type HTMLTableElementProperties = HTMLElementProperties & {
  align?: string
  bgColor?: any
  border?: string
  borderColor?: any
  caption?: HTMLTableCaptionElement
  cellPadding?: string
  cellSpacing?: string
  cols?: number
  frame?: string
  height?: any
  rows?: HTMLCollectionOf<HTMLTableRowElement>
  rules?: string
  summary?: string
  tBodies?: HTMLCollectionOf<HTMLTableSectionElement>
  tFoot?: HTMLTableSectionElement
  tHead?: HTMLTableSectionElement
  width?: string
}
```

Added in v1.0.0

## HTMLTableHeaderCellElementProperties (type alias)

**Signature**

```ts
export type HTMLTableHeaderCellElementProperties = HTMLElementProperties & {
  scope?: string
}
```

Added in v1.0.0

## HTMLTableRowElementProperties (type alias)

**Signature**

```ts
export type HTMLTableRowElementProperties = HTMLElementProperties & {
  align?: string
  bgColor?: any
  cells?: HTMLCollectionOf<HTMLTableDataCellElement | HTMLTableHeaderCellElement>
  height?: any
}
```

Added in v1.0.0

## HTMLTableSectionElementProperties (type alias)

**Signature**

```ts
export type HTMLTableSectionElementProperties = HTMLElementProperties & {
  align?: string
  rows?: HTMLCollectionOf<HTMLTableRowElement>
}
```

Added in v1.0.0

## HTMLTemplateElementProperties (type alias)

**Signature**

```ts
export type HTMLTemplateElementProperties = HTMLElementProperties
```

Added in v1.0.0

## HTMLTextAreaElementProperties (type alias)

**Signature**

```ts
export type HTMLTextAreaElementProperties = HTMLElementProperties & {
  autofocus?: boolean
  cols?: number
  defaultValue?: string
  disabled?: boolean
  maxLength?: number
  minLength?: number
  name?: string
  placeholder?: string
  readOnly?: boolean
  required?: boolean
  rows?: number
  selectionEnd?: number
  selectedStart?: number
  status?: any
  value?: string
  wrap?: string
}
```

Added in v1.0.0

## HTMLTimeElementProperties (type alias)

**Signature**

```ts
export type HTMLTimeElementProperties = HTMLElementProperties & {
  dateTime?: string
}
```

Added in v1.0.0

## HTMLTitleElementProperties (type alias)

**Signature**

```ts
export type HTMLTitleElementProperties = HTMLElementProperties & {
  text?: string
}
```

Added in v1.0.0

## HTMLTrackElementProperties (type alias)

**Signature**

```ts
export type HTMLTrackElementProperties = HTMLElementProperties & {
  default?: boolean
  kind?: string
  label?: string
  src?: string
  srclang?: string
}
```

Added in v1.0.0

## HTMLUListElementProperties (type alias)

**Signature**

```ts
export type HTMLUListElementProperties = HTMLElementProperties & {
  compact?: boolean
  type?: string
}
```

Added in v1.0.0

## HTMLUnknownElementProperties (type alias)

**Signature**

```ts
export type HTMLUnknownElementProperties = HTMLElementProperties
```

Added in v1.0.0

## HTMLVideoElementProperties (type alias)

**Signature**

```ts
export type HTMLVideoElementProperties = HTMLElementProperties & {
  height?: number
  msHorizontalMirror?: boolean
  msStereo3DPackingMode?: string
  msStereo3DRenderMode?: string
  msZoom?: boolean
  poster?: string
  width?: number
}
```

Added in v1.0.0
