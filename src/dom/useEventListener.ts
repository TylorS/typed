import { Env } from '@fp/Env'
import { CurrentFiber } from '@fp/Fiber'
import { useDisposable } from '@fp/hooks'
import { Disposable } from '@fp/Stream'

export type EventListenerOrEventListenerObject<A = Event, That = EventTarget> =
  | ((event: A) => void)
  | {
      readonly handleEvent: (this: That, event: A) => void
    }

export function useEventListener<
  Element extends HTMLElementTagNameMap[keyof HTMLElementTagNameMap],
  Event extends keyof HTMLElementTagNameMap,
  Events = HTMLElementTagNameMap,
>(
  target: Element,
  type: Event,
  listener: EventListenerOrEventListenerObject<HTMLElementTagNameMap[Event], Element>,
  options?: AddEventListenerOptions,
): Env<CurrentFiber, Disposable>

export function useEventListener<
  Element extends SVGElementTagNameMap[keyof SVGElementTagNameMap],
  Event extends keyof SVGElementTagNameMap,
  Events = SVGElementTagNameMap,
>(
  target: Element,
  type: Event,
  listener: EventListenerOrEventListenerObject<SVGElementTagNameMap[Event], Element>,
  options?: AddEventListenerOptions,
): Env<CurrentFiber, Disposable>

export function useEventListener<Event extends keyof DocumentEventMap>(
  target: Document,
  type: Event,
  listener: EventListenerOrEventListenerObject<DocumentEventMap[Event], Document>,
  options?: AddEventListenerOptions,
): Env<CurrentFiber, Disposable>

export function useEventListener<Event extends keyof WindowEventMap>(
  target: Window,
  type: Event,
  listener: EventListenerOrEventListenerObject<WindowEventMap[Event], Window>,
  options?: AddEventListenerOptions,
): Env<CurrentFiber, Disposable>

export function useEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
): Env<CurrentFiber, Disposable>

export function useEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject<any, any>,
  options?: AddEventListenerOptions,
): Env<CurrentFiber, Disposable> {
  return useDisposable(() => {
    target.addEventListener(type, listener, options)

    return {
      dispose: () => target.removeEventListener(type, listener, options),
    }
  }, [target, listener, options])
}
