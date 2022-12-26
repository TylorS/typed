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
}

export interface RenderModuleWithEnvironment {
  readonly _tag: 'Render/Environment'
  readonly sourceFile: SourceFile
  readonly isFx: boolean
  readonly hasLayout: boolean
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
}

export interface RedirectModuleWithEnvironment {
  readonly _tag: 'Redirect/Environment'
  readonly sourceFile: SourceFile
}

export type FallbackSourceFileModule = BasicFallbackModule | FallbackModuleWithEnvironment

export interface BasicFallbackModule {
  readonly _tag: 'Fallback/Basic'
  readonly isFx: boolean
  readonly sourceFile: SourceFile
}

export interface FallbackModuleWithEnvironment {
  readonly _tag: 'Fallback/Environment'
  readonly isFx: boolean
  readonly sourceFile: SourceFile
}
