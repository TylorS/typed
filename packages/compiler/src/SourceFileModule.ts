import { SourceFile } from 'ts-morph'

export type SourceFileModule =
  | RenderSourceFileModule
  | LayoutSourceFileModule
  | RedirectSourceFileModule
  | FallbackSourceFileModule

export type RenderSourceFileModule = BaseRenderModule | RenderModuleWithEnvironment

export interface BaseRenderModule {
  readonly _tag: 'Render/Basic'
  readonly sourceFile: SourceFile
  readonly isFx: boolean
  readonly hasLayout: boolean
  readonly isNested: boolean
}

export interface RenderModuleWithEnvironment {
  readonly _tag: 'Render/Environment'
  readonly sourceFile: SourceFile
  readonly isFx: boolean
  readonly hasLayout: boolean
  readonly isNested: boolean
}

export type LayoutSourceFileModule = BasicLayoutModule | LayoutModuleWithEnvironment

export interface BasicLayoutModule {
  readonly _tag: 'Layout/Basic'
  readonly sourceFile: SourceFile
  readonly isNested: boolean
}

export interface LayoutModuleWithEnvironment {
  readonly _tag: 'Layout/Environment'
  readonly sourceFile: SourceFile
  readonly isNested: boolean
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
  readonly isNested: boolean
}

export interface FallbackModuleWithEnvironment {
  readonly _tag: 'Fallback/Environment'
  readonly isFx: boolean
  readonly sourceFile: SourceFile
  readonly hasLayout: boolean
  readonly isNested: boolean
}

export function isLayoutModule(module: SourceFileModule): module is LayoutSourceFileModule {
  return module._tag === 'Layout/Basic' || module._tag === 'Layout/Environment'
}

export function isRenderModule(module: SourceFileModule): module is RenderSourceFileModule {
  return module._tag === 'Render/Basic' || module._tag === 'Render/Environment'
}

export function isRedirectModule(module: SourceFileModule): module is RedirectSourceFileModule {
  return module._tag === 'Redirect/Basic' || module._tag === 'Redirect/Environment'
}

export function isFallbackModule(module: SourceFileModule): module is FallbackSourceFileModule {
  return module._tag === 'Fallback/Basic' || module._tag === 'Fallback/Environment'
}
