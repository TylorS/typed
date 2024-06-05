/**
 * Compiler is an all-in-one package for compile-time optimization and derivations
 * of Typed libraries and applications.
 *
 * @since 1.0.0
 */

import { parse } from "@typed/template/Parser"
import type * as Template from "@typed/template/Template"
import { Chunk } from "effect"
import ts from "typescript"
import {
  appendChild,
  createComment,
  createConst,
  createEffectYield,
  createElement,
  createFunctionCall,
  createMethodCall,
  createText,
  setAttribute,
  toggleAttribute
} from "./typescript/factories.js"
import { findTsConfig } from "./typescript/findConfigFile.js"
import type { Project } from "./typescript/Project.js"
import { Service } from "./typescript/Service.js"

// This whole file is a hack-and-a-half, really just prototyping features

export type CompilerTarget = "dom" | "hydrate" | "server" | "static"

/**
 * Compiler is an all-in-one cass for compile-time optimization and derivations
 * of Typed libraries and applications.
 *
 * @since 1.0.0
 */
export class Compiler {
  private _cmdLine: ts.ParsedCommandLine
  private _service: Service = new Service()
  private primitives: {
    string: ts.Type
    number: ts.Type
    boolean: ts.Type
    bigint: ts.Type
    null: ts.Type
    undefined: ts.Type
    void: ts.Type
  }
  private templatesByFile: Map<string, Array<ParsedTemplate>> = new Map()
  private _compilerTarget: CompilerTarget

  readonly project: Project
  readonly checker: ts.TypeChecker

  constructor(
    readonly directory: string,
    readonly tsConfig?: string,
    defaultCompilerTarget: CompilerTarget = "dom"
  ) {
    this._cmdLine = findTsConfig(directory, tsConfig)
    this._compilerTarget = defaultCompilerTarget
    this.project = this._service.openProject(this._cmdLine, this.enhanceLanguageServiceHost)
    this.checker = this.project.typeChecker
    this.primitives = {
      string: this.checker.getStringType(),
      number: this.checker.getNumberType(),
      boolean: this.checker.getBooleanType(),
      bigint: this.checker.getBigIntType(),
      null: this.checker.getNullType(),
      undefined: this.checker.getUndefinedType(),
      void: this.checker.getVoidType()
    }
  }

  parseTemplates(sourceFile: ts.SourceFile): Array<ParsedTemplate> {
    const templates: Array<ParsedTemplate> = []

    getHtmlTags(sourceFile).forEach((expression) => {
      const literal = expression.template
      const [template, parts] = this.parseTemplateFromNode(literal)
      templates.push({ literal, template, parts })
    })

    templates.sort(sortParsedTemplates)

    this.templatesByFile.set(sourceFile.fileName, templates)

    return templates
  }

  compileTemplates(
    sourceFile: ts.SourceFile,
    target?: CompilerTarget
  ) {
    const currentTarget = this._compilerTarget
    if (target) this._compilerTarget = target
    const files = this.project.emitFile(sourceFile.fileName)
    const js = ts.ScriptSnapshot.fromString(files.find((x) => x.name.endsWith(".js"))!.text)
    const dts = ts.ScriptSnapshot.fromString(files.find((x) => x.name.endsWith(".d.ts"))!.text)
    const map = ts.ScriptSnapshot.fromString(files.find((x) => x.name.endsWith(".js.map"))!.text)
    this._compilerTarget = currentTarget

    return {
      js,
      dts,
      map
    }
  }

  private getTransformersByFileAndTarget(
    templates: Array<ParsedTemplate>,
    target: CompilerTarget
  ): Array<ts.TransformerFactory<ts.SourceFile>> {
    return [
      (ctx) => (sourceFile) => {
        const importManager = new ImportDeclarationManager()

        const templateVisitor = (node: ts.Node): ts.Node => {
          if (isHtmlTag(node)) {
            const [, literal] = node.getChildren()
            const index = templates.findIndex((t) =>
              t.literal.getStart() === literal.getStart() && t.literal.getEnd() === literal.getEnd()
            )

            if (index > -1) {
              const template = templates[index]
              const remaining = templates.slice(index + 1)
              if (target === "dom" || target === "hydrate") {
                return this.replaceDom(sourceFile, template, remaining, importManager, target === "hydrate")
              }

              // return this.replaceHtml(template, remaining, target === "static")
            }
          }

          if (ts.isImportDeclaration(node)) {
            importManager.addExistingImport(node)
          }

          return ts.visitEachChild(node, templateVisitor, ctx)
        }

        const file = ts.visitEachChild(sourceFile, templateVisitor, ctx)

        return ts.factory.updateSourceFile(file, importManager.updateImportStatements(file.statements))
      }
    ]
  }

