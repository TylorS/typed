---
title: hyperscript.ts
nav_order: 2
parent: "@typed/ui"
---

## hyperscript overview

Hyperscript for @typed/template.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [HyperscriptForTagName (type alias)](#hyperscriptfortagname-type-alias)
  - [a](#a)
  - [abbr](#abbr)
  - [address](#address)
  - [area](#area)
  - [article](#article)
  - [aside](#aside)
  - [audio](#audio)
  - [b](#b)
  - [base](#base)
  - [bdi](#bdi)
  - [bdo](#bdo)
  - [blockquote](#blockquote)
  - [body](#body)
  - [br](#br)
  - [button](#button)
  - [canvas](#canvas)
  - [caption](#caption)
  - [cite](#cite)
  - [code](#code)
  - [col](#col)
  - [colgroup](#colgroup)
  - [createHyperscript](#createhyperscript)
  - [data](#data)
  - [datalist](#datalist)
  - [dd](#dd)
  - [del](#del)
  - [details](#details)
  - [dfn](#dfn)
  - [dialog](#dialog)
  - [div](#div)
  - [dl](#dl)
  - [dt](#dt)
  - [em](#em)
  - [embed](#embed)
  - [fieldset](#fieldset)
  - [figcaption](#figcaption)
  - [figure](#figure)
  - [footer](#footer)
  - [form](#form)
  - [h](#h)
  - [h1](#h1)
  - [h2](#h2)
  - [h3](#h3)
  - [h4](#h4)
  - [h5](#h5)
  - [h6](#h6)
  - [head](#head)
  - [header](#header)
  - [hgroup](#hgroup)
  - [hr](#hr)
  - [html](#html)
  - [i](#i)
  - [iframe](#iframe)
  - [img](#img)
  - [input](#input)
  - [ins](#ins)
  - [kbd](#kbd)
  - [label](#label)
  - [legend](#legend)
  - [li](#li)
  - [link](#link)
  - [main](#main)
  - [map](#map)
  - [mark](#mark)
  - [meta](#meta)
  - [meter](#meter)
  - [nav](#nav)
  - [noscript](#noscript)
  - [object](#object)
  - [ol](#ol)
  - [optgroup](#optgroup)
  - [option](#option)
  - [output](#output)
  - [p](#p)
  - [param](#param)
  - [picture](#picture)
  - [pre](#pre)
  - [progress](#progress)
  - [q](#q)
  - [rp](#rp)
  - [rt](#rt)
  - [ruby](#ruby)
  - [s](#s)
  - [samp](#samp)
  - [script](#script)
  - [section](#section)
  - [select](#select)
  - [small](#small)
  - [source](#source)
  - [span](#span)
  - [strong](#strong)
  - [style](#style)
  - [sub](#sub)
  - [summary](#summary)
  - [sup](#sup)
  - [table](#table)
  - [tbody](#tbody)
  - [td](#td)
  - [template](#template)
  - [textarea](#textarea)
  - [tfoot](#tfoot)
  - [th](#th)
  - [thead](#thead)
  - [time](#time)
  - [title](#title)
  - [tr](#tr)
  - [track](#track)
  - [u](#u)
  - [ul](#ul)
  - [video](#video)
  - [wbr](#wbr)

---

# utils

## HyperscriptForTagName (type alias)

**Signature**

```ts
export type HyperscriptForTagName<TagName extends keyof TypedPropertiesMap> = <
  const Props extends TypedPropertiesMap[TagName],
  const Children extends ReadonlyArray<Renderable<any, any>>
>(
  properties: Props,
  ...children: Children
) => Fx<
  RenderEvent,
  Placeholder.Error<Props[keyof Props] | Children[number]>,
  Scope.Scope | RenderTemplate | Placeholder.Context<Props[keyof Props] | Children[number]>
>
```

Added in v1.0.0

## a

**Signature**

```ts
export declare const a: HyperscriptForTagName<"a">
```

Added in v1.0.0

## abbr

**Signature**

```ts
export declare const abbr: HyperscriptForTagName<"abbr">
```

Added in v1.0.0

## address

**Signature**

```ts
export declare const address: HyperscriptForTagName<"address">
```

Added in v1.0.0

## area

**Signature**

```ts
export declare const area: HyperscriptForTagName<"area">
```

Added in v1.0.0

## article

**Signature**

```ts
export declare const article: HyperscriptForTagName<"article">
```

Added in v1.0.0

## aside

**Signature**

```ts
export declare const aside: HyperscriptForTagName<"aside">
```

Added in v1.0.0

## audio

**Signature**

```ts
export declare const audio: HyperscriptForTagName<"audio">
```

Added in v1.0.0

## b

**Signature**

```ts
export declare const b: HyperscriptForTagName<"b">
```

Added in v1.0.0

## base

**Signature**

```ts
export declare const base: HyperscriptForTagName<"base">
```

Added in v1.0.0

## bdi

**Signature**

```ts
export declare const bdi: HyperscriptForTagName<"bdi">
```

Added in v1.0.0

## bdo

**Signature**

```ts
export declare const bdo: HyperscriptForTagName<"bdo">
```

Added in v1.0.0

## blockquote

**Signature**

```ts
export declare const blockquote: HyperscriptForTagName<"blockquote">
```

Added in v1.0.0

## body

**Signature**

```ts
export declare const body: HyperscriptForTagName<"body">
```

Added in v1.0.0

## br

**Signature**

```ts
export declare const br: HyperscriptForTagName<"br">
```

Added in v1.0.0

## button

**Signature**

```ts
export declare const button: HyperscriptForTagName<"button">
```

Added in v1.0.0

## canvas

**Signature**

```ts
export declare const canvas: HyperscriptForTagName<"canvas">
```

Added in v1.0.0

## caption

**Signature**

```ts
export declare const caption: HyperscriptForTagName<"caption">
```

Added in v1.0.0

## cite

**Signature**

```ts
export declare const cite: HyperscriptForTagName<"cite">
```

Added in v1.0.0

## code

**Signature**

```ts
export declare const code: HyperscriptForTagName<"code">
```

Added in v1.0.0

## col

**Signature**

```ts
export declare const col: HyperscriptForTagName<"col">
```

Added in v1.0.0

## colgroup

**Signature**

```ts
export declare const colgroup: HyperscriptForTagName<"colgroup">
```

Added in v1.0.0

## createHyperscript

**Signature**

```ts
export declare function createHyperscript<const TagName extends keyof TypedPropertiesMap>(
  tagName: TagName
): HyperscriptForTagName<TagName>
```

Added in v1.0.0

## data

**Signature**

```ts
export declare const data: HyperscriptForTagName<"data">
```

Added in v1.0.0

## datalist

**Signature**

```ts
export declare const datalist: HyperscriptForTagName<"datalist">
```

Added in v1.0.0

## dd

**Signature**

```ts
export declare const dd: HyperscriptForTagName<"dd">
```

Added in v1.0.0

## del

**Signature**

```ts
export declare const del: HyperscriptForTagName<"del">
```

Added in v1.0.0

## details

**Signature**

```ts
export declare const details: HyperscriptForTagName<"details">
```

Added in v1.0.0

## dfn

**Signature**

```ts
export declare const dfn: HyperscriptForTagName<"dfn">
```

Added in v1.0.0

## dialog

**Signature**

```ts
export declare const dialog: HyperscriptForTagName<"dialog">
```

Added in v1.0.0

## div

**Signature**

```ts
export declare const div: HyperscriptForTagName<"div">
```

Added in v1.0.0

## dl

**Signature**

```ts
export declare const dl: HyperscriptForTagName<"dl">
```

Added in v1.0.0

## dt

**Signature**

```ts
export declare const dt: HyperscriptForTagName<"dt">
```

Added in v1.0.0

## em

**Signature**

```ts
export declare const em: HyperscriptForTagName<"em">
```

Added in v1.0.0

## embed

**Signature**

```ts
export declare const embed: HyperscriptForTagName<"embed">
```

Added in v1.0.0

## fieldset

**Signature**

```ts
export declare const fieldset: HyperscriptForTagName<"fieldset">
```

Added in v1.0.0

## figcaption

**Signature**

```ts
export declare const figcaption: HyperscriptForTagName<"figcaption">
```

Added in v1.0.0

## figure

**Signature**

```ts
export declare const figure: HyperscriptForTagName<"figure">
```

Added in v1.0.0

## footer

**Signature**

```ts
export declare const footer: HyperscriptForTagName<"footer">
```

Added in v1.0.0

## form

**Signature**

```ts
export declare const form: HyperscriptForTagName<"form">
```

Added in v1.0.0

## h

**Signature**

```ts
export declare function h<
  const TagName extends keyof TypedPropertiesMap,
  const Props extends TypedPropertiesMap[TagName],
  const Children extends ReadonlyArray<Renderable<any, any>>
>(
  tagName: TagName,
  properties: Props,
  ...children: Children
): Fx<
  RenderEvent,
  Placeholder.Error<Props[keyof Props] | Children[number]>,
  Scope.Scope | RenderTemplate | Placeholder.Context<Props[keyof Props] | Children[number]>
>
```

Added in v1.0.0

## h1

**Signature**

```ts
export declare const h1: HyperscriptForTagName<"h1">
```

Added in v1.0.0

## h2

**Signature**

```ts
export declare const h2: HyperscriptForTagName<"h2">
```

Added in v1.0.0

## h3

**Signature**

```ts
export declare const h3: HyperscriptForTagName<"h3">
```

Added in v1.0.0

## h4

**Signature**

```ts
export declare const h4: HyperscriptForTagName<"h4">
```

Added in v1.0.0

## h5

**Signature**

```ts
export declare const h5: HyperscriptForTagName<"h5">
```

Added in v1.0.0

## h6

**Signature**

```ts
export declare const h6: HyperscriptForTagName<"h6">
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: HyperscriptForTagName<"head">
```

Added in v1.0.0

## header

**Signature**

```ts
export declare const header: HyperscriptForTagName<"header">
```

Added in v1.0.0

## hgroup

**Signature**

```ts
export declare const hgroup: HyperscriptForTagName<"hgroup">
```

Added in v1.0.0

## hr

**Signature**

```ts
export declare const hr: HyperscriptForTagName<"hr">
```

Added in v1.0.0

## html

**Signature**

```ts
export declare const html: HyperscriptForTagName<"html">
```

Added in v1.0.0

## i

**Signature**

```ts
export declare const i: HyperscriptForTagName<"i">
```

Added in v1.0.0

## iframe

**Signature**

```ts
export declare const iframe: HyperscriptForTagName<"iframe">
```

Added in v1.0.0

## img

**Signature**

```ts
export declare const img: HyperscriptForTagName<"img">
```

Added in v1.0.0

## input

**Signature**

```ts
export declare const input: HyperscriptForTagName<"input">
```

Added in v1.0.0

## ins

**Signature**

```ts
export declare const ins: HyperscriptForTagName<"ins">
```

Added in v1.0.0

## kbd

**Signature**

```ts
export declare const kbd: HyperscriptForTagName<"kbd">
```

Added in v1.0.0

## label

**Signature**

```ts
export declare const label: HyperscriptForTagName<"label">
```

Added in v1.0.0

## legend

**Signature**

```ts
export declare const legend: HyperscriptForTagName<"legend">
```

Added in v1.0.0

## li

**Signature**

```ts
export declare const li: HyperscriptForTagName<"li">
```

Added in v1.0.0

## link

**Signature**

```ts
export declare const link: HyperscriptForTagName<"link">
```

Added in v1.0.0

## main

**Signature**

```ts
export declare const main: HyperscriptForTagName<"main">
```

Added in v1.0.0

## map

**Signature**

```ts
export declare const map: HyperscriptForTagName<"map">
```

Added in v1.0.0

## mark

**Signature**

```ts
export declare const mark: HyperscriptForTagName<"mark">
```

Added in v1.0.0

## meta

**Signature**

```ts
export declare const meta: HyperscriptForTagName<"meta">
```

Added in v1.0.0

## meter

**Signature**

```ts
export declare const meter: HyperscriptForTagName<"meter">
```

Added in v1.0.0

## nav

**Signature**

```ts
export declare const nav: HyperscriptForTagName<"nav">
```

Added in v1.0.0

## noscript

**Signature**

```ts
export declare const noscript: HyperscriptForTagName<"noscript">
```

Added in v1.0.0

## object

**Signature**

```ts
export declare const object: HyperscriptForTagName<"object">
```

Added in v1.0.0

## ol

**Signature**

```ts
export declare const ol: HyperscriptForTagName<"ol">
```

Added in v1.0.0

## optgroup

**Signature**

```ts
export declare const optgroup: HyperscriptForTagName<"optgroup">
```

Added in v1.0.0

## option

**Signature**

```ts
export declare const option: HyperscriptForTagName<"option">
```

Added in v1.0.0

## output

**Signature**

```ts
export declare const output: HyperscriptForTagName<"output">
```

Added in v1.0.0

## p

**Signature**

```ts
export declare const p: HyperscriptForTagName<"p">
```

Added in v1.0.0

## param

**Signature**

```ts
export declare const param: HyperscriptForTagName<"param">
```

Added in v1.0.0

## picture

**Signature**

```ts
export declare const picture: HyperscriptForTagName<"picture">
```

Added in v1.0.0

## pre

**Signature**

```ts
export declare const pre: HyperscriptForTagName<"pre">
```

Added in v1.0.0

## progress

**Signature**

```ts
export declare const progress: HyperscriptForTagName<"progress">
```

Added in v1.0.0

## q

**Signature**

```ts
export declare const q: HyperscriptForTagName<"q">
```

Added in v1.0.0

## rp

**Signature**

```ts
export declare const rp: HyperscriptForTagName<"rp">
```

Added in v1.0.0

## rt

**Signature**

```ts
export declare const rt: HyperscriptForTagName<"rt">
```

Added in v1.0.0

## ruby

**Signature**

```ts
export declare const ruby: HyperscriptForTagName<"ruby">
```

Added in v1.0.0

## s

**Signature**

```ts
export declare const s: HyperscriptForTagName<"s">
```

Added in v1.0.0

## samp

**Signature**

```ts
export declare const samp: HyperscriptForTagName<"samp">
```

Added in v1.0.0

## script

**Signature**

```ts
export declare const script: HyperscriptForTagName<"script">
```

Added in v1.0.0

## section

**Signature**

```ts
export declare const section: HyperscriptForTagName<"section">
```

Added in v1.0.0

## select

**Signature**

```ts
export declare const select: HyperscriptForTagName<"select">
```

Added in v1.0.0

## small

**Signature**

```ts
export declare const small: HyperscriptForTagName<"small">
```

Added in v1.0.0

## source

**Signature**

```ts
export declare const source: HyperscriptForTagName<"source">
```

Added in v1.0.0

## span

**Signature**

```ts
export declare const span: HyperscriptForTagName<"span">
```

Added in v1.0.0

## strong

**Signature**

```ts
export declare const strong: HyperscriptForTagName<"strong">
```

Added in v1.0.0

## style

**Signature**

```ts
export declare const style: HyperscriptForTagName<"style">
```

Added in v1.0.0

## sub

**Signature**

```ts
export declare const sub: HyperscriptForTagName<"sub">
```

Added in v1.0.0

## summary

**Signature**

```ts
export declare const summary: HyperscriptForTagName<"summary">
```

Added in v1.0.0

## sup

**Signature**

```ts
export declare const sup: HyperscriptForTagName<"sup">
```

Added in v1.0.0

## table

**Signature**

```ts
export declare const table: HyperscriptForTagName<"table">
```

Added in v1.0.0

## tbody

**Signature**

```ts
export declare const tbody: HyperscriptForTagName<"tbody">
```

Added in v1.0.0

## td

**Signature**

```ts
export declare const td: HyperscriptForTagName<"td">
```

Added in v1.0.0

## template

**Signature**

```ts
export declare const template: HyperscriptForTagName<"template">
```

Added in v1.0.0

## textarea

**Signature**

```ts
export declare const textarea: HyperscriptForTagName<"textarea">
```

Added in v1.0.0

## tfoot

**Signature**

```ts
export declare const tfoot: HyperscriptForTagName<"tfoot">
```

Added in v1.0.0

## th

**Signature**

```ts
export declare const th: HyperscriptForTagName<"th">
```

Added in v1.0.0

## thead

**Signature**

```ts
export declare const thead: HyperscriptForTagName<"thead">
```

Added in v1.0.0

## time

**Signature**

```ts
export declare const time: HyperscriptForTagName<"time">
```

Added in v1.0.0

## title

**Signature**

```ts
export declare const title: HyperscriptForTagName<"title">
```

Added in v1.0.0

## tr

**Signature**

```ts
export declare const tr: HyperscriptForTagName<"tr">
```

Added in v1.0.0

## track

**Signature**

```ts
export declare const track: HyperscriptForTagName<"track">
```

Added in v1.0.0

## u

**Signature**

```ts
export declare const u: HyperscriptForTagName<"u">
```

Added in v1.0.0

## ul

**Signature**

```ts
export declare const ul: HyperscriptForTagName<"ul">
```

Added in v1.0.0

## video

**Signature**

```ts
export declare const video: HyperscriptForTagName<"video">
```

Added in v1.0.0

## wbr

**Signature**

```ts
export declare const wbr: HyperscriptForTagName<"wbr">
```

Added in v1.0.0
