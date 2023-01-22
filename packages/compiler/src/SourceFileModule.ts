import type { SourceFile } from 'ts-morph'

export type SourceFileModule =
  | RenderSourceFileModule
  | LayoutSourceFileModule
  | RedirectSourceFileModule
  | FallbackSourceFileModule
  | EnvironmentSourceFileModule

export interface RenderSourceFileModule {
  readonly _tag: 'Render'
  readonly sourceFile: SourceFile
  readonly route: string
  readonly isFx: boolean
  readonly hasLayout: boolean
  readonly hasEnvironment: boolean
  readonly hasStaticPaths: boolean
}

export interface LayoutSourceFileModule {
  readonly _tag: 'Layout'
  readonly sourceFile: SourceFile
  readonly hasEnvironment: boolean
}

export interface RedirectSourceFileModule {
  readonly _tag: 'Redirect'
  readonly sourceFile: SourceFile
  readonly hasParams: boolean
  readonly hasEnvironment: boolean
}

export interface FallbackSourceFileModule {
  readonly _tag: 'Fallback'
  readonly isFx: boolean
  readonly sourceFile: SourceFile
  readonly hasLayout: boolean
  readonly hasEnvironment: boolean
}

export interface EnvironmentSourceFileModule {
  readonly _tag: 'Environment'
  readonly sourceFile: SourceFile
}

export function isLayoutModule(module: SourceFileModule): module is LayoutSourceFileModule {
  return module._tag === 'Layout'
}

export function isRenderModule(module: SourceFileModule): module is RenderSourceFileModule {
  return module._tag === 'Render'
}

export function isRedirectModule(module: SourceFileModule): module is RedirectSourceFileModule {
  return module._tag === 'Redirect'
}

export function isFallbackModule(module: SourceFileModule): module is FallbackSourceFileModule {
  return module._tag === 'Fallback'
}

export function isEnvironmentModule(
  module: SourceFileModule,
): module is EnvironmentSourceFileModule {
  return module._tag === 'Environment'
}
