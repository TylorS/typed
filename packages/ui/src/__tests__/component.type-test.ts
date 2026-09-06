import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { Fx } from "@typed/fx";
import { html, type RenderEvent, type RenderTemplate } from "@typed/template";
import { component } from "../index.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type SetupService = { readonly SetupService: unique symbol };
type ContentService = { readonly ContentService: unique symbol };

declare const setup: Effect.Effect<string, "setup-error", SetupService>;
declare const content: Effect.Effect<string, "content-error", ContentService>;

const StaticGreeting = component(function* () {
  const name = yield* setup;
  return [html`<strong>Hello, ${name}</strong>`, content] as const;
});

type _StaticComponentSuccess = Assert<
  Equal<Fx.Success<typeof StaticGreeting>, readonly [RenderEvent, string]>
>;
type _StaticComponentErrors = Assert<
  Equal<Fx.Error<typeof StaticGreeting>, "setup-error" | "content-error">
>;
type _StaticComponentServices = Assert<
  Equal<
    Fx.Services<typeof StaticGreeting>,
    SetupService | ContentService | Scope.Scope | RenderTemplate
  >
>;

// @ts-expect-error zero-arity components are Fx values, not functions
StaticGreeting();

const PipedStaticGreeting = component(
  // oxlint-disable-next-line require-yield
  function* () {
    return "Hello" as const;
  },
  Fx.map((value) => value.length),
  Fx.map((value) => value > 0),
  Fx.map((value) => (value ? "visible" : "hidden") as "visible" | "hidden"),
);

type _PipedStaticComponentSuccess = Assert<
  Equal<Fx.Success<typeof PipedStaticGreeting>, "visible" | "hidden">
>;

const Greeting = component(function* (salutation: "Hello" | "Welcome", count: number) {
  const name = yield* setup;
  return [html`<strong>${salutation}, ${name}</strong>`, count, content] as const;
});

const greeting = Greeting("Hello", 1);

type _ComponentSuccess = Assert<
  Equal<Fx.Success<typeof greeting>, readonly [RenderEvent, number, string]>
>;
type _ComponentErrors = Assert<Equal<Fx.Error<typeof greeting>, "setup-error" | "content-error">>;
type _ComponentServices = Assert<
  Equal<Fx.Services<typeof greeting>, SetupService | ContentService | Scope.Scope | RenderTemplate>
>;

// @ts-expect-error component arguments retain the generator parameter types
Greeting("Hi", 1);

interface GenericGreetingProps<E, R> {
  readonly content: Effect.Effect<string, E, R>;
}

// oxlint-disable-next-line require-yield
const GenericGreeting = component(function* <E, R>(props: GenericGreetingProps<E, R>) {
  return props.content;
});

declare const genericContent: Effect.Effect<string, "generic-error", ContentService>;

const genericGreeting = GenericGreeting({ content: genericContent });

type _GenericComponentSuccess = Assert<Equal<Fx.Success<typeof genericGreeting>, string>>;
type _GenericComponentErrors = Assert<Equal<Fx.Error<typeof genericGreeting>, "generic-error">>;
type _GenericComponentServices = Assert<
  Equal<Fx.Services<typeof genericGreeting>, ContentService | Scope.Scope>
>;

const PipedGreeting = component(
  // oxlint-disable-next-line require-yield
  function* (salutation: "Hello" | "Welcome", _count: number) {
    return salutation;
  },
  (fx, salutation, count) => fx.pipe(Fx.map((value) => `${salutation}: ${value} ${count}`)),
  (fx, _salutation, count) => fx.pipe(Fx.map((value) => value.length + count)),
  (fx, salutation) => fx.pipe(Fx.map((value) => [salutation, value] as const)),
);

const pipedGreeting = PipedGreeting("Welcome", 2);

type _PipedComponentSuccess = Assert<
  Equal<Fx.Success<typeof pipedGreeting>, readonly ["Hello" | "Welcome", number]>
>;

// @ts-expect-error piped components retain the generator parameter types
PipedGreeting("Hi", 1);

type _ScalarPipelineRequiresParentScope = Assert<
  Equal<Fx.Services<typeof PipedStaticGreeting>, Scope.Scope>
>;
type _ParameterizedPipelineRequiresParentScope = Assert<
  Equal<Fx.Services<typeof pipedGreeting>, Scope.Scope>
>;
