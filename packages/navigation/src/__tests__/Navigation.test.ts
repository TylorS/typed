import { assert, describe, it } from "vitest";
import {
  Cause,
  Data,
  Deferred,
  Effect,
  Exit,
  Fiber,
  Layer,
  Option,
  Result,
  Schema,
  Scope,
} from "effect";
import { Fx } from "@typed/fx";
import * as Uuid7 from "@typed/id/Uuid7";
import { IdsTest } from "@typed/id/IdsTest";
import { type BlockNavigation, type Blocking, useBlockNavigation } from "../Blocking.js";
import { getUrl } from "../_core.js";
import { fromWindow } from "../fromWindow.js";
import { initialMemory, memory } from "../memory.js";
import { CurrentPath, Navigation } from "../Navigation.js";
import { BeforeNavigationEvent, RedirectError } from "../model.js";

describe("typed/navigation", () => {
  it("getUrl resolves relative paths against an origin", () => {
    assert.equal(
      getUrl("https://example.com", "/path?query=1").href,
      "https://example.com/path?query=1",
    );
    assert.equal(
      getUrl("https://example.com", new URL("https://other.test/abs")).href,
      "https://other.test/abs",
    );
  });

  it("fromWindow provides origin and a route-path base", () =>
    Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const origin = yield* Navigation.origin;
          const base = yield* Navigation.base;
          assert.equal(origin, "https://example.com");
          assert.equal(base, "/app/");
        }),
        fromWindow(mockWindow({ baseHref: "https://example.com/app/" })).pipe(
          Layer.provide(Uuid7.Uuid7State.Default),
        ),
      ),
    ));

  it("fromWindow layer provides Navigation service", () =>
    Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const n = yield* Navigation;
          const dest = yield* n.currentEntry;
          assert.ok(Uuid7.isUuid7(dest.id), "id should be UUID v7");
          assert.ok(Uuid7.isUuid7(dest.key), "key should be UUID v7");
          assert.equal(dest.url.href, "https://example.com/");
        }),
        fromWindow(mockWindow()).pipe(Layer.provide(Uuid7.Uuid7State.Default)),
      ),
    ));

  it("maps ID generation failures to NavigationError", () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const invalidIds = IdsTest({ currentTime: 2 ** 48 });
        const browserResult = yield* Effect.provide(
          Navigation.currentEntry,
          fromWindow(mockWindow()).pipe(Layer.provideMerge(invalidIds)),
        ).pipe(Effect.result);
        assert.isTrue(Result.isFailure(browserResult));
        if (Result.isFailure(browserResult)) {
          assert.equal(browserResult.failure._tag, "@typed/navigation/NavigationError");
          if (browserResult.failure._tag === "@typed/navigation/NavigationError") {
            assert.isTrue(Cause.isIllegalArgumentError(browserResult.failure.error));
          }
        }

        const memoryResult = yield* Effect.provide(
          Effect.result(Navigation.navigate("/invalid-id")),
          memory({ entries: [createDestination("http://localhost/")] }).pipe(
            Layer.provideMerge(invalidIds),
          ),
        );
        assert.isTrue(Result.isFailure(memoryResult));
        if (Result.isFailure(memoryResult)) {
          assert.equal(memoryResult.failure._tag, "@typed/navigation/NavigationError");
          if (memoryResult.failure._tag === "@typed/navigation/NavigationError") {
            assert.isTrue(Cause.isIllegalArgumentError(memoryResult.failure.error));
          }
        }
      }),
    ));

  describe("memory", () => {
    it("creates memory navigation with initial entries", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const current = yield* Navigation.currentEntry;
            const entries = yield* Navigation.entries;

            assert.equal(current.url.href, "http://localhost/2");
            assert.equal(entries.length, 2);
            assert.equal(entries[0].url.href, "http://localhost/1");
            assert.equal(entries[1].url.href, "http://localhost/2");
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
            ],
            currentIndex: 1,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("honors custom origin and base options", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            assert.equal(yield* Navigation.origin, "https://custom.test");
            assert.equal(yield* Navigation.base, "/app/");
            assert.equal((yield* Navigation.currentEntry).url.href, "https://custom.test/home");
            assert.isTrue((yield* Navigation.currentEntry).sameDocument);
          }),
          memory({
            origin: "https://custom.test",
            base: "/app/",
            entries: [createDestination("https://custom.test/home")],
            currentIndex: 0,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("initialMemory creates navigation from URL", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const testUrl = "http://localhost/initial-test";
            const testState = { test: "initial-data" };
            const current = yield* Navigation.currentEntry;
            const entries = yield* Navigation.entries;

            assert.equal(current.url.href, testUrl);
            assert.deepEqual(current.state, testState);
            assert.equal(entries.length, 1);
            assert.equal(entries[0].url.href, testUrl);
          }),
          initialMemory({
            url: "http://localhost/initial-test",
            state: { test: "initial-data" },
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("navigate adds new entry", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const dest = yield* Navigation.navigate("http://localhost/2");
            assert.equal(dest.url.href, "http://localhost/2");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/2");

            const entries = yield* Navigation.entries;
            assert.equal(entries.length, 2);
          }),
          memory({
            entries: [createDestination("http://localhost/1")],
            currentIndex: 0,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("allocates a fresh slot key for every pushed destination", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const first = yield* Navigation.currentEntry;
            const second = yield* Navigation.navigate("/2", { history: "push" });
            const third = yield* Navigation.navigate("/3", { history: "push" });

            assert.equal(new Set([first.key, second.key, third.key]).size, 3);
            assert.deepInclude(yield* Navigation.back(), { id: second.id, key: second.key });
            assert.deepInclude(yield* Navigation.forward(), { id: third.id, key: third.key });
          }),
          initialMemory({ url: "http://localhost/1" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("preserves slot identity for replace and reload while applying reload state", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const pushed = yield* Navigation.navigate("/2", { history: "push" });
            const replaced = yield* Navigation.navigate("/2?updated", {
              history: "replace",
            });
            const state = { version: "reloaded" };
            const reloaded = yield* Navigation.reload({ state });

            assert.equal(replaced.key, pushed.key);
            assert.equal(reloaded.key, pushed.key);
            assert.notEqual(reloaded.id, replaced.id);
            assert.deepEqual(reloaded.state, state);
            assert.deepEqual((yield* Navigation.currentEntry).state, state);
          }),
          initialMemory({ url: "http://localhost/1" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("reports malformed navigation URLs through NavigationError", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const navigation = yield* Navigation;
            const result = yield* Effect.result(navigation.navigate("http://["));

            assert.isTrue(Result.isFailure(result));
            if (Result.isFailure(result)) {
              assert.equal(result.failure._tag, "@typed/navigation/NavigationError");
              assert.instanceOf(result.failure.error, TypeError);
            }
            assert.isTrue(Option.isNone(yield* navigation.transition.asComputed()));
          }),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("reports unknown traversal keys through NavigationError", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const navigation = yield* Navigation;
            const current = yield* navigation.currentEntry;
            const result = yield* Effect.result(navigation.traverseTo("missing-key"));

            assert.isTrue(Result.isFailure(result));
            if (Result.isFailure(result)) {
              assert.equal(result.failure._tag, "@typed/navigation/NavigationError");
            }
            assert.equal((yield* navigation.currentEntry).key, current.key);
          }),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("does not block navigation when shouldBlock returns false", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              const blocking = yield* useBlockNavigation({
                shouldBlock: (event) => Effect.succeed(event.to.url.pathname === "/blocked"),
              });

              yield* navigation.navigate("/allowed");

              assert.isFalse(yield* blocking.isBlocking);
              assert.equal((yield* navigation.currentEntry).url.pathname, "/allowed");
            }),
          ),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("redirects once from an onBeforeNavigation handler", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              yield* navigation.onBeforeNavigation((event) =>
                event.to.url.pathname === "/gate"
                  ? Effect.fail(new RedirectError({ url: "/destination" }))
                  : Effect.succeed(Option.none()),
              );

              yield* navigation.navigate("/gate");

              assert.equal((yield* navigation.currentEntry).url.pathname, "/destination");
              assert.equal((yield* Navigation.entries).length, 1);
              assert.isTrue(Option.isNone(yield* navigation.transition.asComputed()));
            }),
          ),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("resets blocking after confirmation and blocks the next navigation", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              const blocking = yield* useBlockNavigation();

              const first = yield* Effect.forkChild(navigation.navigate("/first"));
              yield* Effect.yieldNow;
              const firstBlocking = yield* awaitBlocking(blocking, "/first");
              yield* firstBlocking.confirm;
              yield* Fiber.join(first);
              assert.isFalse(yield* blocking.isBlocking);

              const second = yield* Effect.forkChild(navigation.navigate("/second"));
              yield* Effect.yieldNow;
              const secondBlocking = yield* awaitBlocking(blocking, "/second");
              yield* secondBlocking.cancel;
              yield* Fiber.join(second);
              assert.isFalse(yield* blocking.isBlocking);
              assert.equal((yield* navigation.currentEntry).url.pathname, "/first");
            }),
          ),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("resets blocking when a blocked navigation is interrupted", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              const blocking = yield* useBlockNavigation();
              const navigationFiber = yield* Effect.forkChild(navigation.navigate("/blocked"));
              yield* Effect.yieldNow;
              yield* awaitBlocking(blocking, "/blocked");

              assert.isTrue(yield* blocking.isBlocking);
              yield* Fiber.interrupt(navigationFiber);
              assert.isFalse(yield* blocking.isBlocking);
            }),
          ),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("resets blocking after redirect and ignores duplicate stale settlement", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              const blocking = yield* useBlockNavigation({
                shouldBlock: (event) => Effect.succeed(event.to.url.pathname !== "/redirected"),
              });
              const navigationFiber = yield* Effect.forkChild(navigation.navigate("/blocked"));
              yield* Effect.yieldNow;
              const blocked = yield* awaitBlocking(blocking, "/blocked");

              yield* blocked.redirect("/redirected");
              yield* Fiber.join(navigationFiber);
              assert.isFalse(yield* blocking.isBlocking);
              assert.equal((yield* navigation.currentEntry).url.pathname, "/redirected");

              yield* blocked.cancel;
              assert.equal((yield* navigation.currentEntry).url.pathname, "/redirected");
            }),
          ),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("resets blocking and releases navigation when its scope closes", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              const blockerScope = yield* Scope.make();
              const blocking = yield* Scope.provide(useBlockNavigation(), blockerScope);
              const navigationFiber = yield* Effect.forkChild(navigation.navigate("/blocked"));
              yield* Effect.yieldNow;
              yield* awaitBlocking(blocking, "/blocked");

              yield* Scope.close(blockerScope, Exit.void);
              yield* Fiber.join(navigationFiber);
              assert.isFalse(yield* blocking.isBlocking);
              assert.equal((yield* navigation.currentEntry).url.pathname, "/");
            }),
          ),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it.each([
      { action: "confirm" as const, expectedPath: "/confirm" },
      { action: "cancel" as const, expectedPath: "/" },
      { action: "dispose" as const, expectedPath: "/" },
    ])(
      "settles blocked navigation before publishing the unblocked state ($action)",
      ({ action, expectedPath }) =>
        Effect.runPromise(
          Effect.provide(
            Effect.scoped(
              Effect.gen(function* () {
                const navigation = yield* Navigation;
                const blockerScope = yield* Scope.make();
                const blocking = yield* Scope.provide(useBlockNavigation(), blockerScope);
                const observerReady = yield* Deferred.make<void>();
                const unblockedPublication = yield* Deferred.make<void>();
                const releasePublication = yield* Deferred.make<void>();
                let observedBlocked = false;

                yield* Effect.forkScoped(
                  Fx.observe(blocking.isBlocking, (isBlocking) => {
                    Deferred.doneUnsafe(observerReady, Effect.void);
                    if (isBlocking) {
                      observedBlocked = true;
                      return Effect.void;
                    }
                    if (!observedBlocked) return Effect.void;
                    Deferred.doneUnsafe(unblockedPublication, Effect.void);
                    return Deferred.await(releasePublication);
                  }),
                );
                yield* Deferred.await(observerReady);

                const navigationFiber = yield* Effect.forkChild(navigation.navigate(`/${action}`));
                yield* Effect.yieldNow;
                const blocked = yield* awaitBlocking(blocking, `/${action}`);
                const settlementFiber = yield* Effect.forkChild(
                  action === "dispose"
                    ? Scope.close(blockerScope, Exit.void)
                    : action === "confirm"
                      ? blocked.confirm
                      : blocked.cancel,
                );

                yield* Deferred.await(unblockedPublication);
                const navigationExit = yield* awaitFiberExit(navigationFiber);
                assert.isTrue(Exit.isSuccess(navigationExit));
                if (Exit.isSuccess(navigationExit)) {
                  assert.equal(navigationExit.value.url.pathname, expectedPath);
                }

                Deferred.doneUnsafe(releasePublication, Effect.void);
                yield* Fiber.join(settlementFiber);
                if (action !== "dispose") yield* Scope.close(blockerScope, Exit.void);
              }),
            ),
            initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
          ),
        ),
    );

    it(
      "allows a post-navigation handler to navigate after the state update commits",
      () =>
        Effect.runPromise(
          Effect.provide(
            Effect.scoped(
              Effect.gen(function* () {
                const navigation = yield* Navigation;
                yield* navigation.onNavigation((event) =>
                  Effect.succeed(
                    event.destination.url.pathname === "/first"
                      ? Option.some(
                          navigation.navigate("/second").pipe(Effect.orDie, Effect.asVoid),
                        )
                      : Option.none(),
                  ),
                );

                yield* navigation.navigate("/first");

                assert.equal((yield* navigation.currentEntry).url.pathname, "/second");
              }),
            ),
            initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
          ),
        ),
      1_000,
    );

    it("clears its transition when a custom commit is interrupted", () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const commitStarted = yield* Deferred.make<void>();

          yield* Effect.provide(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              const fiber = yield* Effect.forkChild(navigation.navigate("/interrupted"));
              yield* Deferred.await(commitStarted);
              yield* Fiber.interrupt(fiber);

              assert.isTrue(Option.isNone(yield* navigation.transition.asComputed()));
            }),
            memory({
              entries: [createDestination("http://localhost/")],
              commit: () =>
                Deferred.succeed(commitStarted, undefined).pipe(Effect.andThen(Effect.never)),
            }).pipe(Layer.provideMerge(IdsTest())),
          );
        }),
      ));

    it("clears its transition when a before handler defects", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              yield* navigation.onBeforeNavigation(() => Effect.die("before handler defect"));

              yield* Effect.exit(navigation.navigate("/defect"));

              assert.isTrue(Option.isNone(yield* navigation.transition.asComputed()));
            }),
          ),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("clears its transition when a before handler is interrupted", () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const beforeStarted = yield* Deferred.make<void>();

          yield* Effect.provide(
            Effect.scoped(
              Effect.gen(function* () {
                const navigation = yield* Navigation;
                yield* navigation.onBeforeNavigation(() =>
                  Deferred.succeed(beforeStarted, undefined).pipe(Effect.andThen(Effect.never)),
                );

                const fiber = yield* Effect.forkChild(navigation.navigate("/interrupted-before"));
                yield* Deferred.await(beforeStarted);
                yield* Fiber.interrupt(fiber);

                assert.isTrue(Option.isNone(yield* navigation.transition.asComputed()));
              }),
            ),
            initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
          );
        }),
      ));

    it("clears its transition when redirect construction defects", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              yield* navigation.onBeforeNavigation((event) =>
                event.to.url.pathname === "/redirect"
                  ? Effect.fail(new RedirectError({ url: "http://[" }))
                  : Effect.succeed(Option.none()),
              );

              yield* Effect.exit(navigation.navigate("/redirect"));

              assert.isTrue(Option.isNone(yield* navigation.transition.asComputed()));
            }),
          ),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("reports redirect loops through NavigationError", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              yield* navigation.onBeforeNavigation(() =>
                Effect.fail(new RedirectError({ url: "/loop" })),
              );

              const result = yield* Effect.result(navigation.navigate("/loop"));

              assert.isTrue(Result.isFailure(result));
              if (Result.isFailure(result)) {
                assert.equal(result.failure._tag, "@typed/navigation/NavigationError");
                assert.instanceOf(result.failure.error, Error);
                assert.equal(result.failure.error.message, "Redirect loop detected");
              }
              assert.isTrue(Option.isNone(yield* navigation.transition.asComputed()));
            }),
          ),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("preserves custom commit callback ordering", () => {
      const events: Array<string> = [];

      return Effect.runPromise(
        Effect.provide(
          Effect.scoped(
            Effect.gen(function* () {
              const navigation = yield* Navigation;
              yield* navigation.onNavigation(() =>
                Effect.succeed(
                  Option.some(
                    Effect.sync(() => {
                      events.push("handler");
                    }),
                  ),
                ),
              );

              yield* navigation.navigate("/custom", { history: "push" });
              assert.deepEqual(events, ["handler", "commit:after-callback"]);
            }),
          ),
          memory({
            entries: [createDestination("http://localhost/")],
            commit: (before, runHandlers) => {
              const destination = {
                ...before.to,
                id: "custom-id",
                key: before.to.key ?? "custom-key",
              };
              return runHandlers(destination).pipe(
                Effect.tap(() =>
                  Effect.sync(() => {
                    events.push("commit:after-callback");
                  }),
                ),
                Effect.as(destination),
              );
            },
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      );
    });

    it("back navigates to previous entry", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const dest = yield* Navigation.back();
            assert.equal(dest.url.href, "http://localhost/1");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/1");

            const canGoBack = yield* Navigation.canGoBack;
            assert.equal(canGoBack, false);
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
            ],
            currentIndex: 1,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("forward navigates to next entry", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const dest = yield* Navigation.forward();
            assert.equal(dest.url.href, "http://localhost/2");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/2");

            const canGoForward = yield* Navigation.canGoForward;
            assert.equal(canGoForward, false);
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
            ],
            currentIndex: 0,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("limits entries to maxEntries when navigating", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const maxEntries = 3;
            yield* Navigation.navigate("http://localhost/2");
            yield* Navigation.navigate("http://localhost/3");
            yield* Navigation.navigate("http://localhost/4");
            yield* Navigation.navigate("http://localhost/5");

            const entries = yield* Navigation.entries;
            assert.equal(entries.length, maxEntries);
            assert.equal(entries[0].url.href, "http://localhost/3");
            assert.equal(entries[1].url.href, "http://localhost/4");
            assert.equal(entries[2].url.href, "http://localhost/5");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/5");
          }),
          memory({
            entries: [createDestination("http://localhost/1")],
            currentIndex: 0,
            maxEntries: 3,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("maintains correct index when entries are limited", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const entries = yield* Navigation.entries;
            assert.equal(entries.length, 2);
            assert.equal(entries[0].url.href, "http://localhost/2");
            assert.equal(entries[1].url.href, "http://localhost/3");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/3");

            const index = entries.findIndex((e) => e.key === current.key);
            assert.equal(index, 1);
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
              createDestination("http://localhost/3"),
            ],
            currentIndex: 2,
            maxEntries: 2,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("exposes an undefined current entry when initial retention evicts the active entry", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const entries = yield* Navigation.entries;
            assert.deepEqual(
              entries.map(({ url }) => url.pathname),
              ["/2", "/3"],
            );
            assert.equal(yield* Navigation.currentEntry, undefined);
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
              createDestination("http://localhost/3"),
            ],
            currentIndex: 0,
            maxEntries: 2,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("retains every entry when maxEntries is zero", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            yield* Navigation.navigate("http://localhost/3");

            const entries = yield* Navigation.entries;
            assert.deepEqual(
              entries.map(({ url }) => url.pathname),
              ["/1", "/2", "/3"],
            );
            assert.equal((yield* Navigation.currentEntry).url.pathname, "/3");
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
            ],
            currentIndex: 1,
            maxEntries: 0,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("can go back after entries are limited", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            yield* Navigation.navigate("http://localhost/2");
            yield* Navigation.navigate("http://localhost/3");

            const canGoBack = yield* Navigation.canGoBack;
            assert.equal(canGoBack, true);

            const dest = yield* Navigation.back();
            assert.equal(dest.url.href, "http://localhost/2");
          }),
          memory({
            entries: [createDestination("http://localhost/1")],
            currentIndex: 0,
            maxEntries: 2,
          }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("updateCurrentEntry replaces state in place", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const before = yield* Navigation.currentEntry;
            const state = { version: "updated" };
            const updated = yield* Navigation.updateCurrentEntry({ state });

            assert.equal(updated.key, before.key);
            assert.equal(updated.url.href, before.url.href);
            assert.notEqual(updated.id, before.id);
            assert.deepEqual(updated.state, state);
            assert.deepEqual((yield* Navigation.currentEntry).state, state);
            assert.equal((yield* Navigation.entries).length, 1);
          }),
          initialMemory({ url: "http://localhost/profile", state: { version: "initial" } }).pipe(
            Layer.provideMerge(IdsTest()),
          ),
        ),
      ));

    it("back at the first entry returns the current entry", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const current = yield* Navigation.currentEntry;
            const destination = yield* Navigation.back();

            assert.equal(destination.key, current.key);
            assert.isFalse(yield* Navigation.canGoBack);
          }),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("forward at the last entry returns the current entry", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const current = yield* Navigation.currentEntry;
            const destination = yield* Navigation.forward();

            assert.equal(destination.key, current.key);
            assert.isFalse(yield* Navigation.canGoForward);
          }),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("traverseTo the current key is a no-op", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const current = yield* Navigation.currentEntry;
            const destination = yield* Navigation.traverseTo(current.key);

            assert.equal(destination.key, current.key);
            assert.isTrue(Option.isNone(yield* Navigation.transition.asComputed()));
          }),
          initialMemory({ url: "http://localhost/" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));

    it("CurrentPath tracks pathname and search reactively", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            assert.equal(yield* CurrentPath, "/start");
            yield* Navigation.navigate("/next?tab=1", { history: "push" });
            assert.equal(yield* CurrentPath, "/next?tab=1");
            yield* Navigation.navigate("/next?tab=2", { history: "replace" });
            assert.equal(yield* CurrentPath, "/next?tab=2");
          }),
          initialMemory({ url: "http://localhost/start" }).pipe(Layer.provideMerge(IdsTest())),
        ),
      ));
  });

  describe("fromWindow commands", () => {
    it("preserves user state that contains private-looking keys across reconstruction", () => {
      const window = mockWindow();
      const userState = {
        __typed: "user-owned",
        __typedNavigation: { version: "application" },
        value: 1,
      };

      return Effect.runPromise(
        Effect.provide(
          Navigation.navigate("/managed", { history: "push", state: userState }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      ).then(() =>
        Effect.runPromise(
          Effect.provide(
            Effect.gen(function* () {
              assert.deepEqual((yield* Navigation.currentEntry).state, userState);
            }),
            fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
          ),
        ),
      );
    });

    it("preserves user state stored under a private-looking __typed key", () => {
      const persisted = {
        __typed: {
          entries: [{ id: null, key: 1, url: "http://[", sameDocument: "yes" }],
          index: Number.NaN,
        },
        value: "foreign",
      };
      const window = mockWindow({ initialState: persisted });

      return Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "https://example.com/");
            assert.deepEqual(current.state, persisted);
          }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      );
    });

    it("rejects every malformed persisted metadata field", async () => {
      const valid = {
        version: 1,
        session: "session",
        position: 0,
        entry: {
          id: "id",
          key: "key",
          url: "https://example.com/managed",
          state: { managed: true },
          sameDocument: true,
        },
      };
      const malformed = [
        { ...valid, version: 2 },
        { ...valid, session: "" },
        { ...valid, position: Number.NaN },
        { ...valid, position: 0.5 },
        { ...valid, position: -1 },
        { ...valid, entry: { ...valid.entry, id: "" } },
        { ...valid, entry: { ...valid.entry, key: "" } },
        { ...valid, entry: { ...valid.entry, url: "http://[" } },
        { ...valid, entry: { ...valid.entry, sameDocument: "true" } },
      ];

      for (const payload of malformed) {
        const persisted = { __typedNavigation: payload };
        const window = mockWindow({ initialState: persisted });
        const current = await Effect.runPromise(
          Effect.provide(
            Navigation.currentEntry,
            fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
          ),
        );
        assert.deepEqual(current.state, persisted);
        assert.equal(current.url.pathname, "/");
      }
    });

    it("persists constant-size metadata and bounds the in-memory sidecar", () => {
      const window = mockWindow();

      return Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            for (let index = 0; index < 75; index++) {
              yield* Navigation.navigate(`/entry/${index}`, {
                history: "push",
                state: { value: "x".repeat(64) },
              });
            }

            const sizes = window.historyEntries
              .slice(1)
              .map(({ state }) => JSON.stringify(state).length);
            assert.isAtMost(Math.max(...sizes) - Math.min(...sizes), 8);
            assert.isAtMost((yield* Navigation.entries).length, 50);
          }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      );
    });

    it("ignores non-authoritative popstate until the expected URL and key activate", () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const goStarted = yield* Deferred.make<void>();
          let activate: (() => void) | undefined;
          const window = mockWindow({
            onGo: (_delta, next) => {
              activate = next;
              Deferred.doneUnsafe(goStarted, Effect.void);
            },
          });

          yield* Effect.provide(
            Effect.gen(function* () {
              const initial = yield* Navigation.currentEntry;
              yield* Navigation.navigate("/managed", { history: "push" });

              const back = yield* Effect.forkChild(Navigation.back());
              yield* Deferred.await(goStarted);

              const malformedRead = yield* Deferred.make<void>();
              window.emitPopState(
                {
                  get __typedNavigation() {
                    Deferred.doneUnsafe(malformedRead, Effect.void);
                    return { version: 999 };
                  },
                },
                "/forged-malformed",
              );
              yield* Deferred.await(malformedRead);
              yield* Effect.yieldNow;
              assert.isUndefined(back.pollUnsafe());

              const stored = window.historyEntries[0].state as {
                readonly __typedNavigation: Record<string, unknown>;
              };
              const wrongUrlRead = yield* Deferred.make<void>();
              window.emitPopState(
                {
                  __typedNavigation: {
                    ...stored.__typedNavigation,
                    get entry() {
                      Deferred.doneUnsafe(wrongUrlRead, Effect.void);
                      return stored.__typedNavigation.entry;
                    },
                  },
                },
                "/forged-url",
              );
              yield* Deferred.await(wrongUrlRead);
              yield* Effect.yieldNow;
              assert.isUndefined(back.pollUnsafe());

              const foreignRead = yield* Deferred.make<void>();
              window.emitPopState(
                {
                  __typedNavigation: {
                    version: 1,
                    get session() {
                      Deferred.doneUnsafe(foreignRead, Effect.void);
                      return "foreign-session";
                    },
                    position: 0,
                    entry: {
                      id: "foreign-id",
                      key: "foreign-key",
                      url: "https://example.com/foreign",
                      state: null,
                      sameDocument: true,
                    },
                  },
                },
                "/forged-foreign",
              );
              yield* Deferred.await(foreignRead);
              yield* Effect.yieldNow;
              assert.isUndefined(back.pollUnsafe());

              activate!();

              assert.equal((yield* Fiber.join(back)).key, initial.key);
              assert.equal((yield* Navigation.currentEntry).url.pathname, "/");
            }),
            fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
          );
        }),
      ));

    it("reconciles unsolicited foreign popstate events in dispatch order", () => {
      const window = mockWindow();
      const firstState = { source: "first" };
      const secondState = { source: "second" };

      return Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            window.emitPopState(firstState, "/external-1");
            window.emitPopState(secondState, "/external-2");
            yield* awaitCurrentPath("/external-2");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.pathname, "/external-2");
            assert.deepEqual(current.state, secondState);
            assert.equal((yield* Navigation.entries).length, 1);
          }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      );
    });

    it("reconciles native back before truncating forward history with a push", () => {
      const window = mockWindow();

      return Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            yield* Navigation.navigate("/2", { history: "push" });
            yield* Navigation.navigate("/3", { history: "push" });

            window.history.go(-1);
            yield* awaitCurrentPath("/2");
            assert.isTrue(yield* Navigation.canGoForward);

            yield* Navigation.navigate("/4", { history: "push" });
            assert.isFalse(yield* Navigation.canGoForward);
            assert.deepEqual(
              (yield* Navigation.entries).map((entry) => entry.url.pathname),
              ["/", "/2", "/4"],
            );
            assert.equal(window.historyEntries.length, 3);
          }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      );
    });

    it("does not trust valid-looking metadata from a foreign session", () => {
      const window = mockWindow();
      const foreignState = {
        __typedNavigation: {
          version: 1,
          session: "foreign-session",
          position: 42,
          entry: {
            id: "foreign-id",
            key: "foreign-key",
            url: "https://example.com/injected",
            state: { injected: true },
            sameDocument: true,
          },
        },
      };

      return Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            window.emitPopState(foreignState, "/external");
            yield* awaitCurrentPath("/external");

            const current = yield* Navigation.currentEntry;
            assert.notEqual(current.key, "foreign-key");
            assert.deepEqual(current.state, foreignState);
          }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      );
    });

    it(
      "reconciles a pending traversal to the initial untyped history entry",
      () =>
        Effect.runPromise(
          Effect.gen(function* () {
            const goStarted = yield* Deferred.make<void>();
            let activate: (() => void) | undefined;
            const window = mockWindow({
              onGo: (_delta, next) => {
                activate = next;
                Deferred.doneUnsafe(goStarted, Effect.void);
              },
            });

            yield* Effect.provide(
              Effect.gen(function* () {
                const initial = yield* Navigation.currentEntry;
                yield* Navigation.navigate("/managed", { history: "push" });

                const back = yield* Effect.forkChild(Navigation.back());
                yield* Deferred.await(goStarted);
                assert.isUndefined(back.pollUnsafe());
                assert.isDefined(activate);
                activate!();

                const destination = yield* Fiber.join(back);
                assert.equal(destination.key, initial.key);
                assert.equal(destination.url.href, "https://example.com/");
                assert.equal((yield* Navigation.currentEntry).key, initial.key);
                assert.isTrue(yield* Navigation.canGoForward);
              }),
              fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
            );
          }),
        ),
      1_000,
    );

    it(
      "allows a pending browser traversal wait to be interrupted",
      () =>
        Effect.runPromise(
          Effect.gen(function* () {
            const goStarted = yield* Deferred.make<void>();
            const window = mockWindow({
              onGo: () => {
                Deferred.doneUnsafe(goStarted, Effect.void);
              },
            });

            yield* Effect.provide(
              Effect.gen(function* () {
                yield* Navigation.navigate("/managed", { history: "push" });
                const back = yield* Effect.forkChild(Navigation.back());
                yield* Deferred.await(goStarted);
                yield* Fiber.interrupt(back);

                assert.isTrue(Option.isNone(yield* Navigation.transition.asComputed()));
                assert.equal((yield* Navigation.currentEntry).url.pathname, "/managed");
              }),
              fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
            );
          }),
        ),
      1_000,
    );

    it(
      "awaits the matching popstate before completing back and forward",
      () =>
        Effect.runPromise(
          Effect.gen(function* () {
            const goStarted = [yield* Deferred.make<void>(), yield* Deferred.make<void>()];
            const activations: Array<() => void> = [];
            let goIndex = 0;
            const window = mockWindow({
              onGo: (_delta, activate) => {
                activations.push(activate);
                Deferred.doneUnsafe(goStarted[goIndex++], Effect.void);
              },
            });

            yield* Effect.provide(
              Effect.gen(function* () {
                const second = yield* Navigation.navigate("/2", { history: "push" });
                const third = yield* Navigation.navigate("/3", { history: "push" });

                const back = yield* Effect.forkChild(Navigation.back());
                yield* Deferred.await(goStarted[0]);
                assert.isUndefined(back.pollUnsafe());
                activations[0]();
                assert.equal((yield* Fiber.join(back)).key, second.key);
                assert.isTrue(yield* Navigation.canGoForward);

                const forward = yield* Effect.forkChild(Navigation.forward());
                yield* Deferred.await(goStarted[1]);
                assert.isUndefined(forward.pollUnsafe());
                activations[1]();
                assert.equal((yield* Fiber.join(forward)).key, third.key);
                assert.isFalse(yield* Navigation.canGoForward);
                assert.equal((yield* Navigation.traverseTo(third.key)).key, third.key);
                assert.equal(goIndex, 2);
              }),
              fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
            );
          }),
        ),
      1_000,
    );

    it("completes reload with the requested state without reacquiring navigation state", () => {
      const window = mockWindow();
      const state = { version: "reloaded" };

      const reload = Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const current = yield* Navigation.currentEntry;
            const reloaded = yield* Navigation.reload({ state });

            assert.equal(reloaded.key, current.key);
            assert.notEqual(reloaded.id, current.id);
            assert.deepEqual(reloaded.state, state);
            assert.deepEqual((yield* Navigation.currentEntry).state, state);
          }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      );

      return reload.then(() =>
        Effect.runPromise(
          Effect.provide(
            Effect.gen(function* () {
              assert.deepEqual((yield* Navigation.currentEntry).state, state);
            }),
            fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
          ),
        ),
      );
    }, 1_000);

    it("maps native history failures and clears the matching transition", () => {
      const error = new DOMException("State could not be cloned", "DataCloneError");
      const window = mockWindow({ pushStateError: error });

      return Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const result = yield* Effect.result(Navigation.navigate("/fails", { history: "push" }));

            assert.isTrue(Result.isFailure(result));
            if (Result.isFailure(result)) {
              assert.equal(result.failure._tag, "@typed/navigation/NavigationError");
              assert.equal(result.failure.error, error);
            }
            assert.isTrue(Option.isNone(yield* Navigation.transition.asComputed()));
          }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      );
    });

    it("maps native traversal failures and clears the pending transition", () => {
      const error = new DOMException("Traversal failed", "InvalidStateError");
      const window = mockWindow({ goError: error });

      return Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            yield* Navigation.navigate("/managed", { history: "push" });
            const result = yield* Effect.result(Navigation.back());

            assert.isTrue(Result.isFailure(result));
            if (Result.isFailure(result)) {
              assert.equal(result.failure._tag, "@typed/navigation/NavigationError");
              assert.equal(result.failure.error, error);
            }
            assert.isTrue(Option.isNone(yield* Navigation.transition.asComputed()));
          }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      );
    });

    it("finishes the reactive commit when interrupted after pushState", () => {
      const window = mockWindow({
        onPushState: () => Fiber.getCurrent()?.interruptUnsafe(),
      });

      return Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const navigation = yield* Navigation;
            const fiber = yield* Effect.forkChild(
              navigation.navigate("/committed", { history: "push" }),
            );
            yield* Fiber.await(fiber);

            assert.equal((yield* navigation.currentEntry).url.pathname, "/committed");
            assert.equal(window.location.pathname, "/committed");
            assert.isTrue(Option.isNone(yield* navigation.transition.asComputed()));
          }),
          fromWindow(window).pipe(Layer.provideMerge(IdsTest())),
        ),
      );
    });
  });

  it("rejects non-finite and fractional navigation deltas", () => {
    const from = {
      id: "from-id",
      key: "from-key",
      url: "http://localhost/from",
      state: null,
      sameDocument: true,
    };
    const to = {
      id: "to-id",
      key: "to-key",
      url: "http://localhost/to",
      state: null,
      sameDocument: true,
    };
    const event = {
      type: "traverse",
      from,
      to,
      info: null,
    };

    for (const delta of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1.5]) {
      assert.throws(() => Schema.decodeUnknownSync(BeforeNavigationEvent)({ ...event, delta }));
    }
    assert.equal(
      Schema.decodeUnknownSync(BeforeNavigationEvent)({ ...event, delta: -2 }).delta,
      -2,
    );
  });
});

