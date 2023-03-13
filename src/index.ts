const {setPrototypeOf, entries, assign} = Object

class Context {
  public p = ''
  public e = ''
  constructor(public v = undefined) {}
  at(name: string) {
    this.p += this.p ? `.${name}` : name
    return this
  }
  index(index: number) {
    this.p += `[${index}]`
    return this
  }
  expect(e: any, v: any) {
    this.v = v
    this.e = e
    return this
  }
  err() {
    return `Expected ${this.e} @ ${this.p} (got: ${this.v})`
  }
}

export interface Validator<T> {
  (value: any, ctx: Context): value is T
}

export interface Cito<T> {
  (value: any): value is T
}

export class Cito<T = unknown> {
  declare infer: T & {}
  declare validate: Validator<T>

  constructor(validate: Validator<T>) {
    return assign(
      setPrototypeOf(
        (value: any, ctx = new Context(value)) => validate(value, ctx),
        new.target.prototype
      ),
      {validate}
    )
  }

  make<C extends (...args: Array<any>) => T>(create: C): this {
    return this
  }

  narrow<E extends T>(): Cito<E> {
    return this as any
  }

  new(input: T): T {
    return input
  }

  assert(input: unknown): asserts input is T {
    const ctx = new Context()
    if (!this.validate(input, ctx)) throw new TypeError(ctx.err())
  }

  and<E = T>(validate: Validator<E>): Cito<E> {
    return new Cito(
      (value, ctx): value is E =>
        this.validate(value, ctx) && validate(value, ctx)
    )
  }

  or<E = T>(validate: Validator<E>): Cito<E> {
    return new Cito(
      (value, ctx): value is E =>
        this.validate(value, ctx) || validate(value, ctx)
    )
  }

  get nullable(): Cito<T | null> {
    return nullable(this)
  }

  get optional(): Cito<T | undefined> {
    return optional(this)
  }
}

export const literal = <
  T extends null | undefined | string | number | boolean | symbol
>(
  value: T
) => new Cito<T>((v): v is T => v === value)

export const nullable = <T>(inner: Cito<T>) => inner.or<T | null>(literal(null))
export const optional = <T>(inner: Cito<T>) =>
  inner.or<T | undefined>(literal(undefined))

const primitive = <T>(primitive: string) =>
  new Cito(
    (value, ctx): value is T => (
      ctx.expect(primitive, value), typeof value === primitive
    )
  )

export const instance = <T>(constructor: new (...args: any[]) => T) =>
  new Cito(
    (value, ctx): value is T => (
      ctx.expect(constructor, value), value instanceof constructor
    )
  )

export const string = primitive<string>('string')
export const number = primitive<number>('number')
export const bigint = primitive<bigint>('bigint')
export const boolean = primitive<boolean>('boolean')
export const symbol = primitive<symbol>('symbol')
export const date = instance<Date>(Date).and(
  (v): v is Date => !isNaN(v.getTime())
)
export const any = new Cito((value): value is any => true)

export const record = <T>(inner: Cito<T>) =>
  instance(Object).and((value, ctx): value is Record<string, T> => {
    for (const [key, item] of entries(value))
      if (!inner.validate(item, ctx.at(key))) return false
    return true
  })

type Object<T> = {
  [K in keyof T as T[K] extends Cito<any> ? K : never]: T[K] extends Cito<
    infer U
  >
    ? U
    : never
}
export const object = <T extends object>(
  definition: T | (new (...args: Array<any>) => T)
) =>
  instance(Object).and((value, ctx): value is Object<T> => {
    const inst: any =
      typeof definition === 'function' ? new definition() : definition
    for (const key in inst) {
      if (!inst[key].validate(value[key], ctx.at(key))) return false
    }
    return true
  })

type Union<T extends Array<any>> = {
  [K in keyof T]: T[K] extends Cito<infer U>
    ? U
    : T[K] extends new (...args: Array<any>) => infer U
    ? Object<U>
    : never
}[number]
export const union = <T extends Array<any>>(...types: T) =>
  new Cito((value, ctx): value is Union<T> => {
    for (const [key, type] of entries(types))
      if (type.validate(value, ctx.at(key))) return true
    ctx.expect(types, value)
    return false
  })

export const array = <T>(inner: Cito<T>) =>
  new Cito((value, ctx): value is Array<T> => {
    ctx.expect(Array, value)
    if (!Array.isArray(value)) return false
    for (const [i, item] of value.entries())
      if (!inner.validate(item, ctx.index(i))) return false
    return true
  })

export const enums = <T extends Record<string, any>>(types: T) =>
  new Cito(
    (value, ctx): value is keyof T => (
      ctx.expect(types, value), (value as any) in types
    )
  )

export const lazy = <T>(
  fn: () => Cito<T>,
  inst: Validator<T> | undefined = undefined
) =>
  new Cito((value, ctx): value is T =>
    inst ? inst(value, ctx) : (inst = fn().validate)(value, ctx)
  )

export function assert<T>(value: unknown, type: Cito<T>): asserts value is T {
  type.assert(value)
}