  private replaceDom(
    sourceFile: ts.SourceFile,
    { parts, template }: ParsedTemplate,
    remaining: Array<ParsedTemplate>,
    imports: ImportDeclarationManager,
    isHydrating: boolean
  ): ts.Node {
    const sink = ts.factory.createParameterDeclaration([], undefined, `sink`)
    const ctx = new CreateNodeCtx(
      parts,
      remaining,
      imports,
      Chunk.empty(),
      isHydrating ? "hydrate" : "dom",
      Chunk.empty()
    )
    const setupNodes = createDomSetupStatements(ctx)
    const domEffects = createDomEffectStatements(template, ctx)

    // Must come last to avoid mutation affecting behaviors of other nodes above
    const domNodesNestedIterable = createDomTemplateStatements(template, ctx)

    imports.addImport(`@typed/fx`, "Fx")
    imports.addImport(`effect/Effect`, "Effect")

    const domNodes: Array<ts.Statement> = Array.from(consumeNestedIterable(domNodesNestedIterable))

    return createMethodCall(
      "Fx",
      "make",
      [],
      [
        ts.factory.createArrowFunction(
          [],
          [],
          [sink],
          undefined,
          undefined,
          createMethodCall(`Effect`, `gen`, [], [
            ts.factory.createFunctionExpression(
              [],
              ts.factory.createToken(ts.SyntaxKind.AsteriskToken),
              undefined,
              [],
              [ts.factory.createParameterDeclaration([], undefined, `_`)],
              undefined,
              ts.factory.createBlock([...setupNodes, ...domNodes, ...domEffects], true)
            )
          ])
        )
      ]
    )
  }

  // private replaceHtml(
  //   template: ParsedTemplate,
  //   remaining: Array<ParsedTemplate>,
  //   isStatic: boolean
  // ) {
  //   return node
  // }

  private enhanceLanguageServiceHost = (host: ts.LanguageServiceHost): void => {
    const originalGetCustomTransformers = host.getCustomTransformers
    host.getCustomTransformers = () => {
      const original = originalGetCustomTransformers?.() ?? {}
      return {
        ...original,
        after: [
          ...Array.isArray(original.after) ? original.after : original.after ? [original.after] : [],
          (ctx) => (sourceFile) => {
            const templates = this.templatesByFile.get(sourceFile.fileName) ?? this.parseTemplates(sourceFile)
            const transformers = this.getTransformersByFileAndTarget(templates, this._compilerTarget)
            return transformers.reduce((file, transformer) => transformer(ctx)(file), sourceFile)
          }
        ]
      }
    }

    // TODO: Enable virtual modules
  }

  private parseTemplateFromNode(node: ts.TemplateLiteral): readonly [Template.Template, ReadonlyArray<ParsedPart>] {
    if (node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
      return [parse([node.getText().slice(1, -1)]), []]
    } else {
      const [head, syntaxList] = node.getChildren()
      const children = syntaxList.getChildren()
      const parts: Array<ParsedPart> = []

      const parsePart = (child: ts.Node, i: number): Array<string> => {
        if (child.kind === ts.SyntaxKind.TemplateSpan) {
          const [part, literal] = child.getChildren()
          parts.push(this.parsePart(part as ts.Expression, i))
          const text = literal.getText()
          if (literal.kind === ts.SyntaxKind.TemplateTail) return [text.slice(1, -1)]
          if (literal.kind === ts.SyntaxKind.TemplateMiddle) return [text.slice(1, -2)]
          return [text.slice(1)]
        } else if (child.kind === ts.SyntaxKind.TemplateHead) {
          return [child.getText().slice(1)]
        } else if (child.kind === ts.SyntaxKind.SyntaxList) {
          return child.getChildren().flatMap((c) => parsePart(c, i))
        } else {
          throw new Error(`Unexpected syntax kind: ${ts.SyntaxKind[child.kind]}`)
        }
      }

      const spans = children.flatMap(parsePart)

      return [parse([head.getText().slice(1, -2), ...spans]), parts]
    }
  }

  private parsePart(part: ts.Expression, index: number): ParsedPart {
    const type = this.project.getType(part)
    const kind = this.getPartType(part, type)
    if (kind === "template") {
      const [template, parts] = this.parseTemplateFromNode(part as ts.TemplateLiteral)
      return {
        index,
        kind,
        node: part,
        type,
        literal: part as ts.TemplateLiteral,
        parts,
        template
      }
    } else {
      return {
        index,
        kind,
        node: part,
        type
      }
    }
  }

  private getPartType(node: ts.Node, type: ts.Type): ParsedPart["kind"] {
    if (node.kind === ts.SyntaxKind.TaggedTemplateExpression) return "template"
    if (this.isPrimitiveType(type)) return "primitive"

    const properties = type.getProperties().map((p) => p.name)

    let isEffect = false
    let isFx = false
    for (const name of properties) {
      if (name.startsWith("__@DirectiveTypeId")) return "directive"
      if (name.startsWith("__@EffectTypeId")) isEffect = true
      if (name.startsWith("__@FxTypeId")) isFx = true
    }

    if (isFx && isEffect) return "fxEffect"
    if (isFx) return "fx"
    if (isEffect) return "effect"

    return "placeholder"
  }

  private isPrimitiveType(type: ts.Type) {
    return Object.values(this.primitives).some((t) => this.checker.isTypeAssignableTo(type, t))
  }
}

// Ensure that nested templates are handled first
function sortParsedTemplates(a: ParsedTemplate, b: ParsedTemplate): number {
  const [, aEnd] = getSpan(a)
  const [bStart] = getSpan(b)
  if (bStart > aEnd) return -1
  if (aEnd > bStart) return 1

  return 0
}

function getSpan(template: ParsedTemplate) {
  return [template.literal.getStart(), template.literal.getEnd()] as const
}