class NavigationTestTimeout extends Data.TaggedError("NavigationTestTimeout")<{
  readonly message: string;
}> {}

const awaitCurrentPath = (
  path: string,
  attempts = 100,
): Effect.Effect<void, NavigationTestTimeout, Navigation> =>
  Effect.gen(function* () {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if ((yield* Navigation.currentEntry).url.pathname === path) return;
      yield* Effect.yieldNow;
    }
    return yield* new NavigationTestTimeout({ message: `Navigation did not reconcile ${path}` });
  });

const awaitFiberExit = <A, E>(
  fiber: Fiber.Fiber<A, E>,
  attempts = 100,
): Effect.Effect<Exit.Exit<A, E>, NavigationTestTimeout> =>
  Effect.gen(function* () {
    for (let attempt = 0; attempt < attempts; attempt++) {
      const exit = fiber.pollUnsafe();
      if (exit !== undefined) return exit;
      yield* Effect.yieldNow;
    }
    return yield* new NavigationTestTimeout({ message: "Fiber did not complete" });
  });

const awaitBlocking = (
  blocking: BlockNavigation,
  path: string,
  attempts = 100,
): Effect.Effect<Blocking, NavigationTestTimeout> =>
  Effect.gen(function* () {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (yield* blocking.isBlocking) {
        const current = yield* blocking.asComputed();
        if (Option.isSome(current) && current.value.to.url.pathname === path) return current.value;
      }
      yield* Effect.yieldNow;
    }
    return yield* new NavigationTestTimeout({ message: `Navigation did not block ${path}` });
  });

