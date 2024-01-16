/**
 * @since 1.0.0
 */

/**
 * @since 1.0.0
 */
export type ElementProperties = {
  className?: string | null | undefined
  id?: string | null | undefined
  scrollLeft?: number | null | undefined
  scrollTop?: number | null | undefined
  slot?: string | null | undefined
}

/**
 * @since 1.0.0
 */
export type HTMLElementProperties =
  & ElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLAnchorElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLAppletElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLAreaElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLAudioElementProperties = HTMLElementProperties

/**
 * @since 1.0.0
 */
export type HTMLBRElementProperties =
  & HTMLElementProperties
  & {
    clear?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLBaseElementProperties =
  & HTMLElementProperties
  & {
    href?: string
    target?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLBaseFontElementProperties =
  & HTMLElementProperties
  & {
    face?: string
    size?: number
  }

/**
 * @since 1.0.0
 */
export type HTMLBodyElementProperties =
  & HTMLElementProperties
  & {
    aLink?: any
    background?: string
    bgColor?: any
    bgProperties?: string
    link?: any
    noWrap?: boolean
    text?: any
    vLink?: any
  }

/**
 * @since 1.0.0
 */
export type HTMLButtonElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLCanvasElementProperties =
  & HTMLElementProperties
  & {
    height?: number
    width?: number
  }

/**
 * @since 1.0.0
 */
export type HTMLDListElementProperties =
  & HTMLElementProperties
  & {
    compact?: boolean
  }

/**
 * @since 1.0.0
 */
export type HTMLDataElementProperties =
  & HTMLElementProperties
  & {
    value?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLDataListElementProperties =
  & HTMLElementProperties
  & {
    options?: HTMLCollectionOf<HTMLOptionElement>
  }

/**
 * @since 1.0.0
 */
export type HTMLDirectoryElementProperties =
  & HTMLElementProperties
  & {
    compact?: boolean
  }

/**
 * @since 1.0.0
 */
export type HTMLDivElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    noWrap?: boolean
  }

/**
 * @since 1.0.0
 */
export type HTMLEmbedElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLFieldSetElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    disabled?: boolean
    name?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLFontElementProperties =
  & HTMLElementProperties
  & {
    face?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLFormElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLFrameElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLFrameSetElementProperties =
  & HTMLElementProperties
  & {
    border?: string
    borderColor?: string
    cols?: string
    frameBorder?: string
    frameSpacing?: any
    name?: string
    rows?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLHRElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    noShade?: boolean
    width?: number
  }

/**
 * @since 1.0.0
 */
export type HTMLHeadElementProperties =
  & HTMLElementProperties
  & {
    profile?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLHeadingElementProperties =
  & HTMLElementProperties
  & {
    align?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLHtmlElementProperies =
  & HTMLElementProperties
  & {
    version?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLIFrameElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLImageElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLInputElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLLIElementProperties =
  & HTMLElementProperties
  & {
    type?: string
    value?: number
  }

/**
 * @since 1.0.0
 */
export type HTMLLabelElementProperties =
  & HTMLElementProperties
  & {
    htmlFor?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLLegendElementProperties =
  & HTMLElementProperties
  & {
    align?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLLinkElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLMapElementProperties =
  & HTMLElementProperties
  & {
    name?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLMarqueeElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLMediaElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLMenuElementProperties =
  & HTMLElementProperties
  & {
    compact?: boolean
    type?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLMetaElementProperties =
  & HTMLElementProperties
  & {
    charset?: string
    content?: string
    httpEquiv?: string
    name?: string
    scheme?: string
    url?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLMeterElementProperties =
  & HTMLElementProperties
  & {
    high?: number
    low?: number
    max?: number
    min?: number
    optimum?: number
    value?: number
  }

/**
 * @since 1.0.0
 */
export type HTMLModElementProperties =
  & HTMLElementProperties
  & {
    cite?: string
    dateTime?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLOListElementProperteis =
  & HTMLElementProperties
  & {
    compact?: boolean
    start?: number
    type?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLObjectElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLOptGroupElementProperties =
  & HTMLElementProperties
  & {
    defaultSelected?: boolean
    disabled?: boolean
    label?: string
    selected?: boolean
    value?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLOptionElementProperties =
  & HTMLElementProperties
  & {
    defaultSelected?: boolean
    disabled?: boolean
    label?: string
    selected?: boolean
    text?: string
    value?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLOutputElementProperties =
  & HTMLElementProperties
  & {
    defaultValue?: string
    name?: string
    value?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLParagraphElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    clear?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLParamElementProperties =
  & HTMLElementProperties
  & {
    name?: string
    type?: string
    value?: string
    valueType?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLPreElementProperties =
  & HTMLElementProperties
  & {
    width?: number
  }

/**
 * @since 1.0.0
 */
export type HTMLProgressElementProperties =
  & HTMLElementProperties
  & {
    max?: number
    value?: number
  }

/**
 * @since 1.0.0
 */
export type HTMLQuoteElementProperties =
  & HTMLElementProperties
  & {
    cite?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLScriptElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLSelectElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLSourceElementProperties =
  & HTMLElementProperties
  & {
    media?: string
    msKeySystem?: string
    sizes?: string
    src?: string
    srcset?: string
    type?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLSpanElementProperties = HTMLElementProperties

/**
 * @since 1.0.0
 */
export type HTMLStyleElementProperties =
  & HTMLElementProperties
  & {
    disabled?: boolean
    media?: string
    type?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLTableCaptionElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    vAlign?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLTableCellElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLTableColElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    span?: number
    width?: any
  }

/**
 * @since 1.0.0
 */
export type HTMLTableDataCellElementProperties = HTMLElementProperties

/**
 * @since 1.0.0
 */
export type HTMLTableElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLTableHeaderCellElementProperties =
  & HTMLElementProperties
  & {
    scope?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLTableRowElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    bgColor?: any
    cells?: HTMLCollectionOf<HTMLTableDataCellElement | HTMLTableHeaderCellElement>
    height?: any
  }

/**
 * @since 1.0.0
 */
export type HTMLTableSectionElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    rows?: HTMLCollectionOf<HTMLTableRowElement>
  }

/**
 * @since 1.0.0
 */
export type HTMLTemplateElementProperties = HTMLElementProperties

/**
 * @since 1.0.0
 */
export type HTMLTextAreaElementProperties =
  & HTMLElementProperties
  & {
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

/**
 * @since 1.0.0
 */
export type HTMLTimeElementProperties =
  & HTMLElementProperties
  & {
    dateTime?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLTitleElementProperties =
  & HTMLElementProperties
  & {
    text?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLTrackElementProperties =
  & HTMLElementProperties
  & {
    default?: boolean
    kind?: string
    label?: string
    src?: string
    srclang?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLUListElementProperties =
  & HTMLElementProperties
  & {
    compact?: boolean
    type?: string
  }

/**
 * @since 1.0.0
 */
export type HTMLUnknownElementProperties = HTMLElementProperties

/**
 * @since 1.0.0
 */
export type HTMLVideoElementProperties =
  & HTMLElementProperties
  & {
    height?: number
    msHorizontalMirror?: boolean
    msStereo3DPackingMode?: string
    msStereo3DRenderMode?: string
    msZoom?: boolean
    poster?: string
    width?: number
  }

/**
 * @since 1.0.0
 */
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
