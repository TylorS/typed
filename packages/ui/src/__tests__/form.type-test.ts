import type * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type * as Fx from "@typed/fx/Fx";
import type * as Scope from "effect/Scope";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import type * as Dom from "../Dom.js";
import type { HostResult } from "../Dom/Types.js";
import * as Form from "../Form.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type RenderableInputOptions<Options> = Pick<
  Options,
  Extract<keyof Options, "props" | "ref" | "content" | Dom.EventHandlerProperty>
>;

type ExpectedInput<Value> = <
  const Values extends object,
  const Options extends Form.InputOptions<Values, Value>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<Form.InputOptions<Values, Value>, "state" | "name">,
  host?: Dom.HostOverride<any, "", Host>,
) => Fx.Fx<
  RenderEvent,
  Schema.SchemaError | Renderable.Error<RenderableInputOptions<Options> | Host>,
  Renderable.Services<RenderableInputOptions<Options> | Host> | Scope.Scope | RenderTemplate
>;

type BidirectionallyAssignable<Left, Right> = Left extends Right
  ? Right extends Left
    ? true
    : false
  : false;

type _TextContract = Assert<
  BidirectionallyAssignable<typeof Form.TextInput, ExpectedInput<string>>
>;
type _SearchContract = Assert<
  BidirectionallyAssignable<typeof Form.SearchInput, ExpectedInput<string>>
>;
type _EmailContract = Assert<
  BidirectionallyAssignable<typeof Form.EmailInput, ExpectedInput<string>>
>;
type _UrlContract = Assert<BidirectionallyAssignable<typeof Form.UrlInput, ExpectedInput<string>>>;
type _TelContract = Assert<BidirectionallyAssignable<typeof Form.TelInput, ExpectedInput<string>>>;
type _PasswordContract = Assert<
  BidirectionallyAssignable<typeof Form.PasswordInput, ExpectedInput<string>>
>;
type _HiddenContract = Assert<
  BidirectionallyAssignable<typeof Form.HiddenInput, ExpectedInput<string>>
>;
type _ColorContract = Assert<
  BidirectionallyAssignable<typeof Form.ColorInput, ExpectedInput<string>>
>;
type _TimeContract = Assert<
  BidirectionallyAssignable<typeof Form.TimeInput, ExpectedInput<string>>
>;
type _DateTimeLocalContract = Assert<
  BidirectionallyAssignable<typeof Form.DateTimeLocalInput, ExpectedInput<string>>
>;
type _MonthContract = Assert<
  BidirectionallyAssignable<typeof Form.MonthInput, ExpectedInput<string>>
>;
type _WeekContract = Assert<
  BidirectionallyAssignable<typeof Form.WeekInput, ExpectedInput<string>>
>;
type _NumberContract = Assert<
  BidirectionallyAssignable<typeof Form.NumberInput, ExpectedInput<number>>
>;
type _RangeContract = Assert<
  BidirectionallyAssignable<typeof Form.RangeInput, ExpectedInput<number>>
>;
type _DateContract = Assert<BidirectionallyAssignable<typeof Form.DateInput, ExpectedInput<Date>>>;

type ExpectedMaskedInput = <
  const Values extends object,
  const Parts extends ReadonlyArray<Form.MaskPart>,
  const Options extends Form.MaskedInputOptions<Values, Parts>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<Form.MaskedInputOptions<Values, Parts>, "state" | "name" | "mask">,
  host?: Dom.HostOverride<any, "", Host>,
) => Fx.Fx<
  RenderEvent,
  Schema.SchemaError | Renderable.Error<RenderableInputOptions<Omit<Options, "mask">> | Host>,
  | Renderable.Services<RenderableInputOptions<Omit<Options, "mask">> | Host>
  | Scope.Scope
  | RenderTemplate
>;

type _MaskedInputContract = Assert<
  BidirectionallyAssignable<typeof Form.MaskedInput, ExpectedMaskedInput>
>;

const PublicTextInput: Form.InputComponent<string> = Form.TextInput;

const phone = Form.mask(
  "(",
  Form.slot("area", Schema.FiniteFromString, { length: 3 }),
  ") ",
  Form.slot("line", Schema.FiniteFromString, { length: 4 }),
);

const Example = Form.make(
  Schema.Struct({
    email: Schema.String,
    quantity: Schema.FiniteFromString,
    birthday: Schema.DateFromString,
    accepted: Schema.Boolean,
    choice: Schema.String,
    tags: Schema.Array(Schema.String),
    phone,
  }),
);

declare const form: Effect.Success<ReturnType<typeof Example.state>>;

type PropService = { readonly PropService: unique symbol };
type EventService = { readonly EventService: unique symbol };
type HostService = { readonly HostService: unique symbol };

const hostedText = PublicTextInput(
  {
    state: form,
    name: "email",
    props: {
      title: Effect.fail("prop-error" as const) as Effect.Effect<string, "prop-error", PropService>,
      oninput: Effect.fail("event-error" as const) as Effect.Effect<
        void,
        "event-error",
        EventService
      >,
    },
    ref: (_element: HTMLInputElement) => undefined,
  },
  (_props, _content) =>
    Effect.fail("host-error" as const) as Effect.Effect<RenderEvent, "host-error", HostService>,
);

const customHostedText = PublicTextInput(
  { state: form, name: "email" },
  (props) => html`<input ...${props} />`,
);

type _HostedTextErrors = Assert<
  Equal<
    Fx.Error<typeof hostedText>,
    Schema.SchemaError | "prop-error" | "event-error" | "host-error"
  >
>;
type _HostedTextServices = Assert<
  Equal<
    Fx.Services<typeof hostedText>,
    PropService | EventService | HostService | Scope.Scope | RenderTemplate
  >
>;

const email = Example.EmailInput({ name: "email" });
Example.TextInput({ name: "choice" });
Example.NumberInput({ name: "quantity" });
Example.DateInput({ name: "birthday" });
Example.MaskedInput({ name: "phone" });
Example.Checkbox({ name: "accepted" });
Example.Select({ name: "choice", content: "Choice" });
Example.Error({ name: "quantity" });
Example.Reset({ content: "Reset" });
Example.Push({ name: "tags", value: "typed", content: "Add" });
Example.Remove({ name: "tags", index: 0, content: "Remove" });

const root = Example.Root({
  form,
  content: email,
  onValidSubmit: (values) => {
    type _Email = Assert<Equal<typeof values.email, string>>;
    type _Quantity = Assert<Equal<typeof values.quantity, number>>;
    return Effect.succeed([true] as const);
  },
});

type CurrentFormId = Context.Service.Identifier<typeof Form.CurrentForm>;
type _RootProvidesCurrentForm = Assert<
  Equal<Extract<Fx.Services<typeof root>, CurrentFormId>, never>
>;

// @ts-expect-error quantity is not a string field
Example.EmailInput({ name: "quantity" });

// @ts-expect-error email is not a numeric field
Example.NumberInput({ name: "email" });

// @ts-expect-error choice is not a boolean field
Example.Checkbox({ name: "choice" });

// @ts-expect-error email is not an array field
Example.Push({ name: "email", value: "typed", content: "Add" });

void root;
void customHostedText;

void Example;
