import { describe, expect, it } from "vitest";
import { RenderQueue, SyncRenderQueue } from "../RenderQueue.js";

const dispose = (): Disposable => ({ [Symbol.dispose]: () => {} });
const noop = () => {};

class ControlledRenderQueue extends RenderQueue {
  readonly callbacks: Array<(deadline: IdleDeadline) => void> = [];

  protected schedule(task: (deadline: IdleDeadline) => void): Disposable {
    this.callbacks.push(task);
    return dispose();
  }

  runNext(deadline: IdleDeadline): void {
    const task = this.callbacks.shift();
    if (task === undefined) throw new Error("No render task was scheduled");
    task(deadline);
  }
}

const unlimited: IdleDeadline = { didTimeout: false, timeRemaining: () => Infinity };

describe("RenderQueue", () => {
  it("executes every task added to SyncRenderQueue", () => {
    const queue = new SyncRenderQueue();
    const executed: Array<number> = [];

    queue.add("first", () => executed.push(1), noop, 0);
    queue.add("second", () => executed.push(2), noop, 0);

    expect(executed).toEqual([1, 2]);
  });

  it("creates a bucket when inserting a previously absent priority", () => {
    const queue = new ControlledRenderQueue();
    const executed: Array<number> = [];

    queue.add("one", () => executed.push(1), noop, 1);
    queue.add("three", () => executed.push(3), noop, 3);
    queue.add("two", () => executed.push(2), noop, 2);
    queue.runNext(unlimited);

    expect(executed).toEqual([1, 2, 3]);
  });

  it("coalesces by priority and key without merging equal keys across priorities", () => {
    const queue = new ControlledRenderQueue();
    const executed: Array<string> = [];
    const disposed: Array<string> = [];

    queue.add(
      "shared",
      () => executed.push("old-one"),
      () => disposed.push("old-one"),
      1,
    );
    queue.add(
      "shared",
      () => executed.push("two"),
      () => disposed.push("two"),
      2,
    );
    queue.add(
      "shared",
      () => executed.push("new-one"),
      () => disposed.push("new-one"),
      1,
    );
    queue.runNext(unlimited);

    expect(executed).toEqual(["new-one", "two"]);
    expect(disposed).toEqual(["old-one", "new-one", "two"]);
  });

  it("checks the deadline between tasks in the same priority bucket", () => {
    const queue = new ControlledRenderQueue();
    const executed: Array<number> = [];
    let checks = 0;

    queue.add("first", () => executed.push(1), noop, 1);
    queue.add("second", () => executed.push(2), noop, 1);
    queue.runNext({
      didTimeout: false,
      timeRemaining: () => (checks++ === 0 ? 1 : 0),
    });

    expect(executed).toEqual([1]);
    expect(queue.callbacks).toHaveLength(1);

    queue.runNext(unlimited);
    expect(executed).toEqual([1, 2]);
  });
});
