export const requestIdleCallback = globalThis.requestIdleCallback || requestIdleCallbackFallbackToSetTimeout

export const cancelIdleCallback = globalThis.cancelIdleCallback || clearTimeout

function requestIdleCallbackFallbackToSetTimeout(cb: IdleRequestCallback) {
  return setTimeout(() => cb(makeIdleDeadline(Date.now())), 0)
}

function makeIdleDeadline(start: number) {
  const timeRemaining = () => Math.max(0, 50 - (Date.now() - start))

  return {
    didTimeout: false,
    timeRemaining
  }
}
