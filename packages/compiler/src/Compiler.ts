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
  private templatesByFile: Map<string, ReadonlyArray<ParsedTemplate>> = new Map()

  readonly project: Project
  readonly checker: ts.TypeChecker

  constructor(
    readonly directory: string,
    readonly tsConfig?: string,
    readonly target: "dom" | "server" | "static" = "dom"
  ) {
    this._cmdLine = findTsConfig(directory, tsConfig)
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

  parseTemplates(sourceFile: ts.SourceFile): ReadonlyArray<ParsedTemplate> {
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
    sourceFile: ts.SourceFile
  ) {
    const files = this.project.emitFile(sourceFile.fileName)
    const js = ts.ScriptSnapshot.fromString(files.find((x) => x.name.endsWith(".js"))!.text)
    const dts = ts.ScriptSnapshot.fromString(files.find((x) => x.name.endsWith(".d.ts"))!.text)
    const map = ts.ScriptSnapshot.fromString(files.find((x) => x.name.endsWith(".js.map"))!.text)

    return {
      js,
      dts,
      map
    }
  }

  private getTransformersByFileAndTarget(
    templates: ReadonlyArray<ParsedTemplate>
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
              if (this.target === "dom") {
                return this.replaceDom(template, remaining, importManager)
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
    { parts, template }: ParsedTemplate,
    remaining: ReadonlyArray<ParsedTemplate>,
    imports: ImportDeclarationManager
  ): ts.Node {
    const sink = ts.factory.createParameterDeclaration([], undefined, `sink`)
    const ctx = new CreateNodeCtx(parts, remaining, imports, Chunk.empty(), this.target, Chunk.empty())
    const setupNodes = createDomSetupStatements(ctx)
    const domEffects = createDomEffectStatements(template, ctx)

    // Must come last to avoid mutation affecting behaviors of other nodes above
    const domNodes = createDomTemplateStatements(template, ctx)

    imports.addImport(`@typed/fx`, "Fx")
    imports.addImport(`effect/Effect`, "Effect")

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
  //   remaining: ReadonlyArray<ParsedTemplate>,
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
            const transformers = this.getTransformersByFileAndTarget(templates)
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
      const lastChild = children[children.length - 1]
      const parts: Array<ParsedPart> = []
      const spans = children.map((child, i) => {
        if (child.kind === ts.SyntaxKind.TemplateSpan) {
          const [part, literal] = child.getChildren()
          parts.push(this.parsePart(part as ts.Expression, i))
          const text = literal.getText()
          if (child === lastChild) return text.slice(1, -1)
          return text.slice(1)
        } else {
          throw new Error(`Unexpected syntax kind: ${ts.SyntaxKind[child.kind]}`)
        }
      })

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
        node: part as ts.TemplateLiteral,
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

// function getTypeArguments(checker: ts.TypeChecker, type: ts.Type): Array<ts.TypeNode> {
//   return checker.getTypeArguments(type as ts.TypeReference).map((t) => checker.typeToTypeNode(t, undefined, undefined)!)
// }

function createDomTemplateStatements(
  template: Template.Template,
  currentCtx: CreateNodeCtx
): Array<ts.Statement> {
  return template.nodes.flatMap((node, i) =>
    createDomNodeStatements(node, { ...currentCtx, path: Chunk.append(currentCtx.path, i) })
  )
}

function createDomSetupStatements(ctx: CreateNodeCtx): Array<ts.Statement> {
  if (ctx.parts.length > 0 && ctx.parts.some((x) => x.kind !== "primitive")) {
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
        createMethodCall(`CompilerTools`, `makeTemplateContext`, [], [
          ts.factory.createIdentifier(`document`),
          ts.factory.createIdentifier(`renderContext`),
          partsToValues(ctx.parts),
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`sink`), `onFailure`)
        ])
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
              `expected`,
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
                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`templateContext`), `refCounter`),
                `wait`
              )
            )
          )
        ]
      )
    )
  )

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
              [ts.factory.createIdentifier(`scope`), ts.factory.createIdentifier(`exit`)]
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
    readonly remaining: ReadonlyArray<ParsedTemplate>,
    readonly imports: ImportDeclarationManager,
    readonly path: Chunk.Chunk<number>,
    readonly target: "dom" | "server" | "static",
    readonly templateIndex: Chunk.Chunk<number>,
    readonly parent?: string
  ) {}
}

