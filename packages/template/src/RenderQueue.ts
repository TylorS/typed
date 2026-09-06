import { constVoid } from "effect/Function";

/**
 * The nominal key implemented by every Typed render queue.
 *
 * @remarks
 * ## Why
 *
 * Renderer extensions can identify the scheduling contract without depending
 * on one concrete browser scheduler.
 *
 * ## Ownership and lifetime
 *
 * The string is immutable metadata and owns no scheduled work.
 *
 * @example
 * ```ts
 * import { RenderQueueTypeId } from "@typed/template/RenderQueue"
 *
 * const key = RenderQueueTypeId
 * ```
 *
 * @since 1.0.0
 * @category Scheduling protocol
 */
export const RenderQueueTypeId = "@typed/template/RenderQueue";

/**
 * The literal type of `RenderQueueTypeId`.
 *
 * @remarks
 * ## Why
 *
 * The literal type provides nominal evidence on queue instances.
 *
 * ## Ownership and lifetime
 *
 * This compile-time facet owns no scheduler resource.
 *
 * @example
 * ```ts
 * import { RenderQueueTypeId, type RenderQueueTypeId as Id } from "@typed/template/RenderQueue"
 *
 * const id: Id = RenderQueueTypeId
 * ```
 *
 * @since 1.0.0
 * @category Scheduling protocol
 */
export type RenderQueueTypeId = typeof RenderQueueTypeId;

type Entry = { task: () => void; dispose: () => void };

/**
 * An abstract base class for managing the execution of rendering tasks.
 * It allows prioritizing updates and scheduling them using different strategies
 * (e.g., `requestAnimationFrame`, `requestIdleCallback`, `setTimeout`, or synchronous execution).
 *
 * @remarks
 * ## Why
 *
 * Fine-grained DOM parts already know what to update; a queue determines when
 * those local mutations run. Keys coalesce superseded work without a virtual
 * tree traversal.
 *
 * ## Ownership and lifetime
 *
 * A queue owns its pending callbacks. Disposing an entry cancels it; disposing
 * the queue cancels the active scheduler and drops all pending buckets. Render
 * Scopes dispose the callbacks they schedule.
 *
 * ## Ordering
 *
 * Lower numeric priorities run first. Re-adding the same key and priority
 * disposes and replaces the previous entry.
 *
 * @example
 * ```ts
 * import { MixedRenderQueue, RenderPriority } from "@typed/template/RenderQueue"
 *
 * const queue = new MixedRenderQueue()
 *
 * // Add a high-priority synchronous task
 * queue.add("task1", () => console.log("High priority"), () => {}, RenderPriority.Sync)
 *
 * // Add a medium-priority RAF task
 * queue.add("task2", () => console.log("Medium priority"), () => {}, RenderPriority.Raf(5))
 *
 * // Add a low-priority idle task
 * queue.add("task3", () => console.log("Low priority"), () => {}, RenderPriority.Idle(1))
 * ```
 *
 * @since 1.0.0
 * @category Scheduled render work
 */
export abstract class RenderQueue implements Disposable {
  protected readonly buckets: Array<KeyedPriorityBucket<Entry>> = [];
  protected scheduled: Disposable | undefined = undefined;

  /** Nominal evidence that this instance implements Typed's queue contract.
   *
   * @remarks
   * ## Why
   * Identifies renderer scheduling without selecting a concrete strategy.
   *
   * ## Ownership and lifetime
   * Immutable metadata owned by the queue.
   *
   * @since 1.0.0
   * @category Scheduled render work
   */
  readonly [RenderQueueTypeId]: RenderQueueTypeId = RenderQueueTypeId;

  /**
   * Adds a task to the render queue.
   *
   * @param key - A unique key to identify the task (used for deduplication/cancellation).
   * @param task - The function to execute.
   * @param dispose - A cleanup function to run after the task is executed.
   * @param priority - The priority of the task. Higher priority tasks may run sooner depending on the implementation.
   * @returns A Disposable that can be used to cancel the task.
   *
   * @remarks
   * ## Why
   *
   * Keyed replacement coalesces stale local DOM work before it runs.
   *
   * ## Ownership and lifetime
   *
   * The queue owns `task` and `dispose` until execution, replacement, returned
   * Disposable cancellation, or queue disposal.
   *
   * @since 1.0.0
   * @category Scheduled render work
   */
  readonly add: (
    key: unknown,
    task: () => void,
    dispose: () => void,
    priority: number,
  ) => Disposable = (key, task, dispose, priority) => {
    // Disposable is available under the "es2022" or later lib in tsconfig.json (e.g., "lib": ["es2022"])
    insert(this.buckets, priority, key, { task, dispose }, (entry) => entry.dispose());
    this.scheduleNext();
    return disposable(() => remove(this.buckets, priority, key));
  };