export interface ParsedTemplate {
  readonly literal: ts.TemplateLiteral
  readonly parts: ReadonlyArray<ParsedPart>
  readonly template: Template.Template
}

export type ParsedPart = SimpleParsedPart | ParsedTemplatePart

export type SimpleParsedPart = {
  readonly index: number
  readonly kind: "placeholder" | "fxEffect" | "fx" | "effect" | "primitive" | "directive"
  readonly node: ts.Expression
  readonly type: ts.Type
}

export interface ParsedTemplatePart extends Omit<SimpleParsedPart, "kind">, ParsedTemplate {
  readonly kind: "template"
}

function getHtmlTags(sourceFile: ts.SourceFile) {
  const toProcess: Array<ts.Node> = sourceFile.getChildren(sourceFile)
  const matches: Array<ts.TaggedTemplateExpression> = []

  while (toProcess.length) {
    const node = toProcess.shift()!
    if (isHtmlTag(node)) {
      matches.push(node)
    }

    toProcess.push(...node.getChildren(sourceFile))
  }

  return matches
}

function isHtmlTag(node: ts.Node): node is ts.TaggedTemplateExpression {
  if (node.kind === ts.SyntaxKind.TaggedTemplateExpression) {
    const expr = node as ts.TaggedTemplateExpression
    return expr.tag.getText() === "html"
  }

  return false
}

function* consumeNestedIterable(
  iterable: NestedIterable<ts.Statement>
): Iterable<ts.Statement> {
  for (const statementOrIterable of iterable) {
    if (Symbol.iterator in statementOrIterable) {
      const iterators: Array<NestedIterator<ts.Statement>> = [statementOrIterable[Symbol.iterator]()]

      while (iterators.length > 0) {
        const iterator = iterators[iterators.length - 1]
        const { done, value } = iterator.next()
        if (done) {
          iterators.pop()
        } else if (Symbol.iterator in value) {
          iterators.push(value[Symbol.iterator]())
        } else {
          yield value
        }
      }
    } else {
      yield statementOrIterable
    }
  }
}

function* createDomTemplateStatements(
  template: Template.Template,
  currentCtx: CreateNodeCtx
): NestedIterable<ts.Statement> {
  for (let i = 0; i < template.nodes.length; ++i) {
    yield createDomNodeStatements(template.nodes[i], {
      ...currentCtx,
      path: Chunk.append(currentCtx.path, i)
    })
  }
}

type NestedIterable<A> = Iterable<A | NestedIterable<A>>
type NestedIterator<A> = Iterator<A | NestedIterable<A>>

function createDomSetupStatements(ctx: CreateNodeCtx): Array<ts.Statement> {
  if (ctx.parts.length > 0) {
    ctx.imports.addImport(`@typed/dom/Document`, "Document")
    ctx.imports.addImport(`@typed/template/RenderContext`, "RenderContext")
    ctx.imports.addImport(`@typed/context`, "Context")
    addCompilerToolsNamespace(ctx.imports)

    return [
      createConst(
        `context`,
        createEffectYield(createMethodCall(`Effect`, `context`, [], []))
      ),
      createConst(
        `document`,
        createMethodCall(`Context`, `get`, [], [
          ts.factory.createIdentifier(`context`),
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`Document`), `Document`)
        ])
      ),
      createConst(
        `renderContext`,
        createMethodCall(`Context`, `get`, [], [
          ts.factory.createIdentifier(`context`),
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`RenderContext`), `RenderContext`)
        ])
      ),
      createConst(
        `templateContext`,
        createEffectYield(createMethodCall(`CompilerTools`, `makeTemplateContext`, [], [
          ts.factory.createIdentifier(`document`),
          ts.factory.createIdentifier(`renderContext`),
          partsToValues(ctx.parts),
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`sink`), `onFailure`)
        ]))
      )
    ]
  }

  return []
}

function partsToValues(parts: ReadonlyArray<ParsedPart>): ts.Expression {
  return ts.factory.createArrayLiteralExpression(parts.map((part) => {
    if (part.kind === "template") return partsToValues(part.parts)
    return part.node
  }))
}