function createDomNodeStatements(node: Template.Node | Template.TextPartNode, ctx: CreateNodeCtx): Array<ts.Statement> {
  const nested = { ...ctx, parent: node._tag }
  const parentName = createNodeVarName(ctx.parent ?? "element", ctx)
  switch (node._tag) {
    case "element":
    case "self-closing-element":
    case "text-only-element":
      return createElementStatements(node, nested)
    case "node":
      return createNodePartStatements(node, nested)
    case "text":
      return createTextNodeStatements(parentName, node, nested)
    case "text-part":
      return createTextPartNodeStatements(parentName, node, nested)
    case "comment":
      return createCommentNodeStatements(node, nested)
    case "comment-part":
      return createCommentPartStatements(node, nested)
    case "sparse-comment":
      return createSparseCommentNodeStatements(node, nested)
    // TODO: Handle for HTML
    case "doctype":
      return []
    default:
      return []
  }
}

function createElementStatements(
  node: Template.ElementNode | Template.SelfClosingElementNode | Template.TextOnlyElement,
  ctx: CreateNodeCtx
): Array<ts.Statement> {
  const varName = createNodeVarName(node._tag, ctx)

  return [
    // Create the element
    createConst(varName, createElement(node.tagName)),
    // Setup any attributes
    ...node.attributes.flatMap((attr) => createAttributeStatements(varName, attr, ctx)),
    // Create the children
    ...(node._tag === "self-closing-element"
      ? []
      : node.children.flatMap((child) => createDomNodeStatements(child, ctx)))
  ]
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
  if (Chunk.isEmpty(ctx.templateIndex)) return base
  return `template${Chunk.join(Chunk.map(ctx.templateIndex, String), "")}_${base}`
}

// Attributes

function createAttributeStatements(parent: string, attr: Template.Attribute, ctx: CreateNodeCtx): Array<ts.Statement> {
  switch (attr._tag) {
    case "attribute":
      return createAttributeNodeStatements(parent, attr)
    case "attr":
      return createAttributePartStatements(parent, attr, ctx)
    case "boolean":
      return createBooleanNodeStatements(parent, attr)
    case "boolean-part":
      return createBooleanPartStatements(parent, attr)
    case "className-part":
      return createClassNamePartStatements(parent, attr)
    case "data":
      return createDataNodeStatements(parent, attr)
    case "event":
      return createEventNodeStatements(parent, attr)
    case "properties":
      return createPropertiesNodeStatements(parent, attr)
    case "property":
      return createPropertyNodeStatements(parent, attr)
    case "ref":
      return createRefNodeStatements(parent, attr)
    case "sparse-attr":
      return createSparseAttrNodeStatements(parent, attr)
    case "sparse-class-name":
      return createSparseClassNameNodeStatements(parent, attr)
    // Shouldn't really happen
    case "text":
      return []
  }
}

function createAttributeNodeStatements(
  parent: string,
  attr: Template.AttributeNode
): Array<ts.Statement> {
  return [
    ts.factory.createExpressionStatement(setAttribute(parent, attr.name, attr.value, false))
  ]
}

