export type ElementProperties = {
  className?: string | undefined
  id?: string | undefined
  scrollLeft?: number | undefined
  scrollTop?: number | undefined
  slot?: string | undefined
}

export type HTMLElementProperties =
  & ElementProperties
  & {
    accessKey?: string | undefined
    contentEditable?: string | undefined
    dir?: string | undefined
    draggable?: boolean | undefined
    hidden?: boolean | undefined
    hideFocus?: boolean | undefined
    lang?: string | undefined
    spellcheck?: boolean | undefined
    tabIndex?: boolean | undefined
    title?: string | undefined
  }

export type HTMLAnchorElementProperties =
  & HTMLElementProperties
  & {
    Methods?: string | undefined
    charset?: string | undefined
    coords?: string | undefined
    download?: string | undefined
    hash?: string | undefined
    host?: string | undefined
    hostname?: string | undefined
    href?: string | undefined
    hreflang?: string | undefined
    name?: string | undefined
    pathname?: string | undefined
    port?: string | undefined
    protocol?: string | undefined
    rel?: string | undefined
    rev?: string | undefined
    search?: string | undefined
    shape?: string | undefined
    target?: string | undefined
    text?: string | undefined
    type?: string | undefined
    urn?: string | undefined
  }

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

export type HTMLAudioElementProperties = HTMLElementProperties

export type HTMLBRElementProperties =
  & HTMLElementProperties
  & {
    clear?: string
  }

export type HTMLBaseElementProperties =
  & HTMLElementProperties
  & {
    href?: string
    target?: string
  }

export type HTMLBaseFontElementProperties =
  & HTMLElementProperties
  & {
    face?: string
    size?: number
  }

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

export type HTMLCanvasElementProperties =
  & HTMLElementProperties
  & {
    height?: number
    width?: number
  }

export type HTMLDListElementProperties =
  & HTMLElementProperties
  & {
    compact?: boolean
  }

export type HTMLDataElementProperties =
  & HTMLElementProperties
  & {
    value?: string
  }

export type HTMLDataListElementProperties =
  & HTMLElementProperties
  & {
    options?: HTMLCollectionOf<HTMLOptionElement>
  }

export type HTMLDirectoryElementProperties =
  & HTMLElementProperties
  & {
    compact?: boolean
  }

export type HTMLDivElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    noWrap?: boolean
  }

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

export type HTMLFieldSetElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    disabled?: boolean
    name?: string
  }

export type HTMLFontElementProperties =
  & HTMLElementProperties
  & {
    face?: string
  }

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

export type HTMLHRElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    noShade?: boolean
    width?: number
  }

export type HTMLHeadElementProperties =
  & HTMLElementProperties
  & {
    profile?: string
  }

export type HTMLHeadingElementProperties =
  & HTMLElementProperties
  & {
    align?: string
  }

export type HTMLHtmlElementProperies =
  & HTMLElementProperties
  & {
    version?: string
  }

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

export type HTMLLIElementProperties =
  & HTMLElementProperties
  & {
    type?: string
    value?: number
  }

export type HTMLLabelElementProperties =
  & HTMLElementProperties
  & {
    htmlFor?: string
  }

export type HTMLLegendElementProperties =
  & HTMLElementProperties
  & {
    align?: string
  }

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

export type HTMLMapElementProperties =
  & HTMLElementProperties
  & {
    name?: string
  }

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

export type HTMLMenuElementProperties =
  & HTMLElementProperties
  & {
    compact?: boolean
    type?: string
  }

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

export type HTMLModElementProperties =
  & HTMLElementProperties
  & {
    cite?: string
    dateTime?: string
  }

export type HTMLOListElementProperteis =
  & HTMLElementProperties
  & {
    compact?: boolean
    start?: number
    type?: string
  }

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

export type HTMLOptGroupElementProperties =
  & HTMLElementProperties
  & {
    defaultSelected?: boolean
    disabled?: boolean
    label?: string
    selected?: boolean
    value?: string
  }

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

export type HTMLOutputElementProperties =
  & HTMLElementProperties
  & {
    defaultValue?: string
    name?: string
    value?: string
  }

export type HTMLParagraphElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    clear?: string
  }

export type HTMLParamElementProperties =
  & HTMLElementProperties
  & {
    name?: string
    type?: string
    value?: string
    valueType?: string
  }

export type HTMLPreElementProperties =
  & HTMLElementProperties
  & {
    width?: number
  }

export type HTMLProgressElementProperties =
  & HTMLElementProperties
  & {
    max?: number
    value?: number
  }

export type HTMLQuoteElementProperties =
  & HTMLElementProperties
  & {
    cite?: string
  }

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

export type HTMLSpanElementProperties = HTMLElementProperties

export type HTMLStyleElementProperties =
  & HTMLElementProperties
  & {
    disabled?: boolean
    media?: string
    type?: string
  }

export type HTMLTableCaptionElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    vAlign?: string
  }

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

export type HTMLTableColElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    span?: number
    width?: any
  }

export type HTMLTableDataCellElementProperties = HTMLElementProperties

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

export type HTMLTableHeaderCellElementProperties =
  & HTMLElementProperties
  & {
    scope?: string
  }

export type HTMLTableRowElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    bgColor?: any
    cells?: HTMLCollectionOf<HTMLTableDataCellElement | HTMLTableHeaderCellElement>
    height?: any
  }

export type HTMLTableSectionElementProperties =
  & HTMLElementProperties
  & {
    align?: string
    rows?: HTMLCollectionOf<HTMLTableRowElement>
  }

export type HTMLTemplateElementProperties = HTMLElementProperties

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

export type HTMLTimeElementProperties =
  & HTMLElementProperties
  & {
    dateTime?: string
  }

export type HTMLTitleElementProperties =
  & HTMLElementProperties
  & {
    text?: string
  }

export type HTMLTrackElementProperties =
  & HTMLElementProperties
  & {
    default?: boolean
    kind?: string
    label?: string
    src?: string
    srclang?: string
  }

export type HTMLUListElementProperties =
  & HTMLElementProperties
  & {
    compact?: boolean
    type?: string
  }

export type HTMLUnknownElementProperties = HTMLElementProperties

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
