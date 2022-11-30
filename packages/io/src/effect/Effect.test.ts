/**
 * const program = pipe(
 *   Effect.of(0),
 *   Effect.match(() => E.unexpected('error'), (n) => Effect.of(n + 1)),
 *   Effect.recurring(100_000),
 *   Effect.timed,
 * )
 *
 * Effect.run(program).then(time => console.log(`${time} ms`)).catch(console.error)
 */
