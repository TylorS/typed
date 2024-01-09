export const requestIdleCallback = globalThis.requestIdleCallback || requestIdleCallbackFallbackToSetTimeout

export const cancelIdleCallback = globalThis.cancelIdleCallback || clearTimeout

function requestIdleCallbackFallbackToSetTimeout(cb: IdleRequestCallback, options?: IdleRequestOptions) {
  return setTimeout(() => cb(makeIdleDeadline(Date.now(), options?.timeout)), 0)
}

function makeIdleDeadline(start: number, timeout?: number) {
  const end = timeout === undefined ? Infinity : start + timeout
  const timeRemaining = () => Math.max(0, 50 - (Date.now() - start))

  return {
    get didTimeout() {
      return Date.now() >= end
    },
    timeRemaining
  }
}
