/**
 * Compiler is an all-in-one package for compile-time optimization and derivations
 * of Typed libraries and applications.
 *
 * @since 1.0.0
 */

import { parse } from "@typed/template/Parser"
import type { Template } from "@typed/template/Template"
import type { SourceFile, TemplateLiteral } from "ts-morph"
import { Project } from "ts-morph"
import ts from "typescript"
import { findTsConfig } from "./typescript/findConfigFile.js"

/**
 * Compiler is an all-in-one cass for compile-time optimization and derivations
 * of Typed libraries and applications.
 *
 * @since 1.0.0
 */
export class Compiler {
  private _cmdLine: ts.ParsedCommandLine
  private _cache: ts.ModuleResolutionCache

  readonly project: Project

  constructor(readonly directory: string, readonly tsConfig?: string) {
    this._cmdLine = findTsConfig(directory, tsConfig)
    this._cache = ts.createModuleResolutionCache(directory, (s) => s, this._cmdLine.options)
    this.project = new Project({
      compilerOptions: this._cmdLine.options,
      resolutionHost: (host, getOptions) => {
        return {
          ...host,
          resolveModuleNames: (moduleNames, containingFile, _reusedNames, redirectedReference, options) => {
            return moduleNames.map((moduleName) =>
              ts.resolveModuleName(
                moduleName,
                containingFile,
                options,
                host,
                this._cache,
                redirectedReference,
                ts.ModuleKind.ESNext
              ).resolvedModule
            )
          },
          getResolvedModuleWithFailedLookupLocationsFromCache: (moduleName, containingFile, resolutionMode) =>
            ts.resolveModuleName(
              moduleName,
              containingFile,
              getOptions(),
              host,
              this._cache,
              undefined,
              resolutionMode
            )
        }
      }
    })
  }

  parseTemplates(sourceFile: SourceFile): ReadonlyArray<ParsedTemplate> {
    const templates: Array<ParsedTemplate> = []

    sourceFile.getDescendantsOfKind(ts.SyntaxKind.TaggedTemplateExpression).forEach((expression) => {
      const tag = expression.getTag().getText()
      if (tag === "html") {
        const literal = expression.getTemplate()
        const template = parseTemplateFromNode(literal)
        templates.push({ literal, template })
      }
    })

    return templates.sort(sortParsedTemplates)
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
  readonly literal: TemplateLiteral
  readonly template: Template
}

function parseTemplateFromNode(node: TemplateLiteral): Template {
  if (node.isKind(ts.SyntaxKind.NoSubstitutionTemplateLiteral)) {
    return parse([node.getText().slice(1, -1)])
  } else {
    const [head, syntaxList] = node.getChildren()
    const children = syntaxList.getChildren()
    const lastChild = children[children.length - 1]
    const parts = children.map((child) => {
      if (child.isKind(ts.SyntaxKind.TemplateSpan)) {
        const [, literal] = child.getChildren()
        const text = literal.getText()
        if (child === lastChild) return text.slice(1, -1)
        return text.slice(1)
      } else {
        throw new Error(`Unexpected syntax kind: ${child.getKindName()}`)
      }
    })

    return parse([head.getText().slice(1, -2), ...parts])
  }
}
