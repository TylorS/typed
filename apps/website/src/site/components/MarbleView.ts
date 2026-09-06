import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import { Button } from "@typed/ui/Button";
import type { Effect, Scope } from "effect";
import {
  diagramSlotWidth,
  diagramTicks,
  eventText,
  tickDescription,
  type FxMarbleDiagram,
  type Timeline,
  type TimelineEvent,
} from "../../docs/MarbleDiagram.js";

export interface MarbleState {
  readonly position: number;
  readonly speed: number;
  readonly playing: boolean;
  readonly enhanced: boolean;
  readonly reducedMotion: boolean;
  readonly followRevision: number;
}

export const initialMarbleState: MarbleState = {
  position: 0,
  speed: 1,
  playing: false,
  enhanced: false,
  reducedMotion: false,
  followRevision: 0,
};

export interface MarbleActions {
  readonly play: Effect.Effect<void>;
  readonly restart: Effect.Effect<void>;
  readonly previous: Effect.Effect<void>;
  readonly next: Effect.Effect<void>;
  readonly seek: (tick: number) => Effect.Effect<void>;
  readonly speed: (speed: number) => Effect.Effect<void>;
  readonly attach: (
    figure: HTMLElement,
  ) => Effect.Effect<void, never, Scope.Scope>;
}

const eventGlyph = (event: Exclude<TimelineEvent, { readonly tag: "gap" }>) => {
  if (event.tag === "value") return event.value;
  // The legend uses these same shapes, so its key matches every rendered lane.
  const path = {
    start: "M5 15L12 8L19 15",
    complete: "M12 4V20",
    error: "M12 5V13M12 18V19",
    cancelled: "M6 6L18 18M18 6L6 18",
  }[event.tag];
  return html`<svg class="fx-marble__marker" viewBox="0 0 24 24"
    width="24" height="24" fill="none" stroke="currentColor"
    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"><path d=${path}></path></svg>`;
};

const eventPhase = (state: MarbleState, tick: number) => {
  if (!state.enhanced) return undefined;
  const currentTick = Math.floor(state.position);
  return tick > currentTick
    ? "future"
    : tick === currentTick
      ? "current"
      : "past";
};

const timelineDescription = ({ label, events }: Timeline) => {
  const descriptions = events.flatMap((event, tick) =>
    event.tag === "gap" ? [] : [`tick ${tick} ${eventText(event)}`],
  );
  return `${label} timeline: ${descriptions.join(", ") || "empty"}`;
};

const legendEvent = (
  event: Exclude<TimelineEvent, { readonly tag: "gap" }>,
  phase?: "current" | "future",
) => html`<span class="fx-marble__legend-sample" aria-hidden="true">
  <span class="fx-marble__legend-event fx-marble__event--${event.tag}"
    data-legend-phase=${phase}>${eventGlyph(event)}</span>
</span>`;

