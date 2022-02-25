import { A, U } from 'ts-toolbelt'

import {
  AST,
  DynamicFunctionParam,
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  Kind,
  KindParam,
  KindReturn,
  Property,
  StaticFunctionParam,
  StaticReturn,
  StaticTypeParam,
  TypeParam,
} from './AST'
import { findHKTParams } from './findHKTParams'

export interface Context {
  readonly lengths: Map<symbol, number>
  readonly positions: Map<symbol, number>
  readonly existing: Map<symbol, readonly KindParam[]>
}

export function buildContext(
  ast: FunctionSignature | Interface,
  possibility: ReadonlyArray<number>,
): Context {
  switch (ast.tag) {
    case FunctionSignature.tag:
      return buildContextFromFunctionSignature(ast, possibility)
    case Interface.tag:
      return buildContextFromInterface(ast, possibility)
  }
}

export function buildContextFromFunctionSignature(
  signature: FunctionSignature,
  possibility: ReadonlyArray<number>,
): Context {
  const hkts = findHKTParams(signature.typeParams)
  const lengths = new Map<symbol, number>(hkts.map((hkt, i) => [hkt.id, possibility[i]] as const))
  const positions = new Map<symbol, number>(hkts.map((hkt, i) => [hkt.id, i + 1] as const))
  const existing = findExistingParameters(signature)

  return {
    lengths,
    positions,
    existing,
  }
}

export function buildContextFromInterface(
  node: Interface,
  possibility: ReadonlyArray<number>,
): Context {
  const hkts = findHKTParams(node.typeParams)
  const lengths = new Map<symbol, number>(hkts.map((hkt, i) => [hkt.id, possibility[i]] as const))
  const positions = new Map<symbol, number>(hkts.map((hkt, i) => [hkt.id, i + 1] as const))
  const existing = findExistingParameters(node)

  return {
    lengths,
    positions,
    existing,
  }
}

export function findExistingParameters(
  ast: FunctionSignature | Interface,
): Map<symbol, readonly KindParam[]> {
  switch (ast.tag) {
    case FunctionSignature.tag:
      return findExistingParametersForFunctionSignature(ast)
    case Interface.tag:
      return findExistingParametersForInterface(ast)
  }
}

export function findExistingParametersForFunctionSignature(
  signature: FunctionSignature,
): Map<symbol, readonly KindParam[]> {
  const existing = new Map<symbol, readonly KindParam[]>()

  walkAst(signature, {
    ...defaultVisitors(),
    Kind: (node) => {
      existing.set(
        node.type.id,
        node.typeParams.filter((x) => x.tag !== 'HKTPlaceholder'),
      )
    },
    KindReturn: (node) => {
      existing.set(
        node.type.id,
        node.typeParams.filter((x) => x.tag !== 'HKTPlaceholder'),
      )
    },
  })

  return existing
}

export function findExistingParametersForInterface(
  node: Interface,
): Map<symbol, readonly KindParam[]> {
  const existing = new Map<symbol, readonly KindParam[]>()

  walkAst(node, {
    ...defaultVisitors(),
    Kind: (node) => {
      existing.set(
        node.type.id,
        node.typeParams.filter((x) => x.tag !== 'HKTPlaceholder'),
      )
    },
    KindReturn: (node) => {
      existing.set(
        node.type.id,
        node.typeParams.filter((x) => x.tag !== 'HKTPlaceholder'),
      )
    },
  })

  return existing
}

type Visitors = {
  readonly [K in AST['tag']]: (node: FindAstNode<K>) => void
}

type FindAstNode<K extends AST['tag']> = FindAstNode_<U.ListOf<AST>, K>

type FindAstNode_<Nodes extends readonly AST[], K extends AST['tag']> = Nodes extends readonly [
  infer Head,
  ...infer Tail
]
  ? A.Cast<Head, AST>['tag'] extends K
    ? Head
    : FindAstNode_<A.Cast<Tail, readonly AST[]>, K>
  : unknown

function identity<A>(value: A): A {
  return value
}

function defaultVisitors(): Visitors {
  return {
    DynamicFunctionParam: identity,
    FunctionSignature: identity,
    HKTParam: identity,
    HKTPlaceholder: identity,
    Interface: identity,
    Kind: identity,
    KindReturn: identity,
    Property: identity,
    StaticTypeParam: identity,
    StaticFunctionParam: identity,
    StaticReturn: identity,
    Tuple: identity,
  }
}

function walkAst(node: AST, visitors: Visitors) {
  switch (node.tag) {
    case Interface.tag:
      return walkInterface(node, visitors)
    case Property.tag:
      return walkProperty(node, visitors)
    case FunctionSignature.tag:
      return walkFunctionSignature(node, visitors)
    case HKTParam.tag:
      return walkHKTParam(node, visitors)
    case HKTPlaceholder.tag:
      return walkHKTPlaceholder(node, visitors)
    case StaticTypeParam.tag:
      return walkStaticTypeParam(node, visitors)
    case StaticFunctionParam.tag:
      return walkStaticFunctionParam(node, visitors)
    case DynamicFunctionParam.tag:
      return walkDynamicFunctionParam(node, visitors)
    case Kind.tag:
      return walkKind(node, visitors)
    case KindReturn.tag:
      return walkKindReturn(node, visitors)
    case StaticReturn.tag:
      return walkStaticReturn(node, visitors)
  }
}

function walkInterface(node: Interface, visitors: Visitors) {
  visitors.Interface(node)
  node.typeParams.forEach((typeParam) => walkAst(typeParam, visitors))
  node.properties.forEach((property) => walkProperty(property, visitors))
}

function walkProperty(node: Property, visitors: Visitors) {
  visitors.Property(node)
  walkFunctionSignature(node.signature, visitors)
}

function walkFunctionSignature(node: FunctionSignature, visitors: Visitors): void {
  visitors.FunctionSignature(node)

  node.typeParams.forEach((typeParam) => walkAst(typeParam, visitors))
  node.functionParams.forEach((p) => {
    switch (p.tag) {
      case Kind.tag:
        return walkKind(p, visitors)
      case StaticFunctionParam.tag:
        return walkStaticFunctionParam(p, visitors)
      case DynamicFunctionParam.tag:
        return walkDynamicFunctionParam(p, visitors)
    }
  })

  switch (node.returnSignature.tag) {
    case FunctionSignature.tag:
      return walkFunctionSignature(node.returnSignature, visitors)
    case KindReturn.tag:
      return walkKindReturn(node.returnSignature, visitors)
    case StaticReturn.tag:
      return walkStaticReturn(node.returnSignature, visitors)
  }
}

function walkHKTParam(node: HKTParam, visitors: Visitors) {
  visitors.HKTParam(node)
}

function walkHKTPlaceholder(node: HKTPlaceholder, visitors: Visitors) {
  visitors.HKTPlaceholder(node)
}

function walkStaticTypeParam(node: StaticTypeParam, visitors: Visitors) {
  visitors.StaticTypeParam(node)
}

function walkStaticFunctionParam(node: StaticFunctionParam, visitors: Visitors) {
  visitors.StaticFunctionParam(node)
}

function walkDynamicFunctionParam(
  node: DynamicFunctionParam<readonly TypeParam[]>,
  visitors: Visitors,
) {
  visitors.DynamicFunctionParam(node)
}

function walkKind(node: Kind, visitors: Visitors) {
  visitors.Kind(node)
}

function walkKindReturn(node: KindReturn, visitors: Visitors) {
  visitors.KindReturn(node)
}

function walkStaticReturn(node: StaticReturn, visitors: Visitors) {
  visitors.StaticReturn(node)
}