function createAttributePartStatements(
  parent: string,
  attr: Template.AttrPartNode,
  ctx: CreateNodeCtx
): Array<ts.Statement> {
  const varName = createVarNameFromNode(`${parent}_attr_${attr.name}`, ctx)
  const templateValues = ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(`templateContext`),
    `values`
  )

  addCompilerToolsNamespace(ctx.imports)

  return [
    createConst(
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
            ctx.templateIndex,
            templateValues as ts.Expression,
            (expr, index) => ts.factory.createElementAccessExpression(expr, index)
          ),
          attr.index
        )
      ])
    )
  ]
}

function createBooleanNodeStatements(parent: string, attr: Template.BooleanNode): Array<ts.Statement> {
  return [
    ts.factory.createExpressionStatement(toggleAttribute(parent, attr.name))
  ]
}

function createBooleanPartStatements(_parent: string, _attr: Template.BooleanPartNode): Array<ts.Statement> {
  return []
}

function createClassNamePartStatements(_parent: string, _attr: Template.ClassNamePartNode): Array<ts.Statement> {
  return []
}

function createDataNodeStatements(_parent: string, _attr: Template.DataPartNode): Array<ts.Statement> {
  return []
}

function createEventNodeStatements(_parent: string, _attr: Template.EventPartNode): Array<ts.Statement> {
  return []
}

function createPropertiesNodeStatements(_parent: string, _attr: Template.PropertiesPartNode): Array<ts.Statement> {
  return []
}

function createPropertyNodeStatements(_parent: string, _attr: Template.PropertyPartNode): Array<ts.Statement> {
  return []
}

function createRefNodeStatements(_parent: string, _attr: Template.RefPartNode): Array<ts.Statement> {
  return []
}

function createSparseAttrNodeStatements(_parent: string, _attr: Template.SparseAttrNode): Array<ts.Statement> {
  return []
}

function createSparseClassNameNodeStatements(
  _parent: string,
  _attr: Template.SparseClassNameNode
): Array<ts.Statement> {
  return []
}

// End of Attributes

// Node Parts

function createNodePartStatements(node: Template.NodePart, ctx: CreateNodeCtx): Array<ts.Statement> {
  const parsedPart = ctx.parts.find((p) => p.index === node.index)!
  if (parsedPart.kind === "template") return createTemplateNodePartStatements(node, ctx)

  return createStandardNodePartStatements(node, ctx)
}