  /** Cancels the active scheduler and forgets all queued entries.
   *
   * @remarks
   * ## Why
   * Render Scopes need deterministic scheduler cleanup.
   *
   * ## Ownership and lifetime
   * Ends this queue's pending-work lifetime; already executed tasks are unaffected.
   *
   * @since 1.0.0
   * @category Scheduled work cancellation
   */
  readonly [Symbol.dispose]: () => void = () => {
    if (this.scheduled) {
      dispose(this.scheduled);
      this.scheduled = undefined;
    }
    this.buckets.length = 0;
  };

  protected abstract schedule(task: (deadline: IdleDeadline) => void): Disposable;

  protected runTasks(deadline: IdleDeadline): void {
    this.scheduled = undefined;

    while (shouldContinue(deadline) && this.buckets.length > 0) {
      const bucket = this.buckets[0];
      const map = bucket[1];
      const next = map.entries().next();

      if (next.done) {
        this.buckets.shift();
        continue;
      }

      const [key, { dispose, task }] = next.value;
      map.delete(key);
      task();
      dispose();

      if (map.size === 0) {
        const index = this.buckets.indexOf(bucket);
        if (index >= 0) this.buckets.splice(index, 1);
      }
    }

    this.scheduleNext();
  }

  private scheduleNext(): void {
    if (this.buckets.length === 0) {
      dispose(this);
      return;
    }

    if (!this.scheduled) {
      let completedSynchronously = false;
      const scheduled = this.schedule((deadline) => {
        completedSynchronously = true;
        this.runTasks(deadline);
      });
      if (completedSynchronously) {
        dispose(scheduled);
      } else {
        this.scheduled = scheduled;
      }
    }
  }
}

// 16ms to match 60fps
const DEFAULT_DURATION_ALLOWED = 16;
const SYNC_DEADLINE: IdleDeadline = { timeRemaining: () => Infinity, didTimeout: false };

/**
 * A RenderQueue that executes tasks synchronously and immediately.
 *
 * @remarks
 * ## Why
 *
 * Synchronous scheduling is useful for deterministic tests and updates that
 * must complete in the current call stack.
 *
 * ## Ownership and lifetime
 *
 * Tasks run before `add` returns, so the returned Disposable has no pending
 * browser callback to cancel.
 *
 * @example
 * ```ts
 * import { SyncRenderQueue, RenderPriority } from "@typed/template/RenderQueue"
 *
 * const queue = new SyncRenderQueue()
 * queue.add("task", () => console.log("Immediate"), () => {}, RenderPriority.Sync)
 * ```
 *
 * @since 1.0.0
 * @category Immediate scheduling
 */
export class SyncRenderQueue extends RenderQueue {
  protected schedule(task: (deadline: IdleDeadline) => void): Disposable {
    task(SYNC_DEADLINE);
    return disposable(constVoid);
  }
}

/**
 * A RenderQueue that schedules tasks using `setTimeout(..., 0)`.
 *
 * @remarks
 * ## Why
 *
 * Timers provide a web-standard fallback when animation-frame or idle callbacks
 * are unavailable.
 *
 * ## Ownership and lifetime
 *
 * The queue owns the timer ID until execution or disposal; disposal calls
 * `clearTimeout`.
 *
 * @example
 * ```ts
 * import { SetTimeoutRenderQueue } from "@typed/template/RenderQueue"
 *
 * const queue = new SetTimeoutRenderQueue()
 * ```
 *
 * @since 1.0.0
 * @category Timer scheduling
 */
export class SetTimeoutRenderQueue extends RenderQueue {
  protected schedule(task: (deadline: IdleDeadline) => void): Disposable {
    const id = setTimeout(
      () => task(idleDealineFromTime(performance.now(), DEFAULT_DURATION_ALLOWED)),
      0,
    );
    return disposable(() => clearTimeout(id));
  }
}

/**
 * A RenderQueue that schedules tasks using `requestAnimationFrame`.
 * Good for visual updates that should happen before the next repaint.
 *
 * @remarks
 * ## Why
 *
 * Animation-frame scheduling aligns visual DOM work with the browser paint
 * cycle while enforcing a configurable per-frame time budget.
 *
 * ## Ownership and lifetime
 *
 * The queue owns each animation-frame request until it runs or is cancelled by
 * disposal.
 *
 * @example
 * ```ts
 * import { RequestAnimationFrameRenderQueue, RenderPriority } from "@typed/template/RenderQueue"
 *
 * const queue = new RequestAnimationFrameRenderQueue(16) // 16ms budget
 * const status = document.createElement("output")
 * queue.add("update", () => status.replaceChildren("ready"), () => {}, RenderPriority.Raf(5))
 * ```
 *
 * @since 1.0.0
 * @category Frame scheduling
 */
