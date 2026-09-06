import { flatMap, type AsyncData, type Optimistic, type Success } from "@typed/async-data";
import type { Assert, Equal } from "./assert.type-test.js";

type ExistingError = { readonly _tag: "ExistingError" };
type NextError = { readonly _tag: "NextError" };

declare const input: AsyncData<number, ExistingError>;
declare const next: AsyncData<string, NextError>;

const direct = flatMap(input, (value, data) => {
  type _Value = Assert<Equal<typeof value, number>>;
  type _Context = Assert<Equal<typeof data, Success<number> | Optimistic<number, ExistingError>>>;
  return next;
});

const curried = flatMap((value: number, data) => {
  type _Value = Assert<Equal<typeof value, number>>;
  type _Context = Assert<Equal<typeof data, Success<number> | Optimistic<number, unknown>>>;
  return next;
})(input);

type Expected = AsyncData<string, ExistingError | NextError>;
type _Direct = Assert<Equal<typeof direct, Expected>>;
type _Curried = Assert<Equal<typeof curried, Expected>>;

// @ts-expect-error flatMap must retain the callback's error channel
const _directWithoutNextError: AsyncData<string, ExistingError> = direct;
// @ts-expect-error flatMap must retain the input's error channel
const _curriedWithoutExistingError: AsyncData<string, NextError> = curried;
