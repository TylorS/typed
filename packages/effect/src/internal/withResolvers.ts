export function withResolvers<A>(): ReturnType<typeof Promise.withResolvers<A>> {
  let resolve: (a: A | PromiseLike<A>) => void
  let reject: (e: any) => void
  const promise = new Promise<A>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve: resolve!, reject: reject! }
}
