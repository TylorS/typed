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
  readonly project: Project

  constructor(readonly directory: string, readonly tsConfig?: string) {
    this._cmdLine = findTsConfig(directory, tsConfig)
    this.project = this._service.openProject(this._cmdLine, this.enhanceLanguageServiceHost)
  }

  parseTemplates(sourceFile: ts.SourceFile): ReadonlyArray<ParsedTemplate> {
    const templates: Array<ParsedTemplate> = []

    getTaggedTemplateLiteralExpressions(sourceFile).forEach((expression) => {
      const tag = expression.tag.getText()
      if (tag === "html") {
        const literal = expression.template
        const template = parseTemplateFromNode(literal)
        templates.push({ literal, template })
      }
    })

    return templates.sort(sortParsedTemplates)
  }

  private enhanceLanguageServiceHost = (_host: ts.LanguageServiceHost): void => {
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
  readonly template: Template
}

function parseTemplateFromNode(node: ts.TemplateLiteral): Template {
  if (node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
    return parse([node.getText().slice(1, -1)])
  } else {
    const [head, syntaxList] = node.getChildren()
    const children = syntaxList.getChildren()
    const lastChild = children[children.length - 1]
    const parts = children.map((child) => {
      if (child.kind === ts.SyntaxKind.TemplateSpan) {
        const [, literal] = child.getChildren()
        const text = literal.getText()
        if (child === lastChild) return text.slice(1, -1)
        return text.slice(1)
      } else {
        throw new Error(`Unexpected syntax kind: ${ts.SyntaxKind[child.kind]}`)
      }
    })

    return parse([head.getText().slice(1, -2), ...parts])
  }
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
