/**
 * Compiler is an all-in-one package for compile-time optimization and derivations
 * of Typed libraries and applications.
 *
 * @since 1.0.0
 */

import { parse } from "@typed/template/Parser"
import type { Template } from "@typed/template/Template"
import ts from "typescript"
import { findTsConfig } from "./typescript/findConfigFile.js"
import type { Project } from "./typescript/Project.js"
import { Service } from "./typescript/Service.js"

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
  readonly project: Project
  checker: ts.TypeChecker

  constructor(readonly directory: string, readonly tsConfig?: string) {
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

    getTaggedTemplateLiteralExpressions(sourceFile).forEach((expression) => {
      const tag = expression.tag.getText()
      // Only parse html tagged templates
      if (tag === "html") {
        const literal = expression.template
        const [template, parts] = this.parseTemplateFromNode(literal)
        templates.push({ literal, template, parts })
      }
    })

    return templates.sort(sortParsedTemplates)
  }

  private enhanceLanguageServiceHost = (_host: ts.LanguageServiceHost): void => {
  }

  private parseTemplateFromNode(node: ts.TemplateLiteral): readonly [Template, ReadonlyArray<ParsedPart>] {
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
      kind: this.getPartType(type),
      type
    }
  }

  private getPartType(type: ts.Type): ParsedPart["kind"] {
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
  if (bStart < aEnd) return -1
  if (aEnd < bStart) return 1

  return 0
}

function getSpan(template: ParsedTemplate) {
  return [template.literal.getStart(), template.literal.getEnd()] as const
}

export interface ParsedTemplate {
  readonly literal: ts.TemplateLiteral
  readonly parts: ReadonlyArray<ParsedPart>
  readonly template: Template
}

export interface ParsedPart {
  readonly index: number
  readonly kind: "placeholder" | "fxEffect" | "fx" | "effect" | "primitive" | "directive"
  readonly type: ts.Type
}

function getTaggedTemplateLiteralExpressions(node: ts.SourceFile) {
  const toProcess: Array<ts.Node> = node.getChildren()
  const matches: Array<ts.TaggedTemplateExpression> = []

  while (toProcess.length) {
    const node = toProcess.shift()!

    if (node.kind === ts.SyntaxKind.TaggedTemplateExpression) {
      matches.push(node as ts.TaggedTemplateExpression)
    }

    toProcess.push(...node.getChildren())
  }

  return matches
}
