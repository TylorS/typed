import * as Fx from "@typed/fx/Fx"
import * as ElementRef from "@typed/template/ElementRef"
import { Effect } from "effect"
import * as happyDOM from "happy-dom"

describe("ElementRef", () => {
  const window = makeWindow()
  const testRef = makeRef(window)

  it("keeps track of an Element", async () => {
    const test = Effect.gen(function*(_) {
      const [ref, element] = yield* _(testRef``)

      expect(yield* _(ref)).toBe(element)
    })

    await Effect.runPromise(Effect.scoped(test))
  })

  it("allows querying for children", async () => {
    const test = Effect.gen(function*(_) {
      const [ref, element] = yield* _(testRef`<p id="foo">asdf</p>`)
      const child = ref.query("#foo")

      expect(yield* _(child)).toEqual(Array.from(element.childNodes))
    })

    await Effect.runPromise(Effect.scoped(test))
  })

  it("allows querying for children by reference", async () => {
    const test = Effect.gen(function*(_) {
      const [ref, element] = yield* _(testRef`<p id="foo">asdf</p>`)
      const child = ref.query(element.children[0] as HTMLParagraphElement)

      expect(yield* _(child)).toEqual(Array.from(element.childNodes))
    })

    await Effect.runPromise(Effect.scoped(test))
  })

  it("allows listening to events", async () => {
    const test = Effect.gen(function*(_) {
      const [ref] = yield* _(testRef`<p id="foo">asdf</p>`)
      const foo = ref.query("p#foo")
      const [p] = yield* _(foo)
      const fiber = yield* _(foo.events("click"), Fx.first, Effect.fork)

      // Allow fiber to start
      yield* _(Effect.sleep(1))

      p.click()

      const event = yield* _(Effect.fromFiber(fiber))

      expect(event instanceof window.MouseEvent).toBe(true)
    })

    await Effect.runPromise(Effect.scoped(test))
  })

  it("allows listening to events using element reference", async () => {
    const test = Effect.gen(function*(_) {
      const [ref, element] = yield* _(testRef`<button><p id="foo">asdf</p><button>`)
      const button = element.children[0] as HTMLButtonElement
      const foo = ref.query(button).query("p#foo")
      const [p] = yield* _(foo)
      const fiber = yield* _(ref.query(button).query("p#foo").events("click"), Fx.first, Effect.fork)

      // Allow fiber to start
      yield* _(Effect.sleep(1))

      p.click()

      const event = yield* _(Effect.fromFiber(fiber))

      expect(event instanceof window.MouseEvent).toBe(true)
    })

    await Effect.runPromise(Effect.scoped(test))
  })
})

function makeWindow() {
  return new happyDOM.Window() as any as Window & typeof globalThis
}

function makeHtml({ document }: Window) {
  return (template: TemplateStringsArray) => {
    const element = document.createElement("div")
    element.innerHTML = template.join("")

    return element
  }
}

function makeRef(window: Window) {
  const html = makeHtml(window)

  return (template: TemplateStringsArray) =>
    Effect.gen(function*(_) {
      const ref = yield* _(ElementRef.make())
      const element = html(template)

      yield* _(ElementRef.set(ref, element))

      return [ref, element] as const
    })
}
