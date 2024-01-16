---
title: Anchor.ts
nav_order: 1
parent: "@typed/ui"
---

## Anchor overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Anchor](#anchor)
  - [AnchorProps (type alias)](#anchorprops-type-alias)

---

# utils

## Anchor

**Signature**

```ts
export declare const Anchor: Component<
  {
    readonly className?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly id?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly scrollLeft?: number | Placeholder.Any<number | null | undefined> | null | undefined
    readonly scrollTop?: number | Placeholder.Any<number | null | undefined> | null | undefined
    readonly slot?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly accessKey?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly contentEditable?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly dir?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly draggable?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly hidden?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly hideFocus?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly lang?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly spellcheck?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly tabIndex?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly title?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly Methods?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly charset?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly coords?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly download?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly hash?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly host?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly hostname?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly href?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly hreflang?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly name?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly pathname?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly port?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly protocol?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly rel?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly rev?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly search?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly shape?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly target?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly text?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly type?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly urn?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly "?draggable"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly "?hidden"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly "?hideFocus"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly "?spellcheck"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly "?tabIndex"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly ".className"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".id"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".scrollLeft"?: number | Placeholder.Any<number | null | undefined> | null | undefined
    readonly ".scrollTop"?: number | Placeholder.Any<number | null | undefined> | null | undefined
    readonly ".slot"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".accessKey"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".contentEditable"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".dir"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".draggable"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly ".hidden"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly ".hideFocus"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly ".lang"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".spellcheck"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly ".tabIndex"?: boolean | Placeholder.Any<boolean | null | undefined> | null | undefined
    readonly ".title"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".Methods"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".charset"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".coords"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".download"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".hash"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".host"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".hostname"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".href"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".hreflang"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".name"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".pathname"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".port"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".protocol"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".rel"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".rev"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".search"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".shape"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".target"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".text"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".type"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly ".urn"?: string | Placeholder.Any<string | null | undefined> | null | undefined
    readonly onFullscreenchange?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onFullscreenerror?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onAbort?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, UIEvent>>
      | null
      | undefined
    readonly onAnimationcancel?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, AnimationEvent>>
      | null
      | undefined
    readonly onAnimationend?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, AnimationEvent>>
      | null
      | undefined
    readonly onAnimationiteration?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, AnimationEvent>>
      | null
      | undefined
    readonly onAnimationstart?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, AnimationEvent>>
      | null
      | undefined
    readonly onAuxclick?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onBeforeinput?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, InputEvent>>
      | null
      | undefined
    readonly onBlur?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, FocusEvent>>
      | null
      | undefined
    readonly onCancel?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onCanplay?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onCanplaythrough?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onChange?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onClick?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onClose?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onCompositionend?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, CompositionEvent>>
      | null
      | undefined
    readonly onCompositionstart?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, CompositionEvent>>
      | null
      | undefined
    readonly onCompositionupdate?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, CompositionEvent>>
      | null
      | undefined
    readonly onContextmenu?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onCopy?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, ClipboardEvent>>
      | null
      | undefined
    readonly onCuechange?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onCut?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, ClipboardEvent>>
      | null
      | undefined
    readonly onDblclick?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onDrag?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, DragEvent>>
      | null
      | undefined
    readonly onDragend?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, DragEvent>>
      | null
      | undefined
    readonly onDragenter?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, DragEvent>>
      | null
      | undefined
    readonly onDragleave?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, DragEvent>>
      | null
      | undefined
    readonly onDragover?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, DragEvent>>
      | null
      | undefined
    readonly onDragstart?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, DragEvent>>
      | null
      | undefined
    readonly onDrop?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, DragEvent>>
      | null
      | undefined
    readonly onDurationchange?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onEmptied?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onEnded?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onError?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, ErrorEvent>>
      | null
      | undefined
    readonly onFocus?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, FocusEvent>>
      | null
      | undefined
    readonly onFocusin?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, FocusEvent>>
      | null
      | undefined
    readonly onFocusout?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, FocusEvent>>
      | null
      | undefined
    readonly onFormdata?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, FormDataEvent>>
      | null
      | undefined
    readonly onGotpointercapture?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onInput?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onInvalid?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onKeydown?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, KeyboardEvent>>
      | null
      | undefined
    readonly onKeypress?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, KeyboardEvent>>
      | null
      | undefined
    readonly onKeyup?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, KeyboardEvent>>
      | null
      | undefined
    readonly onLoad?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onLoadeddata?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onLoadedmetadata?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onLoadstart?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onLostpointercapture?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onMousedown?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onMouseenter?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onMouseleave?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onMousemove?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onMouseout?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onMouseover?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onMouseup?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>>
      | null
      | undefined
    readonly onPaste?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, ClipboardEvent>>
      | null
      | undefined
    readonly onPause?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onPlay?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onPlaying?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onPointercancel?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onPointerdown?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onPointerenter?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onPointerleave?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onPointermove?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onPointerout?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onPointerover?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onPointerup?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, PointerEvent>>
      | null
      | undefined
    readonly onProgress?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, ProgressEvent<EventTarget>>>
      | null
      | undefined
    readonly onRatechange?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onReset?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onResize?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, UIEvent>>
      | null
      | undefined
    readonly onScroll?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onScrollend?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onSecuritypolicyviolation?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, SecurityPolicyViolationEvent>>
      | null
      | undefined
    readonly onSeeked?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onSeeking?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onSelect?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onSelectionchange?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onSelectstart?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onSlotchange?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onStalled?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onSubmit?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, SubmitEvent>>
      | null
      | undefined
    readonly onSuspend?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onTimeupdate?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onToggle?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onTouchcancel?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, TouchEvent>>
      | null
      | undefined
    readonly onTouchend?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, TouchEvent>>
      | null
      | undefined
    readonly onTouchmove?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, TouchEvent>>
      | null
      | undefined
    readonly onTouchstart?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, TouchEvent>>
      | null
      | undefined
    readonly onTransitioncancel?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, TransitionEvent>>
      | null
      | undefined
    readonly onTransitionend?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, TransitionEvent>>
      | null
      | undefined
    readonly onTransitionrun?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, TransitionEvent>>
      | null
      | undefined
    readonly onTransitionstart?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, TransitionEvent>>
      | null
      | undefined
    readonly onVolumechange?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onWaiting?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onWebkitanimationend?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onWebkitanimationiteration?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onWebkitanimationstart?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onWebkittransitionend?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, Event>>
      | null
      | undefined
    readonly onWheel?:
      | Effect<any, any, unknown>
      | EventHandler<any, any, EventWithCurrentTarget<HTMLAnchorElement, WheelEvent>>
      | null
      | undefined
    readonly ref?: ElementRef<HTMLAnchorElement> | undefined
    readonly data?: Placeholder.Any<ReadonlyRecord<any>> | undefined
  },
  never,
  never
>
```

Added in v1.0.0

## AnchorProps (type alias)

**Signature**

```ts
export type AnchorProps = TypedProps<HTMLAnchorElementProperties, HTMLAnchorElement>
```

Added in v1.0.0