function createDomEffectStatements(template: Template.Template, ctx: CreateNodeCtx) {
  const effects: Array<ts.Statement> = []

  if (template.parts.length > 0) {
    // Wait on values to be ready before rendering
    effects.push(
      ts.factory.createIfStatement(
        ts.factory.createBinaryExpression(
          ts.factory.createBinaryExpression(
            ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`templateContext`), `expected`),
            ts.SyntaxKind.GreaterThanToken,
            ts.factory.createNumericLiteral(0)
          ),
          ts.SyntaxKind.AmpersandAmpersandToken,
          ts.factory.createParenthesizedExpression(
            createEffectYield(
              createMethodCall(
                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`templateContext`), `refCounter`),
                `expect`,
                [],
                [ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`templateContext`), `expected`)]
              )
            )
          )
        ),
        ts.factory.createBlock(
          [
            ts.factory.createExpressionStatement(
              createEffectYield(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier(`templateContext`),
                    `refCounter`
                  ),
                  `wait`
                )
              )
            )
          ]
        )
      )
    )
  }

  // If there's more than one element, we need to wire them together
  if (template.nodes.length > 1) {
    ctx.imports.addImport(`@typed/wire`, "Wire")

    effects.push(
      createConst(
        `wire`,
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`Wire`), "persistent"),
          [],
          [
            ts.factory.createIdentifier(`document`),
            ts.factory.createArrayLiteralExpression(
              template.nodes.map((_, i) =>
                ts.factory.createIdentifier(
                  createVarNameFromNode(_._tag, { ...ctx, path: Chunk.of(i) })
                )
              )
            )
          ]
        )
      )
    )
  }

  // Includes Events
  if (template.parts.some(([x]) => x._tag === "event")) {
    effects.push(
      ts.factory.createExpressionStatement(createEffectYield(
        createMethodCall(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`templateContext`), `eventSource`),
          `setup`,
          [],
          [
            ts.factory.createIdentifier(template.nodes.length > 1 ? `wire` : `element0`),
            ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`templateCount`), `parentScope`)
          ]
        )
      ))
    )
  }

  ctx.imports.addImport(`@typed/template/RenderEvent`, "RenderEvent")

  // Emit our DOM elements
  effects.push(
    ts.factory.createExpressionStatement(
      createEffectYield(
        createMethodCall("sink", "onSuccess", [], [
          createFunctionCall(
            ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`RenderEvent`), `DomRenderEvent`),
            [
              ts.factory.createIdentifier(template.nodes.length > 1 ? "wire" : "element0")
            ]
          )
        ])
      )
    )
  )

  addEffectNamespace(ctx.imports)
  ctx.imports.addImport(`effect/Scope`, "Scope")

  // Allow the template to last forever
  effects.push(
    ts.factory.createExpressionStatement(
      createEffectYield(
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`Effect`), `never`),
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`Effect`), `onExit`),
          [],
          [ts.factory.createArrowFunction(
            [],
            [],
            [ts.factory.createParameterDeclaration([], undefined, `exit`)],
            undefined,
            undefined,
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`Scope`), `close`),
              [],
              [
                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`templateContext`), `scope`),
                ts.factory.createIdentifier(`exit`)
              ]
            )
          )]
        )
      )
    )
  )

  return effects
}

class CreateNodeCtx {
  constructor(
    readonly parts: ReadonlyArray<ParsedPart>,
    readonly remaining: Array<ParsedTemplate>,
    readonly imports: ImportDeclarationManager,
    readonly path: Chunk.Chunk<number>,
    readonly target: CompilerTarget,
    readonly templatePath: Chunk.Chunk<number>,
    readonly parent?: string
  ) {}
}

function* createDomNodeStatements(
  node: Template.Node | Template.TextPartNode,
  ctx: CreateNodeCtx
): NestedIterable<ts.Statement> {
  const parentName = createVarNameFromNode(ctx.parent ?? "element", ctx)
  const nested = { ...ctx, parent: node._tag }
  switch (node._tag) {
    case "element":
    case "self-closing-element":
    case "text-only-element":
      return yield createElementStatements(node, nested)
    case "node":
      return yield createNodePartStatements(parentName, node, nested)
    case "text":
      return yield createTextNodeStatements(parentName, node, nested)
    case "text-part":
      return yield createTextPartNodeStatements(parentName, node, nested)
    case "comment":
      return yield createCommentNodeStatements(node, nested)
    case "comment-part":
      return yield createCommentPartStatements(node, nested)
    case "sparse-comment":
      return yield createSparseCommentNodeStatements(node, nested)
    // TODO: Handle for HTML
    case "doctype":
      return
    default:
      return
  }
}

function* createElementStatements(
  node: Template.ElementNode | Template.SelfClosingElementNode | Template.TextOnlyElement,
  ctx: CreateNodeCtx
): NestedIterable<ts.Statement> {
  const varName = createVarNameFromNode(node._tag, ctx)
  yield createConst(varName, createElement(node.tagName))

  for (const attr of node.attributes) {
    yield createAttributeStatements(varName, attr, ctx)
  }

  if (node._tag === "self-closing-element") return

  for (const child of node.children) {
    yield createDomNodeStatements(child, ctx)
  }
}

function createVarNameFromNode<S extends string>(
  tag: S,
  ctx: CreateNodeCtx
): string {
  const name = splitHypensTakeLast(tag)
  return createNodeVarName(name, ctx)
}

function createNodeVarName(tag: string, ctx: CreateNodeCtx): string {
  const base = `${tag}${Array.from(ctx.path).join("")}`
  if (Chunk.isEmpty(ctx.templatePath)) return base
  return `template${Chunk.join(Chunk.map(ctx.templatePath, String), "")}_${base}`
}

// Attributes

function* createAttributeStatements(
  parent: string,
  attr: Template.Attribute,
  ctx: CreateNodeCtx
): NestedIterable<ts.Statement> {
  switch (attr._tag) {
    case "attribute":
      return yield createAttributeNodeStatements(parent, attr)
    case "attr":
      return yield createAttributePartStatements(parent, attr, ctx)
    case "boolean":
      return yield createBooleanNodeStatements(parent, attr)
    case "boolean-part":
      return yield createBooleanPartStatements(parent, attr, ctx)
    case "className-part":
      return yield createClassNamePartStatements(parent, attr, ctx)
    case "data":
      return yield createDataNodeStatements(parent, attr, ctx)
    case "event":
      return yield createEventNodeStatements(parent, attr, ctx)
    case "properties":
      return yield createPropertiesNodeStatements(parent, attr, ctx)
    case "property":
      return yield createPropertyNodeStatements(parent, attr, ctx)
    case "ref":
      return yield createRefNodeStatements(parent, attr, ctx)
    case "sparse-attr":
      return yield createSparseAttrNodeStatements(parent, attr, ctx)
    case "sparse-class-name":
      return yield createSparseClassNameNodeStatements(parent, attr, ctx)
    // Shouldn't really happen
    case "text":
  }
}

