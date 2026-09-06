import {
  bind,
  bindTo,
  catchAll,
  catchTag,
  type Guard,
  liftPredicate,
  map,
  provideService,
  provideServiceEffect,
} from "@typed/guard";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import { describe, expect, it } from "vitest";

describe("public documentation examples", () => {
  it("recovers a Guard with an actual typed error channel", async () => {
    type ParseError = { readonly _tag: "ParseError"; readonly input: string };
    const integer: Guard<string, number, ParseError> = (input) => {
      const value = Number(input);
      return Number.isInteger(value)
        ? Effect.succeedSome(value)
        : Effect.fail({ _tag: "ParseError", input });
    };

    const recoveredAll = catchAll(integer, () => Effect.succeed(0));
    const recoveredTag = catchTag(integer, "ParseError", ({ input }) =>
      Effect.succeed(input.length),
    );

    expect(await Effect.runPromise(recoveredAll("nope"))).toEqual(Option.some(0));
    expect(await Effect.runPromise(recoveredTag("nope"))).toEqual(Option.some(4));
  });

  it("provides a service that the Guard actually requires", async () => {
    const Offset = Context.Service<{ readonly amount: number }>("Docs/Offset");
    const addOffset: Guard<number, number, never, Context.Service.Identifier<typeof Offset>> = (
      input,
    ) => Effect.map(Effect.service(Offset), ({ amount }) => Option.some(input + amount));

    const direct = provideService(addOffset, Offset, { amount: 2 });
    const effectful = provideServiceEffect(addOffset, Offset, Effect.succeed({ amount: 3 }));

    expect(await Effect.runPromise(direct(1))).toEqual(Option.some(3));
    expect(await Effect.runPromise(effectful(1))).toEqual(Option.some(4));
  });

  it("binds only when the dependent predicate returns a boolean match", async () => {
    const text = bindTo(
      liftPredicate((input: unknown): input is string => typeof input === "string"),
      "text",
    );
    const nonEmptyLength = map(
      liftPredicate((record: { readonly text: string }) => record.text.length > 0),
      (record) => record.text.length,
    );
    const sized = bind(text, "length", nonEmptyLength);

    expect(await Effect.runPromise(sized("typed"))).toEqual(
      Option.some({ text: "typed", length: 5 }),
    );
    expect(await Effect.runPromise(sized(""))).toEqual(Option.none());
  });
});
