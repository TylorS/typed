import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Equal from "effect/Equal";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { identity } from "effect/Function";
import * as Scope from "effect/Scope";
import { RefSubject, Sink } from "@typed/fx";
import { HydrateContext } from "../HydrateContext.js";
import type { Many } from "../many.js";
import type { TemplateContext } from "../Render.js";
import type { RenderEvent } from "../RenderEvent.js";
import { diffable, getAllSiblingsBetween } from "../Wire.js";
import { diffChildren, renderEventToArray } from "./dom.js";
import { diff, insertOrMoveBefore, type DiffOperations } from "./diff.js";
import type { HydrationMany } from "./hydration.js";
import { getChildNodes } from "./hydration.js";
import { encodeManyKey, getUniqueManyKeys, validateHydratableManyKeys } from "./manyKey.js";

type ManyEntry<A> = {
  readonly ref: RefSubject.RefSubject<A>;
  readonly range: ManyRange;
  value: A;
};

type ManyRange = {
  key?: PropertyKey;
  readonly marker?: Comment;
  placeholder?: Comment;
  nodes: Array<Node>;
  mounted: boolean;
  dispose: Effect.Effect<void>;
  active: boolean;
};

export function renderManyToDom<A, E, R>(
  many: Many<A, E, R>,
  endComment: Comment,
  index: number,
  ctx: TemplateContext,
  hydrateContext?: HydrateContext,
): Effect.Effect<unknown, never, R | Scope.Scope> {
  ctx.expected++;
  const entries = new Map<PropertyKey, ManyEntry<A>>();
  const localSymbolOrdinals = new Map<symbol, number>();
  const hydratedEntries = getHydratedEntries(hydrateContext);
  let order = Array.from(hydratedEntries.values());
  let initialized = false;
  const get = diffable(ctx.document);
  let removed: Array<ManyRange> = [];
  const first = (range: ManyRange): Node => get(range.nodes[0], 0);
  const last = (range: ManyRange): Node => get(range.nodes[range.nodes.length - 1], -0);
  const operations: DiffOperations<ManyRange> = {
    first,
    last,
    insert: (range, before) => {
      const parent = endComment.parentNode!;
      if (!range.mounted) {
        for (const node of range.nodes) parent.insertBefore(get(node, 1), before);
        range.mounted = true;
      } else {
        // Read the live range: nested holes may have changed since the child emitted.
        let node = first(range);
        const end = last(range);
        if (node === before || end.nextSibling === before) return;
        while (node !== end) {
          const next = node.nextSibling!;
          insertOrMoveBefore(parent, node, before);
          node = next;
        }
        insertOrMoveBefore(parent, end, before);
      }
    },
    remove: (range) => {
      range.active = false;
      if (range.key !== undefined) entries.delete(range.key);
      detach(range);
      removed.push(range);
    },
  };
  const detach = (range: ManyRange) => {
    let node = first(range);
    const end = last(range);
    if (node === end) {
      node.parentNode!.removeChild(node);
    } else {
      // Preserve sibling boundaries for nested renderers while their scopes
      // finish closing, without leaving removed output in the live document.
      const fragment = ctx.document.createDocumentFragment();
      while (node !== end) {
        const next = node.nextSibling!;
        fragment.appendChild(node);
        node = next;
      }
      fragment.appendChild(end);
    }
  };
  const release = () => {
    if (initialized) return;
    initialized = true;
    ctx.refCounter.release(index);
  };

  const reconcile = (values: ReadonlyArray<A>) =>
    Effect.gen(function* () {
      const keys = getUniqueManyKeys(values, many.getKey);
      if (Cause.isIllegalArgumentError(keys)) return yield* ctx.onCause(Cause.fail(keys));
      const invalidKeys = hydrateContext && validateHydratableManyKeys(keys);
      if (invalidKeys) return yield* ctx.onCause(Cause.fail(invalidKeys));

      // oxlint-disable-next-line unicorn/no-new-array
      const next: Array<ManyRange> = [];
      for (let itemIndex = 0; itemIndex < values.length; itemIndex++) {
        const value = values[itemIndex];
        const key = keys[itemIndex];
        let entry = entries.get(key);
        if (entry === undefined) {
          // Encoding is only needed when adopting server output.
          const encodedKey = hydrateContext ? encodeManyKey(key, localSymbolOrdinals) : "";
          const pending = yield* makeEntry(
            many,
            value,
            key,
            encodedKey,
            ctx,
            hydrateContext,
            hydratedEntries.get(encodedKey),
          );
          entry = pending.entry;
          entries.set(key, entry);
          next[itemIndex] = entry.range;
          yield* pending.start;
          if (entry.range.nodes.length === 0)
            entry.range.nodes = emptyNodes(ctx.document, entry.range);
        } else {
          next[itemIndex] = entry.range;
          if (entry.value !== value && !Equal.equals(entry.value, value)) {
            entry.value = value;
            yield* RefSubject.set(entry.ref, value);
          }
        }
      }

      // Stable entries ARE the keyed identities. One diff performs the DOM work
      // directly; there is no flattened list of nodes to reconcile afterwards.
      order = diff(order, next, operations, endComment);
      hydratedEntries.clear();
      if (removed.length > 0) {
        const disposing = removed;
        removed = [];
        for (const range of disposing) {
          // Reconciliation must not await arbitrary child finalizers. The
          // parent still owns cleanup, which must finish once its scope closes.
          yield* Effect.forkIn(
            range.dispose.pipe(Effect.catchCause(ctx.onCause), Effect.uninterruptible),
            ctx.scope,
            { startImmediately: true },
          );
        }
      }
      release();
    });

  return many.values
    .run(Sink.make(ctx.onCause, reconcile))
    .pipe(Effect.onExit(() => Effect.sync(release)));
}

