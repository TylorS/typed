import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type { Scope } from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";
import type { Many } from "../many.js";
import { HtmlRenderEvent, isHtmlRenderEvent, type RenderEvent } from "../RenderEvent.js";
import { renderToString } from "./encoding.js";
import {
  encodeManyKey,
  getUniqueManyKeys,
  manyMarkerFromEncodedKey,
  validateHydratableManyKeys,
} from "./manyKey.js";

export function renderManyToHtml<A, E, R>(
  many: Many<A, E, R>,
): Fx.Fx<RenderEvent, E | Cause.IllegalArgumentError, R | Scope> {
  return Fx.gen(function* () {
    const initial = yield* Fx.first(many.values);
    if (Option.isNone(initial) || initial.value.length === 0) return Fx.empty;
    const uniqueKeys = getUniqueManyKeys(initial.value, many.getKey);
    if (Cause.isIllegalArgumentError(uniqueKeys)) return Fx.fail(uniqueKeys);
    const invalidKeys = validateHydratableManyKeys(uniqueKeys);
    if (invalidKeys !== undefined) return Fx.fail(invalidKeys);
    const localSymbolOrdinals = new Map<symbol, number>();
    const lastIndex = initial.value.length - 1;
    return Fx.mergeOrdered(
      ...initial.value.map((value, index) => {
        const key = uniqueKeys[index];
        return renderValue(
          value,
          key,
          encodeManyKey(key, localSymbolOrdinals),
          many.render,
          index === lastIndex,
        );
      }),
    );
  });
}

function renderValue<A, B extends PropertyKey, R2, E2>(
  value: A,
  key: B,
  encodedKey: string,
  render: (value: RefSubject.RefSubject<A>, key: B) => Fx.Fx<RenderEvent, E2, R2 | Scope>,
  last: boolean,
): Fx.Fx<RenderEvent, E2, R2 | Scope> {
  return Fx.unwrap(
    Effect.map(RefSubject.make(value), (ref) =>
      render(RefSubject.slice(ref, 0, 1), key).pipe(
        Fx.dropAfter((event) => isHtmlRenderEvent(event) && event.last),
        Fx.map((event) => HtmlRenderEvent(renderToString(event, ""), false)),
        Fx.append(HtmlRenderEvent(manyMarkerFromEncodedKey(encodedKey), last)),
      ),
    ),
  );
}
