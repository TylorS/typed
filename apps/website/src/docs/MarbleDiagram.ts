export type TimelineEvent =
  | { readonly tag: "gap" }
  | { readonly tag: "start" }
  | { readonly tag: "value"; readonly value: string }
  | { readonly tag: "complete" }
  | { readonly tag: "error"; readonly reason?: string }
  | { readonly tag: "cancelled" };

export interface FxMarbleDiagram {
  readonly title?: string;
  readonly covers: ReadonlyArray<string>;
  readonly inputs: ReadonlyArray<Timeline>;
  readonly operator: string;
  readonly inners: ReadonlyArray<Timeline>;
  readonly outputs: ReadonlyArray<Timeline>;
}

export interface Timeline {
  readonly events: ReadonlyArray<TimelineEvent>;
  readonly kind: "input" | "inner" | "output";
  readonly label: string;
}

const parseTimeline = (source: string): ReadonlyArray<TimelineEvent> =>
  source.split(/\s+/u).flatMap((token): ReadonlyArray<TimelineEvent> => {
    if (token === ".") return [{ tag: "gap" }];
    if (token === "^") return [{ tag: "start" }];
    if (token === "|") return [{ tag: "complete" }];
    if (token === "x") return [{ tag: "cancelled" }];
    if (token === "!") return [{ tag: "error" }];
    if (token.startsWith("!"))
      return [{ tag: "error", reason: token.slice(1) }];
    return token === "" ? [] : [{ tag: "value", value: token }];
  });

/**
 * Parse the intentionally small `fx-marble` fence grammar:
 *
 * title: optional visual caption
 * covers: comma-separated public operator names represented by this diagram
 * input [label]: timeline slots (`.` gap, `|` complete, `!reason` error, `x` cancelled)
 * operator: a readable operator label
 * inner name: a started inner Fx (`^` start marker)
 * output [label]: timeline slots
 */
export const parseFxMarble = (source: string): FxMarbleDiagram | undefined => {
  let title: string | undefined;
  let covers: ReadonlyArray<string> | undefined;
  let operator: string | undefined;
  const timelines: Array<Timeline> = [];
  const timelineNames = new Set<string>();

  for (const sourceLine of source.split("\n")) {
    const line = sourceLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const match =
      /^(title|covers|operator|input|inner|output)(?:\s+([^:]+))?:\s*(.*)$/u.exec(
        line,
      );
    if (match === null) return undefined;

    const [, field, sourceLabel, value] = match;
    if (field === "title") {
      if (sourceLabel !== undefined || title !== undefined) return undefined;
      title = value;
      continue;
    }
    if (field === "covers") {
      if (sourceLabel !== undefined || covers !== undefined) return undefined;
      const names = [
        ...new Set(
          value!
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean),
        ),
      ];
      if (names.length === 0) return undefined;
      covers = names;
      continue;
    }
    if (field === "operator") {
      if (sourceLabel !== undefined || operator !== undefined || value === "")
        return undefined;
      operator = value;
      continue;
    }

    const kind = field as Timeline["kind"];
    const rawLabel =
      sourceLabel?.trim() || (kind === "input" ? "Input" : "Output");
    if (
      kind === "inner" &&
      (sourceLabel === undefined || sourceLabel.trim() === "")
    )
      return undefined;
    const timelineName = `${kind}:${rawLabel.toLocaleLowerCase()}`;
    if (timelineNames.has(timelineName)) return undefined;
    timelineNames.add(timelineName);
    timelines.push({
      events: parseTimeline(value!),
      kind,
      label: `${rawLabel.charAt(0).toLocaleUpperCase()}${rawLabel.slice(1)}`,
    });
  }

  const inputs = timelines.filter((timeline) => timeline.kind === "input");
  const inners = timelines.filter((timeline) => timeline.kind === "inner");
  const outputs = timelines.filter((timeline) => timeline.kind === "output");
  if (inputs.length === 0 || operator === undefined || outputs.length === 0)
    return undefined;

  return {
    ...(title === undefined ? {} : { title }),
    covers: covers ?? [],
    inputs,
    operator,
    inners,
    outputs,
  };
};

export const eventText = (event: TimelineEvent): string => {
  switch (event.tag) {
    case "gap":
      return "gap";
    case "start":
      return "start";
    case "value":
      return event.value;
    case "complete":
      return "complete";
    case "error":
      return event.reason === undefined || event.reason === ""
        ? "cause"
        : `cause: ${event.reason}`;
    case "cancelled":
      return "cancelled";
  }
};

export const diagramTimelines = (diagram: FxMarbleDiagram) => [
  ...diagram.inputs,
  ...diagram.inners,
  ...diagram.outputs,
];
export const diagramTicks = (diagram: FxMarbleDiagram) =>
  Math.max(
    1,
    ...diagramTimelines(diagram).map((timeline) => timeline.events.length),
  );
export const diagramSlotWidth = (diagram: FxMarbleDiagram) =>
  Math.min(
    10,
    Math.max(
      3.5,
      Math.max(
        1,
        ...diagramTimelines(diagram).flatMap((timeline) =>
          timeline.events.map((event) =>
            event.tag === "value" ? event.value.length : 1,
          ),
        ),
      ) *
        0.46 +
        1.75,
    ),
  );
export const tickDescription = (diagram: FxMarbleDiagram, tick: number) => {
  const descriptions = diagramTimelines(diagram).flatMap(
    ({ label, events }) => {
      const event = events[tick];
      return event && event.tag !== "gap"
        ? [`${label}: ${eventText(event)}`]
        : [];
    },
  );
  return `Tick ${tick}. ${descriptions.length ? descriptions.join("; ") : "No events"}.`;
};