function makeEntry<A, E, R>(
  many: Many<A, E, R>,
  value: A,
  key: PropertyKey,
  encodedKey: string,
  ctx: TemplateContext,
  hydrateContext: HydrateContext | undefined,
  hydratedEntry: ManyRange | undefined,
): Effect.Effect<
  { readonly entry: ManyEntry<A>; readonly start: Effect.Effect<void, never, R> },
  never,
  Scope.Scope
> {
  return Effect.gen(function* () {
    const scope = yield* Scope.fork(ctx.scope, "sequential");
    const ref = yield* RefSubject.make(value).pipe(Effect.provideService(Scope.Scope, scope));
    const range: ManyRange = hydratedEntry ?? {
      nodes: [],
      mounted: false,
      dispose: Effect.void,
      active: true,
    };
    range.key = key;
    range.dispose = Scope.close(scope, Exit.void);
    const entry: ManyEntry<A> = { ref, range, value };
    const get = diffable(ctx.document);
    const ready = hydratedEntry === undefined ? undefined : yield* Deferred.make<void>();
    let isHydrating = hydratedEntry !== undefined;
    let hasHydratedBoundaries = isHydrating;
    const update = (event: RenderEvent) =>
      Effect.sync(() => {
        if (!range.active) return;
        const rendered = toNodes(ctx.document, event);
        const nodes =
          range.marker !== undefined
            ? [...rendered, range.marker]
            : rendered.length === 0
              ? emptyNodes(ctx.document, range)
              : rendered;
        if (!(isHydrating && rendered.length > 0 && range.nodes.includes(get(rendered[0], 0)))) {
          // Matching hydration keeps its existing template boundaries. On a
          // later child replacement, read everything between those boundaries
          // so nested changes cannot leave stale nodes behind.
          const previous =
            !hasHydratedBoundaries || range.nodes[0] === range.marker
              ? range.nodes
              : [
                  range.nodes[0],
                  ...getAllSiblingsBetween(range.nodes[0], range.marker!),
                  range.marker!,
                ];
          range.nodes = range.mounted
            ? diffChildren(
                get(range.nodes[range.nodes.length - 1], -0).nextSibling!,
                previous,
                nodes,
                get,
              )
            : nodes;
          hasHydratedBoundaries = false;
        }
        isHydrating = false;
      }).pipe(
        ready === undefined ? identity : Effect.tap(() => Deferred.succeed(ready, undefined)),
      );
    const child = many
      .render(ref, key)
      .run(Sink.make(ctx.onCause, update))
      .pipe(Effect.provideService(Scope.Scope, scope)) as Effect.Effect<unknown, never, R>;
    const hydratedChild =
      hydrateContext === undefined
        ? child
        : (Effect.provideService(child, HydrateContext, {
            ...hydrateContext,
            hydrate: true,
            manyKey: encodedKey,
          }) as Effect.Effect<unknown, never, R>);
    const runnable =
      ready === undefined
        ? hydratedChild
        : Effect.ensuring(hydratedChild, Deferred.succeed(ready, undefined));
    const start = Effect.gen(function* () {
      yield* Effect.forkIn(runnable, scope, { startImmediately: true });
      if (ready !== undefined) yield* Deferred.await(ready);
    });

    return { entry, start };
  });
}

function getHydratedEntries(hydrateContext: HydrateContext | undefined): Map<string, ManyRange> {
  const entries = new Map<string, ManyRange>();
  if (hydrateContext?.where._tag !== "hole") return entries;
  const manyNodes = getChildNodes(hydrateContext.where).filter(
    (node): node is HydrationMany => node._tag === "many",
  );
  let previous: Node = hydrateContext.where.startComment;
  for (const many of manyNodes) {
    entries.set(many.key, {
      marker: many.comment,
      nodes: [...getAllSiblingsBetween(previous, many.comment), many.comment],
      mounted: true,
      dispose: Effect.void,
      active: true,
    });
    previous = many.comment;
  }
  return entries;
}

function toNodes(document: Document, event: RenderEvent): Array<Node> {
  const nodes = renderEventToArray(document, event);
  // Snapshot native fragments once; retain Wires as live bounded ranges.
  return nodes.some((node) => node.nodeType === node.DOCUMENT_FRAGMENT_NODE)
    ? nodes.flatMap((node) =>
        node.nodeType === node.DOCUMENT_FRAGMENT_NODE ? Array.from(node.childNodes) : [node],
      )
    : nodes;
}

function emptyNodes(document: Document, range: ManyRange): Array<Node> {
  // Empty and asynchronous children still need a position. Nonempty client
  // output uses its own first/last nodes, without an extra comment per item.
  return [(range.placeholder ??= document.createComment(""))];
}