const legend = html`<details class="fx-marble__legend">
  <summary>Read this diagram <span class="fx-marble__legend-preview" aria-hidden="true">
    ${legendEvent({ tag: "value", value: "a" })}
    ${legendEvent({ tag: "start" })}
    ${legendEvent({ tag: "complete" })}
  </span></summary>
  <p>Follow each lane from left to right. Events stacked vertically share a tick; the green cursor marks the current time across every lane.</p>
  <ul>
    <li>${legendEvent({ tag: "value", value: "a" })}<span><strong>A value</strong><br />The text inside the pill is the emitted value.</span></li>
    <li>${legendEvent({ tag: "start" })}<span><strong>Work starts</strong><br />The raised chevron starts an inner run (<code>^</code> in the source).</span></li>
    <li>${legendEvent({ tag: "complete" })}<span><strong>The run returns</strong><br />The vertical bar ends this lane’s run.</span></li>
    <li>${legendEvent({ tag: "error" })}<span><strong>A cause is delivered</strong><br />The exclamation mark belongs to this lane.</span></li>
    <li>${legendEvent({ tag: "cancelled" })}<span><strong>Work is interrupted</strong><br />The cross marks cancellation of this run.</span></li>
    <li><span class="fx-marble__legend-sample fx-marble__legend-cursor" aria-hidden="true"></span><span><strong>Current time</strong><br />The line and diamond move together across all lanes.</span></li>
    <li>${legendEvent({ tag: "value", value: "a" }, "current")}<span><strong>Happening now</strong><br />A highlighted event is at the current tick.</span></li>
    <li>${legendEvent({ tag: "value", value: "b" }, "future")}<span><strong>Still ahead</strong><br />Muted, dashed values have not happened yet.</span></li>
    <li><span class="fx-marble__legend-sample fx-marble__legend-continuation" aria-hidden="true">›</span><span><strong>Time continues</strong><br />The lane’s arrow is not a return marker. An empty stretch can be quiet work that is still running.</span></li>
  </ul>
  <p>Illustrated ticks start at 0. At 1×, one illustrated tick takes one second; captions specify real durations when timing matters. A cause or interruption belongs to its lane, and other work may continue. Scroll horizontally to inspect the rest of a long timeline.</p>
</details>`;

