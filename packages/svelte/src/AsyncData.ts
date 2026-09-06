import * as AsyncData from "@typed/async-data";
import type * as Cause from "effect/Cause";
import * as Option from "effect/Option";
import { derived, type Readable } from "svelte/store";

/** Native stores describing one async producer and its last available value. */
export interface AsyncState<A, E> {
  readonly data: Readable<AsyncData.AsyncData<A, E>>;
  readonly value: Readable<Option.Option<A>>;
  readonly latest: Readable<Option.Option<A>>;
  readonly cause: Readable<Option.Option<Cause.Cause<E>>>;
  readonly error: Readable<Option.Option<E>>;
  readonly pending: Readable<boolean>;
  readonly loading: Readable<boolean>;
  readonly refreshing: Readable<boolean>;
  readonly success: Readable<boolean>;
  readonly failure: Readable<boolean>;
  readonly optimistic: Readable<boolean>;
  readonly refresh: () => void;
  readonly cancel: () => void;
}

/** Derives status from Typed AsyncData, including optimistic and refreshing states. */
export function asyncState<A, E>(
  data: Readable<AsyncData.AsyncData<A, E>>,
  controls: Pick<AsyncState<A, E>, "refresh" | "cancel"> = { refresh: () => {}, cancel: () => {} },
): AsyncState<A, E> {
  let latest: Option.Option<A> = Option.none();

  // Share one projection, so `latest` advances even when only another field is subscribed.
  const snapshot = derived(data, (state) => {
    const value = AsyncData.getSuccess(state);
    if (Option.isSome(value)) latest = value;

    return { state, value, latest };
  });

  return {
    data: derived(snapshot, (s) => s.state),
    value: derived(snapshot, (s) => s.value),
    latest: derived(snapshot, (s) => s.latest),
    cause: derived(snapshot, (s) => AsyncData.getCause(s.state)),
    error: derived(snapshot, (s) => AsyncData.getError(s.state)),
    pending: derived(snapshot, (s) => AsyncData.isPending(s.state)),
    loading: derived(snapshot, (s) => AsyncData.isLoading(s.state)),
    refreshing: derived(snapshot, (s) => AsyncData.isRefreshing(s.state)),
    success: derived(snapshot, (s) => AsyncData.isSuccess(s.state)),
    failure: derived(snapshot, (s) => AsyncData.isFailure(s.state)),
    optimistic: derived(snapshot, (s) => AsyncData.isOptimistic(s.state)),
    ...controls,
  };
}
