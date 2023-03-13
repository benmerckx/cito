type Simplify<T> = T extends Object ? {[K in keyof T]: T[K]} : T
type WithOptionalProps<T> = Simplify<
  Partial<T> &
    Pick<
      T,
      {
        [K in keyof T]: T[K] extends Exclude<T[K], undefined> ? K : never
      }[keyof T]
    >
>

export type Cast<T, Source = unknown> = (data: Source) => T
export type Infer<Schema extends Cast<unknown>> = ReturnType<Schema>
// Chainable API
export interface Type<T> extends Cast<T> {
  map: <E>(extra: Cast<E, T>) => Type<E>
  or: <E>(extra: Cast<E>) => Type<E | T>
}

// Core
export const type = <T>(cast: Cast<T>): Type<T> => {
  ;(cast as Type<T>).map = extra => type(raw => extra(cast(raw)))
  ;(cast as Type<T>).or = extra =>
    type(raw => {
      try {
        return cast(raw)
      } catch (err) {
        return extra(raw)
      }
    })
  return cast as Type<T>
}

// Error helper
export const fail = () => ('bad banditype' as any)() as never

export const never = () => type(() => fail())
export const unknown = () => type(raw => raw)

// literals
// not sure why, but this signature prevents wideing [90] -> number[]
type Primitive = string | number | null | undefined | boolean | symbol | object
export const enums = <U extends Primitive, T extends readonly U[]>(items: T) =>
  type(raw => (items.includes(raw as T[number]) ? (raw as T[number]) : fail()))

// Basic types
type Func = (...args: unknown[]) => unknown
export interface Like {
  (tag: string): Type<string>
  (tag: number): Type<number>
  (tag: boolean): Type<boolean>
  (tag: bigint): Type<bigint>
  (tag: Func): Type<Func>
  (tag: symbol): Type<symbol>
  (): Type<undefined>
}
export const like = ((tag: unknown) =>
  type(raw => (typeof raw === typeof tag ? raw : fail()))) as Like
export const string = () => like('')
export const number = () => like(0)
export const boolean = () => like(true)
export const func = () => like(fail)
export const optional = () => like()
export const nullable = () => type(raw => (raw === null ? raw : fail()))

// Classes
export const instance = <T>(proto: new (...args: Array<any>) => T) =>
  type(raw => (raw instanceof proto ? (raw as T) : fail()))

// objects
export const record = <Item>(
  castValue: Cast<Item>
): Type<Record<string, Item>> =>
  instance(Object).map((raw: any) => {
    const res: Record<string, Item> = {}
    for (const key in raw) {
      const f = castValue(raw[key])
      f !== undefined && (res[key] = f)
    }
    return res
  })

export const object = <T = Record<string, never>>(schema: {
  [K in keyof T]-?: Cast<T[K]>
}) =>
  instance(Object).map((raw: any) => {
    const res = {} as T
    for (const key in schema) {
      const f = schema[key](raw[key])
      f !== undefined && (res[key] = f)
    }
    return res as WithOptionalProps<T>
  })
export const objectLoose = <
  T extends Record<string, unknown> = Record<string, never>
>(schema: {
  [K in keyof T]-?: Cast<T[K]>
}) =>
  instance(Object).map((raw: any) => {
    const res = {...raw}
    for (const key in schema) {
      const f = schema[key](raw[key])
      f !== undefined && (res[key] = f)
    }
    return res as WithOptionalProps<T>
  })

// arrays
export const array = <Item>(castItem: Cast<Item>) =>
  instance(Array).map(arr => arr.map(castItem))
export const tuple = <T extends readonly Cast<unknown>[]>(schema: T) =>
  instance(Array).map(arr => {
    return schema.map((cast, i) => cast(arr[i])) as {
      -readonly [K in keyof T]: Infer<T[K]>
    }
  })

export const set = <T>(castItem: Cast<T>) =>
  instance(Set).map(set => new Set<T>([...set].map(castItem)))
export const map = <K, V>(castKey: Cast<K>, castValue: Cast<V>) =>
  instance(Map).map(map => {
    return new Map<K, V>([...map].map(([k, v]) => [castKey(k), castValue(v)]))
  })

export const lazy = <T>(cast: () => Cast<T>) => type(raw => cast()(raw))