/** Markdown and the browser render this same template and its native controls. */
export const MarbleView = (
  diagram: FxMarbleDiagram,
  state?: RefSubject.RefSubject<MarbleState>,
  actions?: MarbleActions,
) => {
  const read = <A>(project: (state: MarbleState) => A) =>
    state ? RefSubject.map(state, project) : project(initialMarbleState);
  const steps = diagramTicks(diagram);
  const lastTick = steps - 1;
  const caption = diagram.title ?? `Fx marble: ${diagram.operator}`;
  const description = read((state) =>
    tickDescription(diagram, Math.floor(state.position)),
  );
  const atStart = read((state) => state.enhanced && state.position <= 0);
  const atEnd = read((state) => state.enhanced && state.position >= lastTick);
  const singleTick = read((state) => state.enhanced && lastTick === 0);

  const timeline = (timeline: Timeline) => html`<div
    class="fx-marble__row fx-marble__row--${timeline.kind}"
    role="img" aria-label=${timelineDescription(timeline)}>
    <span class="fx-marble__label">${timeline.label}</span>
    <span class="fx-marble__track">${timeline.events.map((event, tick) =>
      event.tag === "gap"
        ? null
        : html`<span
        class="fx-marble__event fx-marble__event--${event.tag}"
        data-tick=${tick} data-description="${timeline.label}: ${eventText(event)}"
        style="--fx-marble-slot: ${tick + 1}" aria-hidden="true"
        data-phase=${read((state) => eventPhase(state, tick))}>${eventGlyph(event)}</span>`,
    )}</span>
  </div>`;

  const coverage = diagram.covers.length
    ? html`<span
    class="fx-marble__coverage"
    aria-label="Operators represented: ${diagram.covers.join(", ")}">
    <span class="fx-marble__coverage-label" aria-hidden="true">Operators</span>
    ${diagram.covers.map((name) => html`<code>${name}</code>`)}
  </span>`
    : null;

  const transport = html`<div class="fx-marble__transport" role="group" aria-label="Timeline playback">
    ${Button({
      disabled: atStart,
      content: "↤",
      onclick: actions?.restart,
      props: {
        "data-action": "restart",
        "aria-label": "Return to the first tick",
        title: "Return to the first tick",
      },
    })}
    ${Button({
      disabled: atStart,
      content: "←",
      onclick: actions?.previous,
      props: {
        "data-action": "previous",
        "aria-label": "Previous tick",
        title: "Previous tick",
      },
    })}
    ${Button({
      disabled: singleTick,
      onclick: actions?.play,
      props: { "data-action": "play", class: "fx-marble__play" },
      content: html`<span aria-hidden="true">${read((state) =>
        state.playing
          ? "Ⅱ"
          : state.position === lastTick && lastTick > 0
            ? "↻"
            : "▶",
      )}</span> <span data-play-label>${read((state) =>
        state.playing
          ? "Pause"
          : state.position === lastTick && lastTick > 0
            ? "Replay"
            : "Play",
      )}</span>`,
    })}
    ${Button({
      disabled: atEnd,
      content: "→",
      onclick: actions?.next,
      props: {
        "data-action": "next",
        "aria-label": "Next tick",
        title: "Next tick",
      },
    })}
  </div>`;

  const onSpeed =
    actions &&
    EventHandler.make((event: Event) =>
      actions.speed(Number((event.currentTarget as HTMLSelectElement).value)),
    );
  const onSeek =
    actions &&
    EventHandler.make((event: Event) =>
      actions.seek(Number((event.currentTarget as HTMLInputElement).value)),
    );

  return html`<figure class="fx-marble"
    data-fx-operators=${diagram.covers.length ? diagram.covers.join(" ") : undefined}
    aria-label=${caption}
    data-enhanced=${read((state) => (state.enhanced ? "true" : undefined))}
    data-playing=${read((state) => (state.enhanced ? String(state.playing) : undefined))}
    style=${read((state) =>
      state.enhanced
        ? `--fx-marble-time: ${state.reducedMotion ? Math.floor(state.position) : state.position}`
        : undefined,
    )} ref=${actions?.attach}>
    <figcaption>
      <span class="fx-marble__eyebrow">Fx timeline</span>
      <span class="fx-marble__caption">${caption}</span>
      ${coverage}
    </figcaption>
    <div class="fx-marble__viewport" role="group"
      aria-label="Timeline diagram; scroll horizontally when needed" tabindex="0">
      <div class="fx-marble__diagram" data-ticks=${steps}
        style="--fx-marble-steps: ${steps}; --fx-marble-slot-width: ${diagramSlotWidth(diagram)}rem">
        <div class="fx-marble__clock" aria-hidden="true">
          <span class="fx-marble__playhead"></span>
        </div>
        <div class="fx-marble__axis" aria-hidden="true">
          <span class="fx-marble__label">Tick</span>
          <span class="fx-marble__track">${Array.from(
            { length: steps },
            (_, tick) =>
              html`<span class="fx-marble__tick" style="--fx-marble-slot: ${tick + 1}">${tick}</span>`,
          )}</span>
        </div>
        ${diagram.inputs.map(timeline)}
        <div class="fx-marble__operator-row">
          <span class="fx-marble__label">Operator</span>
          <span class="fx-marble__operator-track">
            <span class="fx-marble__operator">${diagram.operator}</span>
          </span>
        </div>
        ${[...diagram.inners, ...diagram.outputs].map(timeline)}
      </div>
    </div>
    <div class="fx-marble__controls" ?hidden=${read((state) => !state.enhanced)}>
      ${transport}
      <label class="fx-marble__speed">
        <span>Speed</span>
        <select aria-label="Playback speed" .value=${read((state) => String(state.speed))} @change=${onSpeed}>
          <option value="0.25">0.25×</option>
          <option value="0.5">0.5×</option>
          <option value="1" selected>1×</option>
          <option value="2">2×</option>
        </select>
      </label>
      <div class="fx-marble__scrubber">
        <input type="range" min="0" max=${lastTick} step="1"
          .value=${read((state) => String(Math.floor(state.position)))} ?disabled=${singleTick}
          aria-label="Timeline position" aria-valuetext=${description} @input=${onSeek} />
        <output class="fx-marble__position" aria-live="off">Tick ${read((state) => Math.floor(state.position))} / ${lastTick}</output>
      </div>
      <p class="fx-marble__activity" role="status"
        aria-live=${read((state) => (state.playing ? "off" : "polite"))} aria-atomic="true">${description}</p>
    </div>
    ${legend}
  </figure>`;
};
