import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, relative } from "node:path";
import ts from "typescript-compiler";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const canonical = resolve(root, "examples/todomvc/src");
const output = resolve(root, "apps/website/src/tutorial/examples");
const check = process.argv.includes("--check");

// Preserve source text, including function bodies and templates. A milestone only
// omits declarations/markup that it has not introduced; it never rewrites them.
const read = (name: string) => readFileSync(resolve(canonical, name), "utf8");
const declarations = (source: string, names: readonly string[]) => {
  const file = ts.createSourceFile("example.ts", source, ts.ScriptTarget.Latest, true);
  return (
    file.statements
      .filter((statement) => {
        if (ts.isImportDeclaration(statement)) return true;
        const name = ts.isVariableStatement(statement)
          ? statement.declarationList.declarations[0]?.name.getText(file)
          : "name" in statement && statement.name && ts.isIdentifier(statement.name as ts.Node)
            ? (statement.name as ts.Identifier).text
            : undefined;
        return name !== undefined && names.includes(name);
      })
      .map((statement) => statement.getFullText(file))
      .join("")
      .trimStart() + "\n"
  );
};
const omit = (source: string, start: string, end: string) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`TodoMVC source changed: ${start}`);
  return source.slice(0, from) + source.slice(to + end.length);
};
const write = (step: number, name: string, source: string) => {
  const file = resolve(output, `todo-${step}/src`, name);
  if (check) {
    if (!existsSync(file) || readFileSync(file, "utf8") !== source)
      throw new Error(`Regenerate TodoMVC lessons: ${relative(root, file)}`);
  } else {
    mkdirSync(resolve(output, `todo-${step}/src`), { recursive: true });
    writeFileSync(file, source);
  }
};
const domain = read("domain.ts");
const application = read("application.ts");
const presentation = read("presentation.ts");
const infrastructure = read("infrastructure.ts");
const model = ["TodoList", "TodoText"];
for (let step = 1; step <= 10; step++) {
  write(step, "domain.ts", domain);
  if (step < 2) continue;
  const names = [...model];
  names.push("CreateTodo");
  if (step >= 3) names.push("createTodo");
  if (step >= 5)
    names.push("FilterState", "Todos", "editTodo", "toggleTodoCompleted", "deleteTodo");
  if (step >= 6)
    names.push(
      "ActiveCount",
      "SomeAreCompleted",
      "AllAreCompleted",
      "clearCompletedTodos",
      "toggleAllCompleted",
    );
  write(step, "application.ts", step >= 6 ? application : declarations(application, names));
  if (step < 4) continue;
  let view =
    step === 4
      ? declarations(presentation, ["onInput", "onNewTodoKeydown", "TodoApp"])
      : presentation;
  if (step === 4) view = omit(view, "  ${Fx.if(HasTodos, {", "\n  })}\n");
  if (step === 5) {
    view = omit(
      view,
      '      <input\n        id="toggle-all"',
      '      <label for="toggle-all">Mark all as complete</label>\n',
    );
    view = omit(view, '    <footer class="footer">', "    </footer>");
  }
  if (step === 6) view = omit(view, '      <ul class="filters">', "      </ul>\n");
  write(step, "presentation.ts", view);
  if (step < 8) {
    const factory = declarations(infrastructure, [
      "CreateTodo",
      ...(step >= 7 ? ["FilterState"] : []),
    ]);
    // Only the unfinished runtime is scaffolded: memory before persistence, and
    // a fixed filter before routing. The factory itself is canonical source.
    write(
      step,
      "infrastructure.ts",
      factory +
        `\nexport const makeServices = (router = Router.BrowserRouter()) =>\n  Layer.mergeAll(\n    CreateTodo,\n    App.TodoList.make([]),\n    App.TodoText.make(""),${step >= 5 ? `\n    App.FilterState.make(${step >= 7 ? "FilterState" : '"all"'}),` : ""}\n  ).pipe(Layer.provideMerge(router));\n\nexport const Services = makeServices();\n`,
    );
  } else write(step, "infrastructure.ts", infrastructure);
  write(step, "main.ts", read("main.ts"));
  write(step, "styles.css", read("styles.css"));
  write(
    step,
    "preview.ts",
    `import { Fx } from "@typed/fx";\nimport { ServerRouter } from "@typed/router";\nimport { TodoApp } from "./presentation.js";\nimport { makeServices } from "./infrastructure.js";\n\n// Only the runtime router changes when this example is embedded in the website.\nexport const Preview = TodoApp.pipe(\n  Fx.provide(makeServices(ServerRouter({ url: "https://tutorial.local/" }))),\n);\n`,
  );
}
console.log(
  check
    ? "TodoMVC lesson sources match the canonical example."
    : "Derived TodoMVC lesson sources from examples/todomvc.",
);