export class RequestAnimationFrameRenderQueue extends RenderQueue {
  /** Maximum work budget exposed through the frame's synthetic IdleDeadline.
   *
   * @remarks
   * ## Why
   * Bounds local queued work so the browser can return to painting.
   *
   * ## Ownership and lifetime
   * Immutable numeric configuration for this queue instance.
   *
   * @since 1.0.0
   * @category Frame scheduling
   */
  readonly durationAllowed: number;
  /** Creates an animation-frame queue with a per-frame millisecond budget.
   *
   * @remarks
   * ## Why
   * Lets applications tune visual work to their frame budget.
   *
   * ## Ownership and lifetime
   * The instance owns animation-frame requests until disposal.
   *
   * @since 1.0.0
   * @category Frame scheduling
   */
  constructor(durationAllowed: number = DEFAULT_DURATION_ALLOWED) {
    super();
    this.durationAllowed = durationAllowed;
  }

  protected schedule(task: (deadline: IdleDeadline) => void): Disposable {
    const id = requestAnimationFrame((time) =>
      task(idleDealineFromTime(time, this.durationAllowed)),
    );
    return disposable(() => cancelAnimationFrame(id));
  }
}

/**
 * A RenderQueue that schedules tasks using `requestIdleCallback`.
 * Good for low-priority background work.
 *
 * @remarks
 * ## Why
 *
 * Idle scheduling defers non-urgent local DOM work until the browser reports
 * available time.
 *
 * ## Ownership and lifetime
 *
 * The queue owns each idle callback until execution or disposal; disposal calls
 * `cancelIdleCallback`.
 *
 * @example
 * ```ts
 * import { RequestIdleCallbackRenderQueue } from "@typed/template/RenderQueue"
 *
 * const queue = new RequestIdleCallbackRenderQueue()
 * ```
 *
 * @since 1.0.0
 * @category Idle scheduling
 */
export class RequestIdleCallbackRenderQueue extends RenderQueue {
  protected schedule(task: (deadline: IdleDeadline) => void): Disposable {
    const id = requestIdleCallback(task);
    return disposable(() => cancelIdleCallback(id));
  }
}

const NONE = disposable(constVoid);

/**
 * A composite RenderQueue that directs tasks to different queues based on their priority.
 * - High priority: Sync
 * - Medium priority: RAF (or setTimeout fallback)
 * - Low priority: IdleCallback (or setTimeout fallback)
 *
 * @remarks
 * ## Why
 *
 * One default queue adapts to platform capabilities while preserving explicit
 * priority semantics.
 *
 * ## Ownership and lifetime
 *
 * The instance exclusively owns its synchronous, frame/timer, and idle/timer
 * child queues. Disposing it disposes all three and their pending callbacks.
 *
 * @example
 * ```ts
 * import { MixedRenderQueue, RenderPriority } from "@typed/template/RenderQueue"
 *
 * const queue = new MixedRenderQueue()
 *
 * // Tasks are automatically routed to the appropriate queue
 * queue.add("sync", () => {}, () => {}, RenderPriority.Sync)
 * queue.add("raf", () => {}, () => {}, RenderPriority.Raf(5))
 * queue.add("idle", () => {}, () => {}, RenderPriority.Idle(1))
 * ```
 *
 * @since 1.0.0
 * @category Mixed scheduling
 */
export class MixedRenderQueue extends RenderQueue {
  private readonly high: RenderQueue;
  private readonly mid: RenderQueue;
  private readonly low: RenderQueue;

  /** Creates a capability-adaptive queue with one visual-work budget.
   *
   * @remarks
   * ## Why
   * Selects frame/idle APIs when present and timers otherwise.
   *
   * ## Ownership and lifetime
   * The instance owns all three child queues until disposal.
   *
   * @since 1.0.0
   * @category Mixed scheduling
   */
  constructor(durationAllowed: number = DEFAULT_DURATION_ALLOWED) {
    super();
    this.high = new SyncRenderQueue();
    this.mid =
      typeof requestAnimationFrame === "function"
        ? new RequestAnimationFrameRenderQueue(durationAllowed)
        : new SetTimeoutRenderQueue();
    this.low =
      typeof requestIdleCallback === "function"
        ? new RequestIdleCallbackRenderQueue()
        : new SetTimeoutRenderQueue();
  }

  /** Routes one keyed task to the scheduler selected by its numeric priority.
   *
   * @remarks
   * ## Why
   * Callers choose urgency without knowing browser capability details.
   *
   * ## Ownership and lifetime
   * The selected child queue owns the entry until execution or disposal.
   *
   * @since 1.0.0
   * @category Mixed scheduling
   */
  override readonly add = (
    key: unknown,
    task: () => void,
    dispose: () => void,
    priority: number,
  ): Disposable => {
    if (priority === RenderPriority.Sync) {
      return this.high.add(key, task, dispose, priority);
    } else if (
      priority > RenderPriority.Sync &&
      priority <= RenderPriority.Raf(RAF_PRIORITY_RANGE)
    ) {
      return this.mid.add(key, task, dispose, priority);
    } else {
      return this.low.add(key, task, dispose, priority);
    }
  };

