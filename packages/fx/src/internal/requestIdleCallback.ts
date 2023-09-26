export const requestIdleCallback = globalThis.requestIdleCallback || requestIdleCallbackFallbackToSetTimeout

export const cancelIdleCallback = globalThis.cancelIdleCallback || clearTimeout

function requestIdleCallbackFallbackToSetTimeout(cb: IdleRequestCallback, options?: IdleRequestOptions) {
  return setTimeout(() => cb(makeIdleDeadline(Date.now(), options)), 1)
}
function makeIdleDeadline(start: number, options?: IdleRequestOptions) {
  const timeout = options?.timeout ?? 50

  const timeRemaining = () => Math.max(0, timeout - (Date.now() - start))

  return {
    get didTimeout() {
      return timeRemaining() < 0
    },
    timeRemaining
  }
}
