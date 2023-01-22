let __isFirstRender = true

// A helper for determining if we should attempt to use hydration for
// frameworks which support it.
export function isFirstRender() {
  const x = __isFirstRender

  __isFirstRender = false

  return x
}