  // We let the other queues handle the actual scheduling
  protected schedule(): Disposable {
    return NONE;
  }

  /** Disposes every child scheduler and its pending entries.
   *
   * @remarks
   * ## Why
   * Mixed scheduling remains one deterministic resource boundary.
   *
   * ## Ownership and lifetime
   * Ends the lifetime of all pending sync/frame/timer/idle work.
   *
   * @since 1.0.0
   * @category Scheduled work cancellation
   */
  override [Symbol.dispose]: () => void = () => {
    dispose(this.high);
    dispose(this.mid);
    dispose(this.low);
  };
}

const RAF_PRIORITY_RANGE = 10;

/**
 * Defines priority levels for rendering tasks.
 *
 * @remarks
 * ## Why
 *
 * A compact numeric protocol lets directives and renderer extensions select
 * scheduling without importing concrete queue classes.
 *
 * ## Ownership and lifetime
 *
 * Priority values are immutable numbers and own no work.
 *
 * @example
 * ```ts
 * import { RenderPriority } from "@typed/template/RenderQueue"
 *
 * // Synchronous execution (highest priority)
 * const syncPriority = RenderPriority.Sync
 *
 * // RequestAnimationFrame priority (0-10)
 * const rafPriority = RenderPriority.Raf(5)
 *
 * // Idle callback priority (lowest priority)
 * const idlePriority = RenderPriority.Idle(1)
 * ```
 *
 * @since 1.0.0
 * @category Render priorities
 */
export const RenderPriority = {
  /**
   * Immediate, synchronous execution.
   *
   * @remarks
   * ## Why
   * Selects the current call stack for urgent or deterministic updates.
   *
   * ## Ownership and lifetime
   * The number owns no task.
   *
   * @since 1.0.0
   * @category Render priorities
   */
  Sync: -1,
  /**
   * Scheduled via requestAnimationFrame.
   * @param priority - A value between 0 and 10.
   *
   * @remarks
   * ## Why
   * Maps visual urgency into the queue's bounded frame-priority range.
   *
   * ## Ownership and lifetime
   * Purely computes a number and schedules nothing.
   *
   * @since 1.0.0
   * @category Render priorities
   */
  Raf: (priority: number) => Math.max(0, Math.min(priority, RAF_PRIORITY_RANGE)),
  /**
   * Scheduled via requestIdleCallback.
   *
   * @remarks
   * ## Why
   * Places background work after the frame-priority range.
   *
   * ## Ownership and lifetime
   * Purely computes a number and schedules nothing.
   *
   * @since 1.0.0
   * @category Render priorities
   */
  Idle: (priority: number) => RAF_PRIORITY_RANGE + priority,
} as const;

function idleDealineFromTime(startTime: number, durationAllowed: number): IdleDeadline {
  return {
    timeRemaining: () => {
      const elapsed = performance.now() - startTime;
      return Math.max(0, durationAllowed - elapsed);
    },
    didTimeout: false,
  };
}

function disposable(f: () => void): Disposable {
  return {
    [Symbol.dispose]: f,
  };
}

function dispose(self: Disposable): void {
  if (self === NONE) return;
  self[Symbol.dispose]();
}

function shouldContinue(deadline: IdleDeadline): boolean {
  return deadline.timeRemaining() > 0;
}

type KeyedPriorityBucket<A> = [priority: number, Map<unknown, A>];

function insert<A>(
  buckets: Array<KeyedPriorityBucket<A>>,
  priority: number,
  key: unknown,
  task: A,
  onRemoved: (task: A) => void,
): void {
  const index = binarySearch(buckets, priority);
  if (index === buckets.length || buckets[index][0] !== priority) {
    buckets.splice(index, 0, [priority, new Map([[key, task]])]);
  } else {
    const map = buckets[index][1];
    const existing = map.get(key);
    if (existing !== undefined) {
      onRemoved(existing);
    }
    map.set(key, task);
  }
}

function remove<A>(buckets: Array<KeyedPriorityBucket<A>>, priority: number, key: unknown): void {
  const index = binarySearch(buckets, priority);
  if (index === buckets.length || buckets[index][0] !== priority) {
    return;
  }
  const map = buckets[index][1];
  map.delete(key);
  if (map.size === 0) buckets.splice(index, 1);
}

function binarySearch<A>(buckets: Array<KeyedPriorityBucket<A>>, priority: number): number {
  let low = 0;
  let high = buckets.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const [bucketPriority] = buckets[mid];
    if (bucketPriority === priority) {
      return mid;
    } else if (bucketPriority < priority) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return low;
}
