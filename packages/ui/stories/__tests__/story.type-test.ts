import { html } from "@typed/template";
import { component } from "../../src/Component.js";
import { story } from "../story.js";

interface GreetingProps {
  readonly label: string;
  readonly count: number;
}

const Greeting = component(
  // oxlint-disable-next-line require-yield
  function* ({ label, count }: GreetingProps) {
    return html`<p>${label}: ${count}</p>`;
  },
);

story(
  Greeting,
  { label: "Hello", count: 1 },
  {
    label: { control: "text" },
    count: { control: { type: "range", min: 0, max: 10, step: 1 } },
  },
);

// @ts-expect-error component props are required Storybook args
story(Greeting, { label: "Missing count" });

// @ts-expect-error Storybook args are derived from the component props
story(Greeting, { label: "Hello", count: 1, unknown: true });

// @ts-expect-error argTypes keys are derived from the component props
story(Greeting, { label: "Hello", count: 1 }, { unknown: { control: "boolean" } });