function createStandardNodePartStatements(
  node: Template.NodePart,
  ctx: CreateNodeCtx
): Array<ts.Statement> {
  const elementVarName = createNodeVarName("element", ctx)
  const varName = makeNodePartVarName(node.index, ctx.templateIndex)
  const commentVarName = `${varName}_comment`

  addCompilerToolsNamespace(ctx.imports)
  addEffectNamespace(ctx.imports)

  // TODO: Support hydration
  return [
    createConst(commentVarName, createComment(`hole${node.index}`)),
    ts.factory.createExpressionStatement(appendChild(elementVarName, commentVarName)),
    createConst(
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
    ),
    ts.factory.createIfStatement(
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
  ]
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

function makeNodePartVarName(partIndex: number, templateIndex: Chunk.Chunk<number>): string {
  return Chunk.isEmpty(templateIndex)
    ? `nodePart${partIndex}`
    : `template${Chunk.join(Chunk.map(templateIndex, String), "")}_nodePart${partIndex}`
}

function createTemplateNodePartStatements(
  node: Template.NodePart,
  ctx: CreateNodeCtx
): Array<ts.Statement> {
  const parentElement = createNodeVarName("element", ctx)
  const parsedTemplate = ctx.remaining[node.index]
  const nestedCtx = { ...ctx, templateIndex: Chunk.append(ctx.templateIndex, node.index), path: Chunk.empty() }
  return [
    ...createDomTemplateStatements(parsedTemplate.template, nestedCtx),
    ...parsedTemplate.template.nodes.map((node, i) => {
      const varName = splitHypensTakeLast(node._tag)
      return ts.factory.createExpressionStatement(
        appendChild(
          parentElement,
          createNodeVarName(varName, { ...nestedCtx, path: Chunk.of(i) })
        )
      )
    })
  ]
}

function splitHypensTakeLast<S extends string>(str: S): SplitLastHyphen<S> {
  const parts = str.split("-")
  return parts[parts.length - 1] as SplitLastHyphen<S>
}

type SplitLastHyphen<S extends string> = S extends `${infer _}-${infer R}` ? SplitLastHyphen<R> : S

function createTextNodeStatements(parent: string, text: Template.TextNode, ctx: CreateNodeCtx): Array<ts.Statement> {
  // TODO: Special handling single text node

  const varName = createVarNameFromNode(text._tag, ctx)
  const textNode = createText(text.value)

  return [
    createConst(varName, textNode),
    ts.factory.createExpressionStatement(appendChild(parent, varName))
  ]
}

function createCommentNodeStatements(
  node: Template.CommentNode,
  ctx: CreateNodeCtx
): Array<ts.Statement> {
  const varName = createVarNameFromNode(node._tag, ctx)
  const commentNode = createComment(node.value)

  return [
    createConst(varName, commentNode),
    ts.factory.createExpressionStatement(appendChild(ctx.parent ?? "element", varName))
  ]
}

function createCommentPartStatements(
  node: Template.CommentPartNode,
  ctx: CreateNodeCtx
): Array<ts.Statement> {
  const varName = createVarNameFromNode(node._tag, ctx)
  const commentNode = createComment("")
  const partVarName = `${varName}_part`

  addCompilerToolsNamespace(ctx.imports)
  return [
    createConst(varName, commentNode),
    ts.factory.createExpressionStatement(appendChild(ctx.parent ?? "element", varName)),
    createConst(
      partVarName,
      createMethodCall(`CompilerTools`, `setupCommentPart`, [], [
        ts.factory.createObjectLiteralExpression([
          ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(node.index))
        ]),
        ts.factory.createIdentifier(varName),
        ts.factory.createIdentifier(`templateContext`)
      ])
    ),
    runPartIfNotNull(partVarName, ctx)
  ]
}

function addEffectNamespace(imports: ImportDeclarationManager) {
  imports.addImport(`effect/Effect`, "Effect")
}

function addCompilerToolsNamespace(imports: ImportDeclarationManager) {
  imports.addImport(`@typed/template/compiler-tools`, "CompilerTools")
}

function createSparseCommentNodeStatements(
  node: Template.SparseCommentNode,
  ctx: CreateNodeCtx
): Array<ts.Statement> {
  const varName = createVarNameFromNode(node._tag, ctx)
  const commentNode = createComment("")
  const partVarName = `${varName}_part`

  return [
    createConst(varName, commentNode),
    ts.factory.createExpressionStatement(appendChild(ctx.parent ?? "element", varName)),
    createConst(
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
        ])
      ])
    ),
    runPartIfNotNull(partVarName, ctx)
  ]
}

function createTextPartNodeStatements(
  parent: string,
  node: Template.TextPartNode,
  ctx: CreateNodeCtx
): Array<ts.Statement> {
  const varName = createVarNameFromNode(node._tag, ctx)
  const commentNode = createComment("")
  const partVarName = `${varName}_part`

  return [
    createConst(varName, commentNode),
    ts.factory.createExpressionStatement(appendChild(parent, varName)),
    createConst(
      partVarName,
      createMethodCall(`CompilerTools`, `setupTextPart`, [], [
        ts.factory.createObjectLiteralExpression([
          ts.factory.createPropertyAssignment(`index`, ts.factory.createNumericLiteral(node.index))
        ]),
        ts.factory.createIdentifier(varName),
        ts.factory.createIdentifier(`templateContext`)
      ])
    ),
    runPartIfNotNull(partVarName, ctx)
  ]
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

    const couldContainHtmlImport = moduleSpecifier === "@typed/core" || moduleSpecifier === "@typed/template"

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

      if (namespaceImport) {
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
