// Accepts a list of values
// Accepts a render function for each header
// Accepts a render functions for each column
// Pagination controls
// Resizable columns
// Sortable columns
// Search/Filter
// Virtualized rows?
// Row selection?
// Row Expansion?
// Show/hide columns?
// Column reordering?
// Grouping?

// import * as Effect from '@effect/io/Effect'
// import * as Fx from '@typed/fx'
// import { Placeholder, RenderEvent, Rendered } from '@typed/html'

// export interface UseTableParams<
//   Data,
//   Headers extends UseTableParams.AnyHeaders<Data>,
//   Columns extends UseTableParams.AnyColumns<Data, Headers>,
// > {
//   readonly data: Data
//   readonly headers: Headers
//   readonly columns: Columns
// }

// export namespace UseTableParams {
//   export type Any = UseTableParams<any, AnyHeaders, AnyColumns>

//   export type AnyHeaders<Data = any> = {
//     readonly [K in keyof Data]?: TableHeader.Any<Data[K]>
//   }

//   export type AnyColumns<
//     Data = any,
//     Headers extends UseTableParams.AnyHeaders<Data> = UseTableParams.AnyHeaders<Data>,
//   > = {
//     readonly [K in keyof Headers]: TableColumn<TableHeader.Input<Headers[K]>, Placeholder.AnyOf>
//   }
// }

// export interface TableHeader<I, Rendered extends Placeholder.AnyOf> {
//   readonly render: (input: HeaderInput<I>) => Rendered
// }

// export namespace TableHeader {
//   export type Any<I = any> = TableHeader<I, Placeholder.AnyOf>

//   export type Input<T> = [T] extends [TableHeader<infer I, any>] ? I : never
//   export type Rendered<T> = [T] extends [TableHeader<any, infer R>] ? R : never
// }

// export interface HeaderInput<I> {
//   readonly column: Fx.Computed<never, never, number>
//   readonly value: Fx.RefSubject<never, I>
// }

// export interface TableColumn<I, Rendered extends Placeholder.AnyOf> {
//   readonly render: (input: ColumnInput<I>) => Rendered
// }

// export namespace TableColumn {
//   export type Any<I = any> = TableColumn<I, Placeholder.AnyOf>

//   export type Input<T> = [T] extends [TableColumn<infer I, any>] ? I : never
//   export type Rendered<T> = [T] extends [TableColumn<any, infer R>] ? R : never
// }

// export interface ColumnInput<I> {
//   readonly position: Fx.Computed<never, never, ColumnPosition>
//   readonly value: Fx.RefSubject<never, I>
// }

// export interface ColumnPosition {
//   readonly row: number
//   readonly column: number
// }

// export function useTable<
//   Data,
//   Headers extends UseTableParams.AnyHeaders<Data>,
//   Columns extends UseTableParams.AnyColumns<Data, Headers>,
// >(params: UseTableParams<Data, Headers, Columns>) {
//   return Effect.gen(function* ($) {
//     const data = yield* $(Fx.makeRefArray(Effect.succeed<readonly Data[]>([])))

//     return {
//       data,
//     } as const
//   })
// }

// export interface UseTable<
//   Data,
//   Headers extends UseTableParams.AnyHeaders<Data>,
//   Columns extends UseTableParams.AnyColumns<Data, Headers>,
// > {
//   readonly data: Fx.RefArray<never, Data>
// }
