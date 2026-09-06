export interface CachedResource<A> {
  readonly read: () => Promise<A>;
  readonly retain: () => () => void;
}

/** Caches one lazy request and keeps it alive through React StrictMode replays. */
export function cachedResource<A>(
  load: (signal: AbortSignal) => Promise<A>,
  externalSignal?: AbortSignal,
): CachedResource<A> {
  const controller = new AbortController();
  const signal = externalSignal
    ? AbortSignal.any([externalSignal, controller.signal])
    : controller.signal;
  let promise: Promise<A> | undefined;
  let owners = 0;

  return {
    read: () => (promise ??= load(signal)),
    retain: () => {
      owners++;
      let released = false;

      return () => {
        if (released) return;
        released = true;
        owners--;

        queueMicrotask(() => {
          if (owners === 0) controller.abort();
        });
      };
    },
  };
}
