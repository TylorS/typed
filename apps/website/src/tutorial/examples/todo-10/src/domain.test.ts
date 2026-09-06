import { DateTime } from "effect";
import { describe, expect, it } from "vitest";
import { TodoId, type TodoList, toggleCompleted } from "./domain.js";

describe("Todo domain", () => {
  it("toggles only the requested Todo", () => {
    const timestamp = DateTime.makeUnsafe("2026-01-01T00:00:00Z");
    const first = TodoId.make("first");
    // Matching titles force this test to distinguish items by ID.
    const todos: TodoList = [
      { id: first, text: "Learn Typed", completed: false, timestamp },
      { id: TodoId.make("second"), text: "Learn Typed", completed: false, timestamp },
    ];
    const next = toggleCompleted(first)(todos);
    expect(next.map(({ completed }) => completed)).toEqual([true, false]);
    expect(todos.map(({ completed }) => completed)).toEqual([false, false]);
    expect(next[1]).toBe(todos[1]);
    expect(toggleCompleted(first)([])).toEqual([]);
  });
});
