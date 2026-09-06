import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Emits typed failures as values and fails with the first successful value.
 *
 * @remarks
 * ## Why
 *
 * Channel inversion makes an error-producing computation composable through
 * success operators, mirroring Effect's `flip` without erasing either type.
 *
 * ## Ownership and lifetime
 *
 * If a source Cause contains any Fail, the first typed error `e` is delivered
 * as success and the entire Cause is discarded, including defects or interrupts
 * composed beside that Fail. A Cause with no Fail propagates unchanged. A source
 * success `a` terminates the returned Fx with typed failure `a`. The source
 * subscription is the only lifetime and external interruption still stops it.
 *
 * @example
 * ```ts
 * import { flip } from "@typed/fx/Fx"
 * import { fail } from "@typed/fx/Fx"
 *
 * const errorsAsValues = flip(fail("offline"))
 * ```
 *
 * @example The first Fail wins over the rest of a composite Cause
 * ```ts
 * import { Cause } from "effect"
 * import { flip } from "@typed/fx/Fx"
 * import { failCause } from "@typed/fx/Fx"
 *
 * const composite = Cause.combine(Cause.fail("offline"), Cause.die("decoder defect"))
 * const errorValue = flip(failCause(composite))
 * ```
 *
 * @param fx - The `Fx` stream.
 * @returns An `Fx` where errors are successes and successes are errors.
 * @since 1.0.0
 * @category Errors and recovery
 */
export const flip = <A, E, R>(fx: Fx<A, E, R>): Fx<E, A, R> =>
  make<E, A, R>((sink) => fx.run(sinkCore.flip(sink)));
