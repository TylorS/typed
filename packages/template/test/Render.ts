import * as Fx from "@typed/fx";
import * as Directive from "@typed/template/Directive";
import { DEFAULT_PRIORITY } from "@typed/template/RenderQueue";
import { html } from "@typed/template/RenderTemplate";
import { testRender } from "@typed/template/Test";
import { describe, it, test } from "@typed/template/Vitest";
import { isComment, isElement, isHtmlElement, isWire } from "@typed/wire";
import { deepStrictEqual, ok } from "assert";
import { range } from "effect/Array";
import * as Effect from "effect/Effect";

describe("Render", () => {
  test("renders a simple template", () => {
    return Effect.gen(function* (_) {
      const { elementRef, window } = yield* _(
        testRender(html`<div>Hello, world!</div>`)
      );
      const rendered = yield* _(elementRef);

      ok(rendered instanceof window.HTMLDivElement);
      deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
    });
  });

  test("renders a simple template with attributes", () =>
    Effect.gen(function* (_) {
      const { elementRef, window } = yield* _(
        testRender(html`<div class="foo" id="bar">Hello, world!</div>`)
      );
      const rendered = yield* _(elementRef);

      ok(rendered instanceof window.HTMLDivElement);
      deepStrictEqual(rendered.className, "foo");
      deepStrictEqual(rendered.id, "bar");
      deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
    }));

  it("renders a simple template with attributes", () =>
    Effect.gen(function* (_) {
      const { elementRef, window } = yield* _(
        testRender(html`<div class="foo" id="bar">Hello, world!</div>`)
      );
      const rendered = yield* _(elementRef);

      ok(rendered instanceof window.HTMLDivElement);
      deepStrictEqual(rendered.className, "foo");
      deepStrictEqual(rendered.id, "bar");
      deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
    }));

  test("renders a nested templates", () =>
    Effect.gen(function* (_) {
      const { elementRef, window } = yield* _(
        testRender(html`<div class="foo" id="bar">${html`Hello, world!`}</div>`)
      );
      const rendered = yield* _(elementRef);

      ok(rendered instanceof window.HTMLDivElement);
      deepStrictEqual(rendered.className, "foo");
      deepStrictEqual(rendered.id, "bar");
      deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
    }));

  describe("attributes", () => {
    it("renders a simple template with attributes", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(html`<div class="foo" id="bar">Hello, world!</div>`)
        );
        const rendered = yield* _(elementRef);

        ok(rendered instanceof window.HTMLDivElement);
        deepStrictEqual(rendered.className, "foo");
        deepStrictEqual(rendered.id, "bar");
        deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
      }));

    describe("interpolations", () => {
      it("renders a simple template with string interpolations", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(
              html`<div class=${"foo"} id=${"bar"}>Hello, world!</div>`
            )
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.className, "foo");
          deepStrictEqual(rendered.id, "bar");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));

      it("renders a simple template with number interpolations", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(html`<div class=${1} id=${2}>Hello, world!</div>`)
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.className, "1");
          deepStrictEqual(rendered.id, "2");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));

      it("renders a simple template with boolean interpolations", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(html`<div class=${true} id=${false}>Hello, world!</div>`)
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.className, "true");
          deepStrictEqual(rendered.id, "false");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));

      it("renders a simple template with null interpolations", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(html`<div class=${null} id=${null}>Hello, world!</div>`)
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.className, "");
          deepStrictEqual(rendered.id, "");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));

      it("renders a simple template with undefined interpolations", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(
              html`<div class=${undefined} id=${undefined}>Hello, world!</div>`
            )
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.className, "");
          deepStrictEqual(rendered.id, "");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));

      it("renders a simple template with a Effect interpolation", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(
              html`<div
                class=${Effect.succeed("foo")}
                id=${Effect.succeed("bar")}
              >
                Hello, world!
              </div>`
            )
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.className, "foo");
          deepStrictEqual(rendered.id, "bar");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));

      it("renders a simple template with a Fx interpolation", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(
              html`<div class=${Fx.succeed("foo")} id=${Fx.succeed("bar")}>
                Hello, world!
              </div>`
            )
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.className, "foo");
          deepStrictEqual(rendered.id, "bar");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));
    });

    describe("directive", () => {
      test("renders a simple template with a directive", ({ clock }) =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(
              html`<div
                data-foo=${Directive.attribute((part) =>
                  Effect.gen(function* (_) {
                    yield* _(part.update("foo", DEFAULT_PRIORITY));
                    yield* _(Effect.sleep(100));
                    yield* _(part.update("bar", DEFAULT_PRIORITY));
                  })
                )}
              >
                Hello, world!
              </div>`
            )
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);

          ok(rendered.hasAttribute("data-foo"));
          deepStrictEqual(rendered.getAttribute("data-foo"), "foo");
          yield* _(clock.adjust(100));
          deepStrictEqual(rendered.getAttribute("data-foo"), "bar");
        }));
    });

    describe("sparse", () => {
      it("renders simple interpolations", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(html`<div id="${"foo"} ${"bar"}">Hello, world!</div>`)
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.id, "foo bar");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));

      it("renders Effect interpolations", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(
              html`<div id="${Effect.succeed("foo")} ${Effect.succeed("bar")}">
                Hello, world!
              </div>`
            )
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.id, "foo bar");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));

      it("renders Fx interpolations", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(
              html`<div id="${Fx.succeed("foo")} ${Fx.succeed("bar")}">
                Hello, world!
              </div>`
            )
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.id, "foo bar");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));
    });
  });

  describe("boolean attributes", () => {
    it("renders a simple template with boolean attributes", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<div ?disabled=${true} ?hidden=${false}>Hello, world!</div>`
          )
        );
        const rendered = yield* _(elementRef);

        ok(rendered instanceof window.HTMLDivElement);
        deepStrictEqual(rendered.hasAttribute("disabled"), true);
        deepStrictEqual(rendered.hasAttribute("hidden"), false);
        deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
      }));

    it("Effect", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<div
              ?disabled=${Effect.succeed(true)}
              ?hidden=${Effect.succeed(false)}
            >
              Hello, world!
            </div>`
          )
        );
        const rendered = yield* _(elementRef);

        ok(rendered instanceof window.HTMLDivElement);
        deepStrictEqual(rendered.hasAttribute("disabled"), true);
        deepStrictEqual(rendered.hasAttribute("hidden"), false);
        deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
      }));

    it("Fx", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<div
              ?disabled=${Fx.succeed(true)}
              ?hidden=${Fx.succeed(false)}
            >
              Hello, world!
            </div>`
          )
        );
        const rendered = yield* _(elementRef);

        ok(rendered instanceof window.HTMLDivElement);
        deepStrictEqual(rendered.hasAttribute("disabled"), true);
        deepStrictEqual(rendered.hasAttribute("hidden"), false);
        deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
      }));

    test("directive", ({ clock }) =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<div
              ?disabled=${Directive.boolean((part) =>
                Effect.gen(function* (_) {
                  yield* _(part.update(true, DEFAULT_PRIORITY));
                  yield* _(Effect.sleep(100));
                  yield* _(part.update(false, DEFAULT_PRIORITY));
                })
              )}
            >
              Hello, world!
            </div>`
          )
        );
        const rendered = yield* _(elementRef);

        ok(rendered instanceof window.HTMLDivElement);

        ok(rendered.hasAttribute("disabled"));
        yield* _(clock.adjust(100));
        ok(!rendered.hasAttribute("disabled"));
      }));
  });

  describe("class", () => {
    it("renders a simple template with className", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(html`<div class="foo bar baz">Hello, world!</div>`)
        );
        const rendered = yield* _(elementRef);

        ok(rendered instanceof window.HTMLDivElement);
        deepStrictEqual(rendered.className, "foo bar baz");
        deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
      }));

    it("Effect", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<div class=${Effect.succeed("foo bar baz")}>
              Hello, world!
            </div>`
          )
        );
        const rendered = yield* _(elementRef);

        ok(rendered instanceof window.HTMLDivElement);
        deepStrictEqual(rendered.className, "foo bar baz");
        deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
      }));

    it("Fx", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<div class=${Fx.succeed("foo bar baz")}>Hello, world!</div>`
          )
        );
        const rendered = yield* _(elementRef);

        ok(rendered instanceof window.HTMLDivElement);
        deepStrictEqual(rendered.className, "foo bar baz");
        deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
      }));

    test("directive", ({ clock }) =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<div
              class=${Directive.className((part) =>
                Effect.gen(function* (_) {
                  yield* _(part.update(["foo"], DEFAULT_PRIORITY));
                  yield* _(Effect.sleep(100));
                  yield* _(part.update(["bar"], DEFAULT_PRIORITY));
                })
              )}
            >
              Hello, world!
            </div>`
          )
        );
        const rendered = yield* _(elementRef);

        ok(rendered instanceof window.HTMLDivElement);

        deepStrictEqual(rendered.className, "foo");
        yield* _(clock.adjust(100));
        deepStrictEqual(rendered.className, "bar");
      }));

    describe("sparse class", () => {
      it("renders simple interpolations", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(html`<div class="${"foo"} ${"bar"}">Hello, world!</div>`)
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.className, "foo bar");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));

      it("Effect/Fx", () =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(
              html`<div class="${Effect.succeed("foo")} ${Fx.succeed("bar")}">
                Hello, world!
              </div>`
            )
          );
          const rendered = yield* _(elementRef);

          ok(rendered instanceof window.HTMLDivElement);
          deepStrictEqual(rendered.className, "foo bar");
          deepStrictEqual(rendered.innerText.trim(), "Hello, world!");
        }));
    });
  });

  describe("comment", () => {
    it("renders a simple template with a comment", () =>
      Effect.gen(function* (_) {
        const { elementRef } = yield* _(testRender(html`<!--Hello, world!-->`));
        const rendered = yield* _(elementRef);

        ok(isComment(rendered));
        deepStrictEqual(rendered.data, "Hello, world!");
      }));

    it("renders a simple template with a comment part", () =>
      Effect.gen(function* (_) {
        const { elementRef } = yield* _(
          testRender(html`<!--${"Hello, world!"}-->`)
        );
        const rendered = yield* _(elementRef);

        ok(isComment(rendered));
        deepStrictEqual(rendered.data, "Hello, world!");
      }));

    it("Effect", () =>
      Effect.gen(function* (_) {
        const { elementRef } = yield* _(
          testRender(html`<!-- ${Effect.succeed("Hello, world!")} -->`)
        );
        const rendered = yield* _(elementRef);

        ok(isComment(rendered));
        deepStrictEqual(rendered.data, "Hello, world!");
      }));

    it("Fx", () =>
      Effect.gen(function* (_) {
        const { elementRef } = yield* _(
          testRender(html`<!-- ${Fx.succeed("Hello, world!")} -->`)
        );
        const rendered = yield* _(elementRef);

        ok(isComment(rendered));
        deepStrictEqual(rendered.data, "Hello, world!");
      }));

    test("directive", ({ clock }) =>
      Effect.gen(function* (_) {
        const { elementRef } = yield* _(
          testRender(
            html`<!-- ${Directive.comment((part) =>
              Effect.gen(function* (_) {
                yield* _(part.update("Hello, world!", DEFAULT_PRIORITY));
                yield* _(Effect.sleep(100));
                yield* _(part.update("Goodbye, world!", DEFAULT_PRIORITY));
              })
            )} -->`
          )
        );
        const rendered = yield* _(elementRef);

        ok(isComment(rendered));
        deepStrictEqual(rendered.data, "Hello, world!");
        yield* _(clock.adjust(100));
        deepStrictEqual(rendered.data, "Goodbye, world!");
      }));
  });

  describe("property", () => {
    it("renders a simple template with property", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(html`<input .value=${"foo"} />`)
        );
        const rendered = yield* _(elementRef);
        ok(rendered instanceof window.HTMLInputElement);
        deepStrictEqual(rendered.value, "foo");
      }));

    it("Effect", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(html`<input .value=${Effect.succeed("foo")} />`)
        );
        const rendered = yield* _(elementRef);
        ok(rendered instanceof window.HTMLInputElement);
        deepStrictEqual(rendered.value, "foo");
      }));

    it("Fx", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(html`<input .value=${Fx.succeed("foo")} />`)
        );
        const rendered = yield* _(elementRef);
        ok(rendered instanceof window.HTMLInputElement);
        deepStrictEqual(rendered.value, "foo");
      }));

    describe("directive", () => {
      test("renders a simple template with a directive", ({ clock }) =>
        Effect.gen(function* (_) {
          const { elementRef, window } = yield* _(
            testRender(
              html`<input
                .value=${Directive.property((part) =>
                  Effect.gen(function* (_) {
                    yield* _(part.update("foo", DEFAULT_PRIORITY));
                    yield* _(Effect.sleep(100));
                    yield* _(part.update("bar", DEFAULT_PRIORITY));
                  })
                )}
              />`
            )
          );
          const rendered = yield* _(elementRef);
          ok(rendered instanceof window.HTMLInputElement);
          deepStrictEqual(rendered.value, "foo");
          yield* _(clock.adjust(100));
          deepStrictEqual(rendered.value, "bar");
        }));
    });
  });

  describe("spread properties", () => {
    it("renders a simple template with spread properties", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(html`<input ...${{ ".value": "foo", type: "text" }} />`)
        );
        const rendered = yield* _(elementRef);
        ok(rendered instanceof window.HTMLInputElement);
        deepStrictEqual(rendered.value, "foo");
        deepStrictEqual(rendered.type, "text");
      }));

    it("Effect/Fx", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<input
              ...${{
                ".value": Effect.succeed("foo"),
                type: Fx.succeed("text"),
              }}
            />`
          )
        );
        const rendered = yield* _(elementRef);
        ok(rendered instanceof window.HTMLInputElement);
        deepStrictEqual(rendered.value, "foo");
        deepStrictEqual(rendered.type, "text");
      }));
  });

  describe("text-only elements", () => {
    it("renders a simple template with a text-only element", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<script>
              alert("Hello, world!");
            </script>`
          )
        );
        const rendered = yield* _(elementRef);
        ok(rendered instanceof window.HTMLScriptElement);
        deepStrictEqual(
          rendered.textContent?.trim(),
          'alert("Hello, world!");'
        );
      }));

    it("renders a simple template with a text-only element with interpolations", () =>
      Effect.gen(function* (_) {
        const { elementRef, window } = yield* _(
          testRender(
            html`<script>
              alert("${Effect.succeed("Hello, world!")}");
            </script>`
          )
        );
        const rendered = yield* _(elementRef);
        ok(isElement(rendered));
        ok(rendered instanceof window.HTMLScriptElement);
        deepStrictEqual(
          rendered.textContent?.trim(),
          `alert("Hello, world!");`
        );
      }));

    test("renders a simple template with a text-only element with a directive", ({
      clock,
    }) =>
      Effect.gen(function* (_) {
        const directive = Directive.text((part) =>
          Effect.gen(function* (_) {
            yield* _(part.update("Hello, world!", DEFAULT_PRIORITY));
            yield* _(Effect.sleep(100));
            yield* _(part.update("Goodbye, world!", DEFAULT_PRIORITY));
          })
        );
        const { elementRef, window } = yield* _(
          testRender(
            html`<script>
              alert("${directive}");
            </script>`
          )
        );
        const rendered = yield* _(elementRef);
        ok(rendered instanceof window.HTMLScriptElement);
        deepStrictEqual(
          rendered.textContent?.trim(),
          `alert("Hello, world!");`
        );
        yield* _(clock.adjust(100));
        deepStrictEqual(
          rendered.textContent?.trim(),
          `alert("Goodbye, world!");`
        );
      }));
  });

  describe("counter", () => {
    it("renders a counter", () => {
      const decrement = (x: number) => Math.max(0, x - 1);

      return Effect.gen(function* (_) {
        const count = yield* _(Fx.RefSubject.of(0));
        const rendered = yield* _(
          testRender(html`
            <button
              class="dec"
              onclick=${Fx.RefSubject.update(count, decrement)}
            >
              -
            </button>
            <p>${count}</p>
            <button class="inc" onclick=${Fx.RefSubject.increment(count)}>
              -
            </button>
          `)
        );

        const dec = rendered.click({ selector: ".dec" });
        const inc = rendered.click({ selector: ".inc" });

        yield* _(Effect.forEach(range(1, 3), () => inc));
        yield* _(Effect.forEach(range(1, 6), () => dec));
        yield* _(Effect.forEach(range(1, 5), () => inc));

        expect(yield* _(count)).toEqual(4);
      }).pipe(Effect.scoped);
    });
  });

  describe("fragments", () => {
    it("renders a fragment", () =>
      Effect.gen(function* (_) {
        const { elementRef } = yield* _(
          testRender(
            html`<div>Hello, world!</div>
              <div>Goodbye, world!</div>`
          )
        );
        const rendered = yield* _(elementRef);

        ok(isWire(rendered));
        const fragment = rendered.valueOf();

        // A wire utilizes 2 comments at the beginning and end of the fragment
        // to better allow for changes
        deepStrictEqual(fragment.childNodes.length, 4);

        const [a, b, c, d] = fragment.childNodes;

        ok(isComment(a));
        ok(isHtmlElement(b));
        ok(isHtmlElement(c));
        ok(isComment(d));

        deepStrictEqual(b.textContent, "Hello, world!");
        deepStrictEqual(c.textContent, "Goodbye, world!");
      }));

    it("renders a dynamic fragment into a larger template", () =>
      Effect.gen(function* (_) {
        const timeout = 100;
        const content = Fx.mergeAll([
          html`<p>1</p>
            <p>2</p>
            <p>3</p>`,
          Fx.delay(html`<b>4</b><b>5</b><b>6</b>`, timeout),
        ]);

        const { elementRef } = yield* _(
          testRender(html`<div>${content}</div>`)
        );
        const rendered = yield* _(elementRef);

        ok(isHtmlElement(rendered));
        deepStrictEqual(rendered.tagName, "DIV");

        deepStrictEqual(rendered.childNodes.length, 6);
        const [, a, b, c] = rendered.childNodes;

        ok(isHtmlElement(a) && a.tagName === "P" && a.textContent === "1");
        ok(isHtmlElement(b) && b.tagName === "P" && b.textContent === "2");
        ok(isHtmlElement(c) && c.tagName === "P" && c.textContent === "3");

        yield* _(Effect.sleep(timeout));

        const [, d, e, f] = rendered.childNodes;

        ok(isHtmlElement(d) && d.tagName === "B" && d.textContent === "4");
        ok(isHtmlElement(e) && e.tagName === "B" && e.textContent === "5");
        ok(isHtmlElement(f) && f.tagName === "B" && f.textContent === "6");
      }));
  });
});
