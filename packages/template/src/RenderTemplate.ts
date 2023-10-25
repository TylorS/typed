import * as Schema from "@effect/schema/Schema"
import * as Context from "@typed/context"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { ElementRef } from "@typed/template/ElementRef"
import { getElements } from "@typed/template/ElementSource"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import type { TemplateInstance } from "@typed/template/TemplateInstance"
import type { Rendered } from "@typed/wire"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import type { Scope } from "effect/Scope"

export interface RenderTemplate {
  <Values extends ReadonlyArray<Renderable<any, any>>, T extends Rendered = Rendered>(
    templateStrings: TemplateStringsArray,
    values: Values,
    ref?: ElementRef<T, Placeholder.Error<Values[number]>>
  ): Effect.Effect<
    Scope | Placeholder.Context<readonly [] extends Values ? never : Values[number]>,
    never,
    TemplateInstance<
      Placeholder.Error<Values[number]>,
      T
    >
  >
}

export const RenderTemplate: Context.Tagged<RenderTemplate, RenderTemplate> = Context.Tagged<
  RenderTemplate,
  RenderTemplate
>(
  "@typed/template/RenderTemplate"
)

export function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Effect.Effect<
  RenderTemplate | Scope | Placeholder.Context<Values[number]>,
  never,
  TemplateInstance<Placeholder.Error<Values[number]>, Rendered>
> {
  return RenderTemplate.withEffect((render) => render(template, values))
}

export function as<T extends Rendered = Rendered, E = never>(ref: ElementRef<T, E>) {
  return function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    ...values: Values
  ): Effect.Effect<
    Scope | RenderTemplate | Placeholder.Context<Values[number]>,
    never,
    TemplateInstance<E | Placeholder.Error<Values[number]>, T>
  > {
    return RenderTemplate.withEffect((render) => render(template, values, ref as any))
  }
}

export interface ComponentAdapter<T extends Rendered, E = never> extends Effect.Adapter {
  readonly html: <
    const Values extends ReadonlyArray<[E] extends [never] ? Renderable<any, any> : Renderable<any, E>> = readonly []
  >(
    template: TemplateStringsArray,
    ...values: Values
  ) => Effect.EffectGen<
    RenderTemplate | Scope | Placeholder.Context<Values[number]>,
    never,
    TemplateInstance<[E] extends [never] ? Placeholder.Error<Values[number]> : E, T>
  >
  readonly ref: ElementRef<T, E>
  readonly query: ElementRef<T, E>["query"]
  readonly elements: ElementRef<T, E>["elements"]
  readonly events: ElementRef<T, E>["events"]

  readonly use: <R, E, R2, E2, A>(
    ref: Effect.Effect<R, E, RefSubject.RefSubject<R2, E2, A>>,
    options: UseOptions<A>
  ) => Effect.EffectGen<R | R2 | Scope, E, RefSubject.RefSubject<R2, E2, A>>
}

export type UseOptions<A> = {
  readonly key: string
  readonly schema: Schema.Schema<string, A>
}

const diffRecords = (a: Record<string, string>, b: Record<string, string>) => {
  const added: Record<string, string> = {}
  const removed: Array<string> = []

  const aKeys = new Set(Object.keys(a))
  const bKeys = new Set(Object.keys(b))

  for (const key of aKeys) {
    if (bKeys.has(key)) continue
    else removed.push(key)
  }

  for (const key of bKeys) {
    if (a[key] !== b[key]) {
      added[key] = b[key]
    }
  }

  return (data?: DOMStringMap): void => {
    if (data === undefined) return

    Object.assign(data, added)
    removed.forEach((key) => delete data[key])
  }
}

export function as$<T extends Rendered, E = never>() {
  return function component$<
    Y extends Effect.EffectGen<any, any, any>,
    R
  >(
    f: ($: ComponentAdapter<T, E>) => Generator<Y, R, any>
  ): Effect.Effect<
    Fx.EffectGenContext<Y>,
    Fx.EffectGenError<Y>,
    R
  > {
    return Effect.gen(function*(_) {
      const ref = yield* _(ElementRef<T, E>())
      const html = as(ref)
      const data = yield* _(RefSubject.make<never, never, Record<string, string>>(Effect.succeed({})))

      const use = <R, E, R2, E2, A>(
        makeRef: Effect.Effect<R, E, RefSubject.RefSubject<R2, E2, A>>,
        options: UseOptions<A>
      ) =>
        _(Effect.gen(function*(_) {
          const ref = yield* _(makeRef)

          yield* _(
            ref,
            Fx.mapEffect(Schema.encode(options.schema)),
            Fx.observe((value) => data.update((current) => ({ ...current, [options.key]: value }))),
            Effect.forkScoped
          )

          return ref
        }))

      const adapter: ComponentAdapter<T, E> = Object.assign(_.bind(null), {
        html: (<const Values extends ReadonlyArray<Renderable<any, any>>>(
          template: TemplateStringsArray,
          ...values: Values
        ) => _(html(template, ...values)) as any) as ComponentAdapter<T, E>["html"],
        ref,
        query: ref.query,
        elements: ref.elements,
        events: ref.events,
        use
      })

      yield* _(
        data,
        Fx.loop(
          Option.none<Record<string, string>>(),
          (previous, current) => [[previous, current] as const, Option.some(current)]
        ),
        Fx.snapshot(Effect.optionFromOptional(ref), ([previous, current], element) =>
          Effect.sync(() => {
            if (Option.isNone(element)) return
            if (Option.isNone(previous)) {
              return getElements(element.value).forEach((el) =>
                Object.assign((el as HTMLElement | SVGElement).dataset, current)
              )
            }

            const applyDiff = diffRecords(previous.value, current)
            getElements(element.value).forEach((el) => applyDiff((el as HTMLElement | SVGElement).dataset))
          })),
        Fx.drain,
        Effect.forkScoped
      )

      return yield* f(adapter)
    })
  }
}

export const component$ = as$()

// const Counter = component$(function*(_) {
//   // TODO: Figure out a way to make this work for HTML rendering
//   const count = yield* _.use(RefNumber.of(0), { key: "count", schema: Schema.NumberFromString })

//   return yield* _.html`
//     <p>Count: ${count}</p>
//     <button onclick=${RefNumber.increment(count)}>+</button>
//     <button onclick=${RefNumber.decrement(count)}>-</button>
//   `
// })