function* createAttributeNodeStatements(
  parent: string,
  attr: Template.AttributeNode
): Iterable<ts.Statement> {
  yield ts.factory.createExpressionStatement(setAttribute(parent, attr.name, attr.value, false))
}

function* createAttributePartStatements(
  parent: string,
  attr: Template.AttrPartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_attr_${attr.name}`
  const templateValues = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(`templateContext`),
    `values`
  )

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupAttrPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(attr.index)),
        ts.factory.createPropertyAssignment(`name`, ts.factory.createStringLiteral(attr.name))
      ]),
      ts.factory.createIdentifier(parent),
      ts.factory.createIdentifier(`templateContext`),
      ts.factory.createElementAccessExpression(
        Chunk.reduce(
          ctx.templatePath,
          templateValues as ts.Expression,
          (expr, index) => ts.factory.createElementAccessExpression(expr, index)
        ),
        attr.index
      )
    ])
  )

  yield runPartIfNotNull(varName, ctx)
}

function* createBooleanNodeStatements(parent: string, attr: Template.BooleanNode): Iterable<ts.Statement> {
  yield ts.factory.createExpressionStatement(toggleAttribute(parent, attr.name))
}

function* createBooleanPartStatements(
  parent: string,
  attr: Template.BooleanPartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_attr_${attr.name}`
  const templateValues = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(`templateContext`),
    `values`
  )

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupBooleanPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(attr.index)),
        ts.factory.createPropertyAssignment(`name`, ts.factory.createStringLiteral(attr.name))
      ]),
      ts.factory.createIdentifier(parent),
      ts.factory.createIdentifier(`templateContext`),
      ts.factory.createElementAccessExpression(
        Chunk.reduce(
          ctx.templatePath,
          templateValues as ts.Expression,
          (expr, index) => ts.factory.createElementAccessExpression(expr, index)
        ),
        attr.index
      )
    ])
  )

  yield runPartIfNotNull(varName, ctx)
}

function* createClassNamePartStatements(
  parent: string,
  attr: Template.ClassNamePartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_class`
  const templateValues = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(`templateContext`),
    `values`
  )

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupClassNamePart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(attr.index))
      ]),
      ts.factory.createIdentifier(parent),
      ts.factory.createIdentifier(`templateContext`),
      ts.factory.createElementAccessExpression(
        Chunk.reduce(
          ctx.templatePath,
          templateValues as ts.Expression,
          (expr, index) => ts.factory.createElementAccessExpression(expr, index)
        ),
        attr.index
      )
    ])
  )

  yield runPartIfNotNull(varName, ctx)
}

function* createDataNodeStatements(
  parent: string,
  attr: Template.DataPartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_data`
  const templateValues = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(`templateContext`),
    `values`
  )

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupDataPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(attr.index))
      ]),
      ts.factory.createIdentifier(parent),
      ts.factory.createIdentifier(`templateContext`),
      ts.factory.createElementAccessExpression(
        Chunk.reduce(
          ctx.templatePath,
          templateValues as ts.Expression,
          (expr, index) => ts.factory.createElementAccessExpression(expr, index)
        ),
        attr.index
      )
    ])
  )

  yield runPartIfNotNull(varName, ctx)
}

function* createEventNodeStatements(
  parent: string,
  attr: Template.EventPartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_event_${attr.name}`
  const templateValues = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(`templateContext`),
    `values`
  )

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupEventPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(attr.index)),
        ts.factory.createPropertyAssignment(`name`, ts.factory.createStringLiteral(attr.name))
      ]),
      ts.factory.createIdentifier(parent),
      ts.factory.createIdentifier(`templateContext`),
      ts.factory.createElementAccessExpression(
        Chunk.reduce(
          ctx.templatePath,
          templateValues as ts.Expression,
          (expr, index) => ts.factory.createElementAccessExpression(expr, index)
        ),
        attr.index
      )
    ])
  )

  yield runPartIfNotNull(varName, ctx)
}

function* createPropertiesNodeStatements(
  parent: string,
  attr: Template.PropertiesPartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_properties`
  const templateValues = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(`templateContext`),
    `values`
  )

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupPropertiesPart`, [], [
      ts.factory.createIdentifier(parent),
      ts.factory.createIdentifier(`templateContext`),
      ts.factory.createElementAccessExpression(
        Chunk.reduce(
          ctx.templatePath,
          templateValues as ts.Expression,
          (expr, index) => ts.factory.createElementAccessExpression(expr, index)
        ),
        attr.index
      )
    ])
  )

  yield runPartIfNotNull(varName, ctx)
}

function* createPropertyNodeStatements(
  parent: string,
  attr: Template.PropertyPartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_property_${attr.name}`
  const templateValues = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(`templateContext`),
    `values`
  )

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupPropertyPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(attr.index)),
        ts.factory.createPropertyAssignment(`name`, ts.factory.createStringLiteral(attr.name))
      ]),
      ts.factory.createIdentifier(parent),
      ts.factory.createIdentifier(`templateContext`),
      ts.factory.createElementAccessExpression(
        Chunk.reduce(
          ctx.templatePath,
          templateValues as ts.Expression,
          (expr, index) => ts.factory.createElementAccessExpression(expr, index)
        ),
        attr.index
      )
    ])
  )

  yield runPartIfNotNull(varName, ctx)
}

