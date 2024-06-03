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
  createConst,
  createEffectYield,
  createElement,
  createFunctionCall,
  createMethodCall,
  createTypeReference,
  createUnion,
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
                return this.replaceDom(template, remaining)
              }

              // return this.replaceHtml(template, remaining, target === "static")
            }
          }

          return ts.visitEachChild(node, templateVisitor, ctx)
        }

        const file = ts.visitEachChild(sourceFile, templateVisitor, ctx)

        // TODO: Add our imports

        return file
      }
    ]
  }

  private replaceDom(
    { parts, template }: ParsedTemplate,
    remaining: ReadonlyArray<ParsedTemplate>
  ): ts.Node {
    // TODO: Generate our function block
    //    - Generate all of our base elements
    //    - Track the path of each element
    //    - Connect optimized variants of interpolations
    // TOOD: Generate Import types

    const outputType = createTypeReference(`RenderEvent`)
    const errorType = createUnion(parts.flatMap((p) => partToErrorTypes(this.checker, p)))
    const contextType = createTypeReference(`SinkContext`)
    const sink = ts.factory.createParameterDeclaration(
      [],
      undefined,
      `sink`,
      undefined,
      createTypeReference(`Sink`, outputType, errorType, contextType)
    )

    const domNodes = createDomTemplateStatements(
      template,
      new CreateNodeCtx(parts, remaining, Chunk.empty(), this.target, { value: -1 })
    )
    const domEffects = createDomEffectStatements(template)

    return createMethodCall(
      "Fx",
      "make",
      [],
      [
        ts.factory.createArrowFunction(
          [],
          [ts.factory.createTypeParameterDeclaration([], `SinkContext`)],
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
              ts.factory.createBlock([...domNodes, ...domEffects], true)
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
          parts.push(this.parsePart(part, i))
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

  private parsePart(part: ts.Node, index: number): ParsedPart {
    const type = this.project.getType(part)
    return {
      index,
      kind: this.getPartType(part, type),
      type
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

export interface ParsedPart {
  readonly index: number
  readonly kind: "placeholder" | "fxEffect" | "fx" | "effect" | "primitive" | "directive" | "template"
  readonly type: ts.Type
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

function partToErrorTypes(checker: ts.TypeChecker, part: ParsedPart): Array<ts.TypeNode> {
  if (part.kind === "primitive") return []
  const [, errorType] = getTypeArguments(checker, part.type)
  return errorType ? [errorType] : []
}

// function partToContextTypes(checker: ts.TypeChecker, part: ParsedPart): Array<ts.TypeNode> {
//   if (part.kind === "primitive") return []
//   const [, , contextType] = getTypeArguments(checker, part.type)
//   return contextType ? [contextType] : []
// }

function getTypeArguments(checker: ts.TypeChecker, type: ts.Type): Array<ts.TypeNode> {
  return checker.getTypeArguments(type as ts.TypeReference).map((t) => checker.typeToTypeNode(t, undefined, undefined)!)
}

function createDomTemplateStatements(
  template: Template.Template,
  currentCtx: CreateNodeCtx
): Array<ts.Statement> {
  return template.nodes.flatMap((node, i) =>
    createNodeStatements(node, { ...currentCtx, path: Chunk.append(currentCtx.path, i) })
  )
}

function createDomEffectStatements(template: Template.Template) {
  const effects: Array<ts.Statement> = []
  const statements: Array<ts.Statement> = []

  // If there's more than one element, we need to wire them together
  if (template.nodes.length > 1) {
    statements.push(
      createConst(
        `wire`,
        ts.factory.createCallExpression(
          ts.factory.createIdentifier(`persistent`),
          [],
          [ts.factory.createArrayLiteralExpression(
            template.nodes.map((_, i) => ts.factory.createIdentifier(`element${i}`))
          )]
        )
      )
    )
  }

  // Emit our DOM effects
  effects.push(
    ts.factory.createExpressionStatement(
      createEffectYield(
        createMethodCall("sink", "onSuccess", [], [
          createFunctionCall(`DomRenderEvent`, [
            ts.factory.createIdentifier(template.nodes.length > 1 ? "wire" : "element0")
          ])
        ])
      )
    )
  )

  // Allow the template to last forever
  effects.push(
    ts.factory.createExpressionStatement(
      createEffectYield(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(`Effect`), `never`))
    )
  )

  return [...statements, ...effects]
}

class CreateNodeCtx {
  constructor(
    readonly parts: ReadonlyArray<ParsedPart>,
    readonly remaining: ReadonlyArray<ParsedTemplate>,
    readonly path: Chunk.Chunk<number>,
    readonly target: "dom" | "server" | "static",
    readonly templateIndex: { value: number }
  ) {}
}

function createNodeStatements(node: Template.Node, ctx: CreateNodeCtx): Array<ts.Statement> {
  switch (node._tag) {
    case "element":
      return createElementStatements(node, ctx)
    case "node":
      return createNodePartStatements(node, ctx)
    default:
      return []
  }
}

function createElementStatements(node: Template.ElementNode, ctx: CreateNodeCtx): Array<ts.Statement> {
  const statements: Array<ts.Statement> = []
  const varName = createNodeVarName(node, ctx)

  // Create the elements
  statements.push(createConst(varName, createElement(node.tagName)))
  // Setup any attributes
  statements.push(...node.attributes.flatMap((attr) => createAttributeStatements(varName, attr)))
  // Create the children
  statements.push(
    ...node.children.flatMap((child) => createNodeStatements(child, ctx))
  )

  return statements
}

function createNodeVarName(node: Pick<Template.Node, "_tag">, ctx: CreateNodeCtx): string {
  const base = `${node._tag.replace("-", "_")}${Array.from(ctx.path).join("")}`
  if (ctx.templateIndex.value === -1) return base
  return `template${ctx.templateIndex.value}_${base}`
}

// Attributes

function createAttributeStatements(parent: string, attr: Template.Attribute): Array<ts.Statement> {
  switch (attr._tag) {
    case "attribute":
      return createAttributeNodeStatements(parent, attr)
    case "attr":
      return createAttributePartStatements(parent, attr)
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
    case "text":
      return createTextNodeStatements(parent, attr)
  }
}

function createAttributeNodeStatements(parent: string, attr: Template.AttributeNode): Array<ts.Statement> {
  return [
    ts.factory.createExpressionStatement(setAttribute(parent, attr.name, attr.value))
  ]
}

function createAttributePartStatements(_parent: string, _attr: Template.AttrPartNode): Array<ts.Statement> {
  return []
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

function createTextNodeStatements(_parent: string, _attr: Template.TextNode): Array<ts.Statement> {
  return []
}

// End of Attributes

// Node Parts

function createNodePartStatements(node: Template.NodePart, ctx: CreateNodeCtx): Array<ts.Statement> {
  const parsedPart = ctx.parts.find((p) => p.index === node.index)!
  switch (parsedPart.kind) {
    case "directive":
      return createDirectiveNodePartStatements(node, ctx)
    case "effect":
      return createEffectNodePartStatements(node, ctx)
    case "fx":
      return createFxNodePartStatements(node, ctx)
    case "fxEffect":
      return createFxEffectNodePartStatements(node, ctx)
    case "placeholder":
      return createPlaceholderNodePartStatements(node, ctx)
    case "primitive":
      return createPrimitiveNodePartStatements(node, ctx)
    case "template":
      return createTemplateNodePartStatements(node, ctx)
  }
}

function createDirectiveNodePartStatements(
  _node: Template.NodePart,
  _ctx: CreateNodeCtx
): Array<ts.Statement> {
  return []
}

function createEffectNodePartStatements(
  _node: Template.NodePart,
  _ctx: CreateNodeCtx
): Array<ts.Statement> {
  return []
}

function createFxNodePartStatements(
  _node: Template.NodePart,
  _ctx: CreateNodeCtx
): Array<ts.Statement> {
  return []
}

function createFxEffectNodePartStatements(
  _node: Template.NodePart,
  _ctx: CreateNodeCtx
): Array<ts.Statement> {
  return []
}

function createPlaceholderNodePartStatements(
  _node: Template.NodePart,
  _ctx: CreateNodeCtx
): Array<ts.Statement> {
  return []
}

function createPrimitiveNodePartStatements(
  _node: Template.NodePart,
  _ctx: CreateNodeCtx
): Array<ts.Statement> {
  return []
}

function createTemplateNodePartStatements(
  node: Template.NodePart,
  currentCtx: CreateNodeCtx
): Array<ts.Statement> {
  const parentElement = createNodeVarName({ _tag: "element" }, currentCtx)
  currentCtx.templateIndex.value++
  const parsedTemplate = currentCtx.remaining[node.index]
  const nestedCtx = { ...currentCtx, path: Chunk.empty() }
  return [
    ...createDomTemplateStatements(parsedTemplate.template, nestedCtx),
    ...parsedTemplate.template.nodes.map((node, i) => {
      return ts.factory.createExpressionStatement(
        appendChild(parentElement, createNodeVarName(node, { ...nestedCtx, path: Chunk.of(i) }))
      )
    })
  ]
}
