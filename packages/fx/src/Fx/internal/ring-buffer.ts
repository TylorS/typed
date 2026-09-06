import * as Cause from "effect/Cause";
import { type Effect, flatMap, void as void_ } from "effect/Effect";

const MAX_ARRAY_LENGTH = 0xffff_ffff;
const INVALID_CAPACITY_MESSAGE =
  "Ring buffer capacity must be an integer from 1 through 4294967295";

/** A fixed-capacity FIFO buffer that overwrites its oldest value when full.
 *
 * @remarks
 * ## Why
 *
 * Replay subjects need bounded history with O(1) append cost and deterministic oldest-to-newest
 * replay, without shifting an array on every publication.
 *
 * ## Ownership and lifetime
 *
 * The instance exclusively owns an array of `capacity` slots and retains at most that many values.
 * It acquires no Scope. `clear` replaces the backing array so retained values can be collected;
 * callers decide when that cleanup occurs.
 *
 * ## Errors and complexity
 *
 * Construction throws `Cause.IllegalArgumentError` synchronously unless capacity is an integer from
 * 1 through 4,294,967,295. `push`, `size`, and indexed access are O(1). `forEach` builds and executes
 * an O(size) sequential Effect chain. This published implementation utility may change between
 * prereleases.
 *
 * @example
 * ```ts
 * import { RingBuffer } from "@typed/fx/Fx/internal/ring-buffer"
 * import * as Effect from "effect/Effect"
 *
 * const buffer = new RingBuffer<number>(2)
 * buffer.push(1)
 * buffer.push(2)
 * buffer.push(3)
 * Effect.runSync(buffer.forEach((value) => Effect.sync(() => console.log(value)))) // 2, 3
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export class RingBuffer<A> {
  /** Maximum number of values retained by this buffer.
   *
   * @remarks
   * ## Why
   *
   * A fixed bound makes replay retention and overwrite behavior predictable.
   *
   * ## Ownership and lifetime
   *
   * Immutable scalar metadata retained for the instance lifetime.
   *
   * @since 1.0.0
   * @category state
   */
  readonly capacity: number;

  /** Allocates an empty backing array for a validated capacity.
   *
   * @remarks
   * ## Why
   *
   * Validating at the allocation boundary prevents modulo-by-zero behavior, impossible array
   * lengths, and an unbounded replay contract before any value can be retained.
   *
   * ## Ownership and lifetime
   *
   * Construction allocates and exclusively owns one sparse array of `capacity` slots. No Scope or
   * Effect is acquired. Invalid capacity is thrown synchronously as `Cause.IllegalArgumentError`,
   * not returned through an Effect error channel.
   *
   * @example
   * ```ts
   * import { RingBuffer } from "@typed/fx/Fx/internal/ring-buffer"
   * import * as Cause from "effect/Cause"
   *
   * const buffer = new RingBuffer<string>(2)
   * buffer.capacity // 2
   *
   * try {
   *   new RingBuffer(0)
   * } catch (error) {
   *   Cause.isIllegalArgumentError(error) // true
   * }
   * ```
   *
   * @since 1.0.0
   * @category constructors
   */
  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_ARRAY_LENGTH) {
      throw new Cause.IllegalArgumentError(INVALID_CAPACITY_MESSAGE);
    }
    this.capacity = capacity;
    this._buffer = Array(this.capacity);
  }

  private _buffer: Array<A>;
  private _size = 0;
  private _head = 0;

  /** Current number of retained values, from zero through `capacity`.
   *
   * @remarks
   * ## Why
   *
   * Callers can inspect occupancy without exposing backing-array indices.
   *
   * ## Ownership and lifetime
   *
   * Reading the counter is O(1) and acquires no resources.
   *
   * @since 1.0.0
   * @category state
   */
  get size() {
    return this._size;
  }

  /** Appends one value, overwriting the oldest value when the buffer is full.
   *
   * @remarks
   * ## Why
   *
   * The operation mutates this buffer in O(1) time and performs no Effect or cleanup action.
   *
   * ## Ownership and lifetime
   *
   * The buffer retains `a` until overwrite, `clear`, or collection; an overwritten value is released.
   *
   * @since 1.0.0
   * @category mutations
   */
  push(a: A) {
    this._buffer[this._head] = a;
    this._head = (this._head + 1) % this.capacity;
    if (this._size < this.capacity) {
      this._size++;
    }
  }

  private at(index: number): A {
    if (this._size < this.capacity) {
      return this._buffer[index];
    }
    return this._buffer[(this._head + index) % this.capacity];
  }

  /** Runs an Effect for each retained value in oldest-to-newest order.
   *
   * @remarks
   * ## Why
   *
   * Effects are sequenced with `flatMap`; failure, defect, or interruption stops later values. The
   * callback receives a zero-based replay index rather than the backing-array index. The method
   * preserves callback errors and services and does not clear the buffer.
   *
   * `_size` and the first callback invocation are captured eagerly when `forEach` is called. For
   * sizes greater than one, later slots are read and their callbacks are invoked lazily as the
   * returned Effect executes. This is deliberately not a snapshot: mutating or clearing the buffer
   * between construction and execution can combine the earlier first Effect with later values from
   * the mutated buffer. Callers that require one coherent replay must not mutate the buffer until
   * the Effect completes.
   *
   * ## Ownership and lifetime
   *
   * The returned Effect borrows the current retained values while executing and owns no additional
   * lifetime after completion.
   *
   * @since 1.0.0
   * @category effects
   */
  forEach<B, E2, R2>(f: (a: A, i: number) => Effect<B, E2, R2>) {
    switch (this._size) {
      case 0:
        return void_;
      case 1:
        return f(this.at(0), 0);
      case 2:
        return flatMap(f(this.at(0), 0), () => f(this.at(1), 1));
      case 3:
        return flatMap(f(this.at(0), 0), () => flatMap(f(this.at(1), 1), () => f(this.at(2), 2)));
      default: {
        let eff: Effect<unknown, E2, R2> = f(this.at(0), 0);
        for (let i = 1; i < this._size; i++) {
          const idx = i;
          eff = flatMap(eff, () => f(this.at(idx), idx));
        }
        return eff;
      }
    }
  }

  /** Drops all retained values and resets insertion to the start of a fresh backing array.
   *
   * @remarks
   * ## Why
   *
   * Capacity is unchanged. The operation acquires no Scope and runs synchronously.
   *
   * ## Ownership and lifetime
   *
   * Replacing the array releases every retained value from this instance at once.
   *
   * @since 1.0.0
   * @category mutations
   */
  clear() {
    this._buffer = Array(this.capacity);
    this._size = 0;
    this._head = 0;
  }
}