function* createRefNodeStatements(
  parent: string,
  attr: Template.RefPartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_ref`
  const templateValues = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(`templateContext`),
    `values`
  )

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupRefPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(attr.index))
      ]),
      ts.factory.createIdentifier(parent),
      ts.factory.createElementAccessExpression(
        Chunk.reduce(
          ctx.templatePath,
          templateValues as ts.Expression,
          (expr, index) => ts.factory.createElementAccessExpression(expr, index)
        ),
        attr.index
      )
    ])
  )
}

function* createSparseAttrNodeStatements(
  parent: string,
  attr: Template.SparseAttrNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_attr_${attr.name}`

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupSparseAttrPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(
          `nodes`,
          ts.factory.createArrayLiteralExpression(attr.nodes.map((node) =>
            node._tag === "text" ?
              ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(`_tag`, ts.factory.createStringLiteral(node._tag)),
                ts.factory.createPropertyAssignment(`value`, ts.factory.createNumericLiteral(node.value))
              ]) :
              ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(`_tag`, ts.factory.createStringLiteral(node._tag)),
                ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(node.index))
              ])
          ))
        )
      ]),
      ts.factory.createIdentifier(parent),
      createSparseTemplateContext(ctx)
    ])
  )
}

function* createSparseClassNameNodeStatements(
  parent: string,
  attr: Template.SparseClassNameNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = `${parent}_class`

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupSparseClassNamePart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(
          `nodes`,
          ts.factory.createArrayLiteralExpression(attr.nodes.map((node) =>
            node._tag === "text" ?
              ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(`_tag`, ts.factory.createStringLiteral(node._tag)),
                ts.factory.createPropertyAssignment(`value`, ts.factory.createStringLiteral(node.value))
              ]) :
              ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(`_tag`, ts.factory.createStringLiteral(node._tag)),
                ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(node.index))
              ])
          ))
        )
      ]),
      ts.factory.createIdentifier(parent),
      createSparseTemplateContext(ctx)
    ])
  )

  yield runPartIfNotNull(varName, ctx)
}

function createSparseTemplateContext(
  ctx: CreateNodeCtx
) {
  if (Chunk.isEmpty(ctx.templatePath)) return ts.factory.createIdentifier(`templateContext`)
  const last = Chunk.unsafeLast(ctx.templatePath)

  return ts.factory.createObjectLiteralExpression([
    ts.factory.createSpreadAssignment(ts.factory.createIdentifier(`templateContext`)),
    ts.factory.createPropertyAssignment(
      `values`,
      ts.factory.createElementAccessExpression(
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`templateContext`), "values"),
        last
      )
    )
  ])
}

// End of Attributes

// Node Parts

function* createNodePartStatements(
  parentName: string,
  node: Template.NodePart,
  ctx: CreateNodeCtx
): NestedIterable<ts.Statement> {
  const parsedPart = ctx.parts.find((p) => p.index === node.index)!
  if (parsedPart.kind === "template") {
    yield createTemplateNodePartStatements(parentName, node, ctx)
  } else {
    yield createStandardNodePartStatements(parentName, node, ctx)
  }
}