type MockWindow = Window & {
  readonly historyEntries: ReadonlyArray<{ readonly state: unknown; readonly url: string }>;
  readonly setHistoryState: (index: number, state: unknown) => void;
  readonly emitPopState: (state: unknown, url: string) => void;
};

function mockWindow(
  options: {
    readonly onGo?: (delta: number, activate: () => void) => void;
    readonly onPushState?: () => void;
    readonly pushStateError?: unknown;
    readonly goError?: unknown;
    readonly initialState?: unknown;
    readonly baseHref?: string;
  } = {},
): MockWindow {
  const entry = {
    id: "0",
    key: "0",
    url: "https://example.com/",
    sameDocument: true,
    getState: () => ({}),
  };
  const committed = Promise.resolve(entry);
  const finished = Promise.resolve(entry);
  const navigation = {
    currentEntry: entry,
    entries: () => [entry],
    canGoBack: false,
    canGoForward: false,
    transition: null as unknown,
    addEventListener: () => {},
    removeEventListener: () => {},
    navigate: () => ({ committed, finished }),
    back: () => ({ committed, finished }),
    forward: () => ({ committed, finished }),
    traverseTo: () => ({ committed, finished }),
    updateCurrentEntry: () => {},
    reload: () => ({ committed, finished }),
  };

  const mockLocation = {
    origin: "https://example.com",
    href: "https://example.com/",
    pathname: "/",
    search: "",
    hash: "",
  };
  const setLocation = (href: string) => {
    const url = new URL(href, mockLocation.origin);
    mockLocation.href = url.href;
    mockLocation.pathname = url.pathname;
    mockLocation.search = url.search;
    mockLocation.hash = url.hash;
  };
  const historyEntries: Array<{ readonly state: unknown; readonly url: string }> = [
    { state: "initialState" in options ? options.initialState : null, url: mockLocation.href },
  ];
  let historyIndex = 0;
  const popstateListeners: Array<(event: PopStateEvent) => void> = [];
  const history = {
    get state() {
      return historyEntries[historyIndex].state;
    },
    get length() {
      return historyEntries.length;
    },
    pushState(state: unknown, _unused: string, url: string) {
      if (options.pushStateError !== undefined) throw options.pushStateError;
      historyEntries.splice(historyIndex + 1, Infinity, {
        state,
        url: new URL(url, mockLocation.origin).href,
      });
      historyIndex += 1;
      setLocation(historyEntries[historyIndex].url);
      options.onPushState?.();
    },
    replaceState(state: unknown, _unused: string, url: string) {
      historyEntries[historyIndex] = {
        state,
        url: new URL(url, mockLocation.origin).href,
      };
      setLocation(historyEntries[historyIndex].url);
    },
    go(delta: number) {
      if (options.goError !== undefined) throw options.goError;
      const nextIndex = historyIndex + delta;
      if (nextIndex < 0 || nextIndex >= historyEntries.length) return;
      const activate = () => {
        historyIndex = nextIndex;
        setLocation(historyEntries[historyIndex].url);
        const event = { state: historyEntries[historyIndex].state } as PopStateEvent;
        popstateListeners.forEach((listener) => listener(event));
      };

      if (options.onGo) options.onGo(delta, activate);
      else queueMicrotask(activate);
    },
    back() {},
    forward() {},
  };

  const emitPopState = (state: unknown, url: string) => {
    setLocation(url);
    const event = { state } as PopStateEvent;
    popstateListeners.forEach((listener) => listener(event));
  };

  return {
    location: mockLocation,
    document: {
      querySelector: () => (options.baseHref === undefined ? null : { href: options.baseHref }),
    },
    navigation,
    history,
    historyEntries,
    setHistoryState: (index: number, state: unknown) => {
      historyEntries[index] = { ...historyEntries[index], state };
    },
    emitPopState,
    addEventListener: (_type: string, listener: (event: PopStateEvent) => void) => {
      if (_type === "popstate") popstateListeners.push(listener);
    },
    removeEventListener: (_type: string, listener: (event: PopStateEvent) => void) => {
      if (_type === "popstate") {
        const i = popstateListeners.indexOf(listener);
        if (i !== -1) popstateListeners.splice(i, 1);
      }
    },
  } as unknown as MockWindow;
}

function createDestination(url: string, state: unknown = {}) {
  return {
    id: crypto.randomUUID(),
    key: crypto.randomUUID(),
    url: new URL(url),
    state,
    sameDocument: true,
  };
}
