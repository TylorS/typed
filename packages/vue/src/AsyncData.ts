import * as Data from "@typed/async-data";
import type * as Cause from "effect/Cause";
import * as Option from "effect/Option";
import { computed, shallowRef, watch, type ComputedRef, type ShallowRef } from "vue";

/** Vue projections of AsyncData. The latest available value survives refreshes and later failures. */
export interface AsyncDataView<A, E> {
  readonly data: Readonly<ShallowRef<Data.AsyncData<A, E>>>;
  readonly value: ComputedRef<Option.Option<A>>;
  readonly latest: ComputedRef<Option.Option<A>>;
  readonly cause: ComputedRef<Option.Option<Cause.Cause<E>>>;
  readonly error: ComputedRef<Option.Option<E>>;
  readonly loading: ComputedRef<boolean>;
  readonly refreshing: ComputedRef<boolean>;
  readonly pending: ComputedRef<boolean>;
  readonly success: ComputedRef<boolean>;
  readonly failure: ComputedRef<boolean>;
}

/** Derive display state without starting another Effect subscription. */
export function useAsyncData<A, E>(
  data: Readonly<ShallowRef<Data.AsyncData<A, E>>>,
): AsyncDataView<A, E> {
  const latest = shallowRef<Option.Option<A>>(Option.none());

  watch(
    data,
    (next) => {
      const available = Data.getSuccess(next);
      if (Option.isSome(available)) latest.value = available;
    },
    { immediate: true, flush: "sync" },
  );

  return {
    data,
    value: computed(() => Data.getSuccess(data.value)),
    latest: computed(() => latest.value),
    cause: computed(() => Data.getCause(data.value)),
    error: computed(() => Data.getError(data.value)),
    loading: computed(() => Data.isLoading(data.value)),
    refreshing: computed(() => Data.isRefreshing(data.value)),
    pending: computed(() => Data.isPending(data.value)),
    success: computed(() => Data.isSuccess(data.value)),
    failure: computed(() => Data.isFailure(data.value)),
  };
}
