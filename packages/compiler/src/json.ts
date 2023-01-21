import { relative } from 'path'

import type { SourceFile } from 'ts-morph'

import type { ApiModuleTree } from './ApiModuleTree.js'
import type { ModuleTree, ModuleTreeWithFallback } from './readModules.js'

export type ModuleTreeJson = SourceFileToJson<ModuleTree>

export type ModuleTreeJsonWithFallback = SourceFileToJson<ModuleTreeWithFallback>

export type SourceFileToJson<T> = {
  readonly [K in keyof T]: T[K] extends SourceFile
    ? string
    : [keyof NonNullable<T[K]>] extends [never]
    ? T[K]
    : SourceFileToJson<NonNullable<T[K]>>
}

export function moduleTreeToJson(
  sourceDirectory: string,
  tree: ModuleTreeWithFallback,
): ModuleTreeJsonWithFallback {
  return {
    directory: relative(sourceDirectory, tree.directory),
    modules: tree.modules.map((x) => ({
      ...x,
      sourceFile: relative(sourceDirectory, x.sourceFile.getFilePath()),
    })),
    children: tree.children.map((c) => moduleTreeToJson(sourceDirectory, c)),
    ...(tree.layout
      ? {
          layout: {
            ...tree.layout,
            sourceFile: relative(sourceDirectory, tree.layout.sourceFile.getFilePath()),
          },
        }
      : {}),
    ...(tree.environment
      ? {
          environment: {
            ...tree.environment,
            sourceFile: relative(sourceDirectory, tree.environment.sourceFile.getFilePath()),
          },
        }
      : {}),
    ...(tree.fallback
      ? {
          fallback: {
            ...tree.fallback,
            sourceFile: relative(sourceDirectory, tree.fallback.sourceFile.getFilePath()),
          },
        }
      : {}),
  }
}

export type ApiModuleTreeJson = SourceFileToJson<ApiModuleTree>

export function apiModuleTreeToJson(
  sourceDirectory: string,
  tree: ApiModuleTree,
): ApiModuleTreeJson {
  return {
    directory: relative(sourceDirectory, tree.directory),
    modules: tree.modules.map((x) => ({
      ...x,
      sourceFile: relative(sourceDirectory, x.sourceFile.getFilePath()),
    })),
    children: tree.children.map((c) => apiModuleTreeToJson(sourceDirectory, c)),
    ...(tree.environment
      ? {
          environment: {
            ...tree.environment,
            sourceFile: relative(sourceDirectory, tree.environment.sourceFile.getFilePath()),
          },
        }
      : {}),
  }
}
