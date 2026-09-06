import { Effect, Option } from "effect";
import * as Guard from "@typed/guard";
import * as Schema from "effect/Schema";

const Positive = Schema.Finite.check(Schema.isGreaterThan(0));
const positive = Guard.fromSchemaDecode(Positive);

const program = positive(42).pipe(
  Effect.map(
    Option.match({
      onNone: () => "not a positive number",
      onSome: (n) => `ok: ${n}`,
    }),
  ),
);

const result = await Effect.runPromise(program);
console.log(result); // "ok: 42"

const even = Guard.liftPredicate((n: number) => n % 2 === 0);
const positiveEven = Guard.pipe(positive, even);

void positiveEven;