function* createStandardNodePartStatements(
  parentName: string,
  node: Template.NodePart,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = makeNodePartVarName(node.index, ctx.templatePath)
  const commentVarName = `${varName}_comment`

  addCompilerToolsNamespace(ctx.imports)
  addEffectNamespace(ctx.imports)

  // TODO: Support hydration
  yield createConst(commentVarName, createComment(`hole${node.index}`))

  yield ts.factory.createExpressionStatement(appendChild(parentName, commentVarName))

  yield createConst(
    varName,
    createMethodCall(`CompilerTools`, `setupNodePart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(node.index))
      ]),
      ts.factory.createIdentifier(commentVarName),
      ts.factory.createIdentifier(`templateContext`),
      ts.factory.createNull(),
      ts.factory.createArrayLiteralExpression([])
    ])
  )

  yield ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createIdentifier(varName),
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.factory.createNull()
    ),
    ts.factory.createBlock(
      [
        ts.factory.createExpressionStatement(
          createEffectYield(
            ts.factory.createIdentifier(varName),
            createMethodCall(`Effect`, `catchAllCause`, [], [
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(`sink`),
                `onFailure`
              )
            ]),
            createMethodCall(`Effect`, `forkIn`, [], [
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(`templateContext`),
                `scope`
              )
            ])
          )
        )
      ],
      true
    )
  )
}

function runPartIfNotNull(varName: string, ctx: CreateNodeCtx) {
  addEffectNamespace(ctx.imports)

  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createIdentifier(varName),
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.factory.createNull()
    ),
    ts.factory.createBlock(
      [
        ts.factory.createExpressionStatement(
          createEffectYield(
            ts.factory.createIdentifier(varName),
            createMethodCall(`Effect`, `catchAllCause`, [], [
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(`sink`),
                `onFailure`
              )
            ]),
            createMethodCall(`Effect`, `forkIn`, [], [
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(`templateContext`),
                `scope`
              )
            ])
          )
        )
      ],
      true
    )
  )
}

function makeNodePartVarName(partIndex: number, templatePath: Chunk.Chunk<number>): string {
  return Chunk.isEmpty(templatePath)
    ? `nodePart${partIndex}`
    : `template${Chunk.join(Chunk.map(templatePath, String), "")}_nodePart${partIndex}`
}

function* createTemplateNodePartStatements(
  parentName: string,
  node: Template.NodePart,
  ctx: CreateNodeCtx
): NestedIterable<ts.Statement> {
  // Templates are guaranteed to be in same order as when parsed
  const parsedTemplate = ctx.remaining.shift()!
  const nestedCtx = { ...ctx, templatePath: Chunk.append(ctx.templatePath, node.index), path: Chunk.empty() }

  yield createDomTemplateStatements(parsedTemplate.template, nestedCtx)

  for (let i = 0; i < parsedTemplate.template.nodes.length; i++) {
    yield ts.factory.createExpressionStatement(
      appendChild(
        parentName,
        createVarNameFromNode(parsedTemplate.template.nodes[i]._tag, {
          ...nestedCtx,
          path: Chunk.of(i)
        })
      )
    )
  }
}

function splitHypensTakeLast<S extends string>(str: S): SplitLastHyphen<S> {
  const parts = str.split("-")
  return parts[parts.length - 1] as SplitLastHyphen<S>
}

type SplitLastHyphen<S extends string> = S extends `${infer _}-${infer R}` ? SplitLastHyphen<R> : S

function* createTextNodeStatements(
  parent: string,
  text: Template.TextNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  // TODO: Special handling single text node

  const varName = createVarNameFromNode(text._tag, ctx)
  const textNode = createText(text.value)

  yield createConst(varName, textNode)
  yield ts.factory.createExpressionStatement(appendChild(parent, varName))
}

function* createCommentNodeStatements(
  node: Template.CommentNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = createVarNameFromNode(node._tag, ctx)
  const commentNode = createComment(node.value)

  yield createConst(varName, commentNode)
  yield ts.factory.createExpressionStatement(appendChild(ctx.parent ?? "element", varName))
}

function* createCommentPartStatements(
  node: Template.CommentPartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = createVarNameFromNode(node._tag, ctx)
  const commentNode = createComment("")
  const partVarName = `${varName}_part`

  addCompilerToolsNamespace(ctx.imports)

  yield createConst(varName, commentNode)
  yield ts.factory.createExpressionStatement(appendChild(ctx.parent ?? "element", varName))
  yield createConst(
    partVarName,
    createMethodCall(`CompilerTools`, `setupCommentPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(node.index))
      ]),
      ts.factory.createIdentifier(varName),
      ts.factory.createIdentifier(`templateContext`)
    ])
  )
  yield runPartIfNotNull(partVarName, ctx)
}

function addEffectNamespace(imports: ImportDeclarationManager) {
  imports.addImport(`effect/Effect`, "Effect")
}

function addCompilerToolsNamespace(imports: ImportDeclarationManager) {
  imports.addImport(`@typed/template/compiler-tools`, "CompilerTools")
}

