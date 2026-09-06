import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import { CuidState, type Cuid, type CuidSeed } from "../Cuid.js";
import { Ids } from "../Ids.js";
import { IdsTest, type IdsTestOptions } from "../IdsTest.js";
import type { Ksuid } from "../Ksuid.js";
import type { NanoId } from "../NanoId.js";
import type { Ulid } from "../Ulid.js";
import type { Uuid4 } from "../Uuid4.js";
import type { Uuid5, Uuid5Namespace } from "../Uuid5.js";
import { Uuid7State, type Uuid7, type Uuid7Seed } from "../Uuid7.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type CuidStateService = Effect.Success<ReturnType<typeof CuidState.make>>;
type Uuid7StateService = Effect.Success<typeof Uuid7State.make>;

type _CuidStateNextIsEffect = Assert<
  CuidStateService["next"] extends Effect.Effect<CuidSeed, never, never> ? true : false
>;
type _Uuid7StateNextIsEffect = Assert<
  Uuid7StateService["next"] extends Effect.Effect<
    Uuid7Seed,
    Cause.IllegalArgumentError,
    never
  >
    ? true
    : false
>;
type _CuidStateNextIsNotFunction = Assert<
  Equal<CuidStateService["next"] extends (argument: never) => unknown ? true : false, false>
>;
type _Uuid7StateNextIsNotFunction = Assert<
  Equal<Uuid7StateService["next"] extends (argument: never) => unknown ? true : false, false>
>;

type _IdsCuid = Assert<Equal<typeof Ids.cuid, Effect.Effect<Cuid, never, Ids>>>;
type _IdsKsuid = Assert<
  Equal<typeof Ids.ksuid, Effect.Effect<Ksuid, Cause.IllegalArgumentError, Ids>>
>;
type _IdsNanoId = Assert<Equal<typeof Ids.nanoId, Effect.Effect<NanoId, never, Ids>>>;
type _IdsUlid = Assert<
  Equal<typeof Ids.ulid, Effect.Effect<Ulid, Cause.IllegalArgumentError, Ids>>
>;
type _IdsUuid4 = Assert<Equal<typeof Ids.uuid4, Effect.Effect<Uuid4, never, Ids>>>;
type _IdsUuid7 = Assert<
  Equal<typeof Ids.uuid7, Effect.Effect<Uuid7, Cause.IllegalArgumentError, Ids>>
>;

declare const namespace: Uuid5Namespace;
declare const name: string;

const curriedUuid5 = Ids.uuid5(namespace);
const directUuid5 = Ids.uuid5(name, namespace);

type _CurriedUuid5 = Assert<
  Equal<
    typeof curriedUuid5,
    (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>
  >
>;
type _DirectUuid5 = Assert<
  Equal<typeof directUuid5, Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>>
>;

type _IdsDefault = Assert<
  Equal<
    typeof Ids.Default,
    Layer.Layer<
      Ids | import("../DateTimes.js").DateTimes | import("../RandomValues.js").RandomValues
    >
  >
>;
type _IdsHasNoTestLayer = Assert<Equal<"Test" extends keyof typeof Ids ? true : false, false>>;
type _IdsTestOptions = Assert<
  Equal<IdsTestOptions, { readonly currentTime?: number | string | Date; readonly envData?: string }>
>;
type _IdsTest = Assert<
  Equal<
    ReturnType<typeof IdsTest>,
    Layer.Layer<
      | Ids
      | import("../DateTimes.js").DateTimes
      | import("../RandomValues.js").RandomValues
      | import("../Uuid7.js").Uuid7State
      | import("effect/testing").TestClock.TestClock,
      Cause.IllegalArgumentError
    >
  >
>;
