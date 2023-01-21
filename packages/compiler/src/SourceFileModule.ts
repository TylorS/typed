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
  readonly isFx: boolean
  readonly hasLayout: boolean
  readonly hasEnvironment: boolean
  readonly hasStaticPaths: boolean
}

export type LayoutSourceFileModule = BasicLayoutModule | LayoutModuleWithEnvironment

export interface BasicLayoutModule {
  readonly _tag: 'Layout/Basic'
  readonly sourceFile: SourceFile
}

export interface LayoutModuleWithEnvironment {
  readonly _tag: 'Layout/Environment'
  readonly sourceFile: SourceFile
}

export type RedirectSourceFileModule = BasicRedirectModule | RedirectModuleWithEnvironment

export interface BasicRedirectModule {
  readonly _tag: 'Redirect/Basic'
  readonly sourceFile: SourceFile
  readonly hasParams: boolean
}

export interface RedirectModuleWithEnvironment {
  readonly _tag: 'Redirect/Environment'
  readonly sourceFile: SourceFile
  readonly hasParams: boolean
}

export type FallbackSourceFileModule = BasicFallbackModule | FallbackModuleWithEnvironment

export interface BasicFallbackModule {
  readonly _tag: 'Fallback/Basic'
  readonly isFx: boolean
  readonly sourceFile: SourceFile
  readonly hasLayout: boolean
}

export interface FallbackModuleWithEnvironment {
  readonly _tag: 'Fallback/Environment'
  readonly isFx: boolean
  readonly sourceFile: SourceFile
  readonly hasLayout: boolean
}

export interface EnvironmentSourceFileModule {
  readonly _tag: 'Environment'
  readonly sourceFile: SourceFile
}

export function isLayoutModule(module: SourceFileModule): module is LayoutSourceFileModule {
  return module._tag === 'Layout/Basic' || module._tag === 'Layout/Environment'
}

export function isRenderModule(module: SourceFileModule): module is RenderSourceFileModule {
  return module._tag === 'Render'
}

export function isRedirectModule(module: SourceFileModule): module is RedirectSourceFileModule {
  return module._tag === 'Redirect/Basic' || module._tag === 'Redirect/Environment'
}

export function isFallbackModule(module: SourceFileModule): module is FallbackSourceFileModule {
  return module._tag === 'Fallback/Basic' || module._tag === 'Fallback/Environment'
}

export function isEnvironmentModule(
  module: SourceFileModule,
): module is EnvironmentSourceFileModule {
  return module._tag === 'Environment'
}