function* createSparseCommentNodeStatements(
  node: Template.SparseCommentNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = createVarNameFromNode(node._tag, ctx)
  const commentNode = createComment("")
  const partVarName = `${varName}_part`

  yield createConst(varName, commentNode)
  yield ts.factory.createExpressionStatement(appendChild(ctx.parent ?? "element", varName))
  yield createConst(
    partVarName,
    createMethodCall(`CompilerTools`, `setupSparseCommentPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(
          `nodes`,
          ts.factory.createArrayLiteralExpression(node.nodes.map((n) => {
            if (n._tag === "text") {
              return ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(`_tag`, ts.factory.createStringLiteral(n._tag)),
                ts.factory.createPropertyAssignment(`value`, ts.factory.createStringLiteral(n.value))
              ])
            } else {
              return ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(`_tag`, ts.factory.createStringLiteral(n._tag)),
                ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(n.index))
              ])
            }
          }))
        )
      ]),
      ts.factory.createIdentifier(varName),
      createSparseTemplateContext(ctx)
    ])
  )
  yield runPartIfNotNull(partVarName, ctx)
}

function* createTextPartNodeStatements(
  parent: string,
  node: Template.TextPartNode,
  ctx: CreateNodeCtx
): Iterable<ts.Statement> {
  const varName = createVarNameFromNode(node._tag, ctx)
  const commentNode = createComment("")
  const partVarName = `${varName}_part`

  yield createConst(varName, commentNode)

  yield ts.factory.createExpressionStatement(appendChild(parent, varName))

  yield createConst(
    partVarName,
    createMethodCall(`CompilerTools`, `setupTextPart`, [], [
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(node.index))
      ]),
      ts.factory.createIdentifier(varName),
      ts.factory.createIdentifier(`templateContext`)
    ])
  )

  yield runPartIfNotNull(partVarName, ctx)
}

class ImportDeclarationManager {
  readonly existingImports: Map<string, Array<SimpleImportDecl>> = new Map()
  // We only support namespaced imports for simplicity
  readonly imports: Map<string, string> = new Map()

  private _appendExistingImport = (from: string, declaration: SimpleImportDecl) => {
    const existing = this.existingImports.get(from)
    if (existing) {
      existing.push(declaration)
    } else {
      this.existingImports.set(from, [declaration])
    }
  }

  addExistingImport(declaration: ts.ImportDeclaration) {
    const moduleSpecifier = declaration.moduleSpecifier.getText().slice(1, -1)
    const namedBindings = declaration.importClause?.namedBindings

    const couldContainHtmlImport = moduleSpecifier === "@typed/core" || moduleSpecifier === "@typed/template" ||
      moduleSpecifier === "@typed/template/RenderTemplate"

    if (namedBindings) {
      if (ts.isNamespaceImport(namedBindings)) {
        this._appendExistingImport(moduleSpecifier, {
          kind: "namespace",
          name: namedBindings.name.getText()
        })
      } else {
        for (const element of namedBindings.elements) {
          // We want to remove this import eventually
          if (couldContainHtmlImport && element.name.getText() === "html") continue

          this._appendExistingImport(moduleSpecifier, {
            kind: "named",
            name: element.name.getText(),
            as: element.propertyName?.getText() ?? element.name.getText()
          })
        }
      }
    } else {
      this._appendExistingImport(moduleSpecifier, {
        kind: "default",
        name: declaration.importClause!.name!.getText()
      })
    }
  }

  addImport(from: string, namespace: string) {
    if (!hasExistingDestination(this.existingImports, from, namespace)) {
      this.imports.set(from, namespace)
    }
  }

  updateImportStatements(statements: ts.NodeArray<ts.Statement>): Array<ts.Statement> {
    const imports: Array<ts.ImportDeclaration> = []

    for (const [from, name] of this.imports) {
      imports.push(
        ts.factory.createImportDeclaration(
          undefined,
          ts.factory.createImportClause(
            false,
            undefined,
            ts.factory.createNamespaceImport(ts.factory.createIdentifier(name))
          ),
          ts.factory.createStringLiteral(from)
        )
      )
    }

    for (const [from, decls] of this.existingImports) {
      const defaultImport = decls.find((x) => x.kind === "default")
      const namespaceImport = decls.find((x) => x.kind === "namespace")
      const others = decls.filter((x): x is NamedImportDecl => x.kind === "named")

      // TODO: We should probably optimize @typed/core imports too

      // Convert to namespace imports from direct modules
      if (from === "effect" && others.length > 0) {
        others.forEach((x) => {
          imports.push(ts.factory.createImportDeclaration(
            undefined,
            ts.factory.createImportClause(
              false,
              undefined,
              ts.factory.createNamespaceImport(ts.factory.createIdentifier(x.as))
            ),
            ts.factory.createStringLiteral(`${from}/${x.name}`)
          ))
        })
      } else if (namespaceImport) {
        imports.push(ts.factory.createImportDeclaration(
          undefined,
          ts.factory.createImportClause(
            false,
            undefined,
            ts.factory.createNamespaceImport(ts.factory.createIdentifier(namespaceImport.name))
          ),
          ts.factory.createStringLiteral(from)
        ))
      } else {
        imports.push(ts.factory.createImportDeclaration(
          undefined,
          ts.factory.createImportClause(
            false,
            defaultImport ? ts.factory.createIdentifier(defaultImport.name) : undefined,
            others.length > 0
              ? ts.factory.createNamedImports(
                others.map((x) =>
                  ts.factory.createImportSpecifier(
                    false,
                    x.name === x.as ? undefined : ts.factory.createIdentifier(x.name),
                    ts.factory.createIdentifier(x.as)
                  )
                )
              )
              : undefined
          ),
          ts.factory.createStringLiteral(from)
        ))
      }
    }

    return [
      ...imports,
      ...statements.filter((x) => !ts.isImportDeclaration(x))
    ]
  }
}

function hasExistingDestination(
  existingImports: Map<string, Array<SimpleImportDecl>>,
  from: string,
  namespace: string
): boolean {
  const simpleCheck = existingImports.get(from)?.some((x) => x.kind === "namespace" && x.name === namespace) ?? false

  if (simpleCheck) return true

  if (from.startsWith("effect/")) {
    const effectName = from.slice(7)
    const hasEffectImport = existingImports.get("effect")?.some((x) => x.kind === "named" && x.name === effectName)
    if (hasEffectImport) return true
  } else if (from.startsWith("@typed/")) {
    const typedName = from.slice(7)
    const hasCoreImport = existingImports.get("@typed/core")?.some((x) => x.kind === "named" && x.name === typedName)
    if (hasCoreImport) return true
  }

  return false
}

type SimpleImportDecl = NamedImportDecl | DefaultImportDecl | NamespaceImportDecl

interface NamedImportDecl {
  kind: "named"
  name: string
  as: string
}

interface DefaultImportDecl {
  kind: "default"
  name: string
}

interface NamespaceImportDecl {
  kind: "namespace"
  name: string
}
