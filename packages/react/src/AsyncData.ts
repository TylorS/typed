import type { ReactNode } from "react";
import * as Data from "@typed/async-data";
import type * as Cause from "effect/Cause";
import * as Option from "effect/Option";

/** A framework-independent snapshot; the hook provides refresh and cancellation separately. */
export interface AsyncDataView<A, E> {
  readonly data: Data.AsyncData<A, E>;
  readonly value: Option.Option<A>;
  readonly latest: Option.Option<A>;
  readonly cause: Option.Option<Cause.Cause<E>>;
  readonly error: Option.Option<E>;
  readonly pending: boolean;
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly success: boolean;
  readonly failure: boolean;
}

/** Derives values without losing Typed AsyncData causes or optimistic/refreshing states. */
export function asyncDataView<A, E>(
  data: Data.AsyncData<A, E>,
  latest = Data.getSuccess(data),
): AsyncDataView<A, E> {
  return {
    data,
    value: Data.getSuccess(data),
    latest,
    cause: Data.getCause(data),
    error: Data.getError(data),
    pending: Data.isPending(data),
    loading: Data.isLoading(data),
    refreshing: Data.isRefreshing(data),
    success: Data.isSuccess(data),
    failure: Data.isFailure(data),
  };
}

export interface AsyncDataProps<A, E> {
  readonly data: Data.AsyncData<A, E>;
  readonly children: (value: A, state: AsyncDataView<A, E>) => ReactNode;
  readonly failure: (cause: Cause.Cause<E>, state: AsyncDataView<A, E>) => ReactNode;
  readonly loading?: ReactNode;
  readonly noData?: ReactNode;
}

/** Keeps the current value visible during refresh and supplies status to render functions. */
export function AsyncData<A, E>({
  data,
  children,
  failure,
  loading = null,
  noData = null,
}: AsyncDataProps<A, E>): ReactNode {
  const state = asyncDataView(data);

  if (Option.isSome(state.value)) return children(state.value.value, state);
  if (Option.isSome(state.cause)) return failure(state.cause.value, state);

  return state.pending ? loading : noData;
}
