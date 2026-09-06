import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type { Uuid5 } from "../Uuid5.js";
import { Uuid5Namespace, uuid5 } from "../Uuid5.js";
import { CuidState, cuid } from "../Cuid.js";
import { DateTimes } from "../DateTimes.js";
import { ksuid } from "../Ksuid.js";
import { nanoId } from "../NanoId.js";
import { RandomValues } from "../RandomValues.js";
import { ulid } from "../Ulid.js";
import { uuid4 } from "../Uuid4.js";
import { Uuid7State, uuid7 } from "../Uuid7.js";

export const makeLazyIds = (envData: string) =>
  Effect.gen(function* () {
    const services = yield* Effect.context<DateTimes | RandomValues>();
    const getCuidState = yield* Effect.cached(Effect.provide(CuidState.make(envData), services));
    const getUuid7State = yield* Effect.cached(Effect.provide(Uuid7State.make, services));

    const uuid5_: {
      (
        namespace: Uuid5Namespace,
      ): (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      (name: string, namespace: Uuid5Namespace): Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      readonly dns: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      readonly url: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      readonly oid: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
      readonly x500: (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
    } = Object.assign(
      dual(2, (name: string, namespace: Uuid5Namespace) =>
        Effect.provide(uuid5(name, namespace), services),
      ),
      {
        dns: uuid5(Uuid5Namespace.DNS),
        url: uuid5(Uuid5Namespace.URL),
        oid: uuid5(Uuid5Namespace.OID),
        x500: uuid5(Uuid5Namespace.X500),
      },
    );

    return {
      cuid: Effect.flatMap(getCuidState, (state) => Effect.provideService(cuid, CuidState, state)),
      ksuid: Effect.provide(ksuid, services),
      nanoId: Effect.provide(nanoId, services),
      ulid: Effect.provide(ulid, services),
      uuid4: Effect.provide(uuid4, services),
      uuid5: uuid5_,
      uuid7: Effect.flatMap(getUuid7State, (state) =>
        Effect.provideService(uuid7, Uuid7State, state),
      ),
    };
  });
