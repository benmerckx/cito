const {setPrototypeOf} = Object

export interface Validator<T> {
  (value: any): value is T
}

export interface Cito<T> extends Validator<T> {}

export class Cito<T = unknown> {
  declare type: T

  constructor(validator: Validator<T>) {
    return setPrototypeOf(validator, new.target.prototype)
  }

  new(input: T): T {
    if (!this(input)) throw new TypeError()
    return input
  }

  assert(input: unknown): asserts input is T {
    if (!this(input)) throw new TypeError()
  }

  and<E = T>(validator: Validator<E>): Cito<E> {
    return new Cito((value): value is E => this(value) && validator(value))
  }

  or<E = T>(validator: Validator<E>): Cito<E> {
    return new Cito((value): value is E => this(value) || validator(value))
  }

  get nullable(): Cito<T | null> {
    return nullable(this)
  }

  get optional(): Cito<T | undefined> {
    return optional(this)
  }
}

export function literal<
  T extends null | undefined | string | number | boolean | symbol
>(value: T) {
  return new Cito<T>((v): v is T => v === value)
}

export const nullable = <T>(inner: Cito<T>) => inner.or<T | null>(literal(null))
export const optional = <T>(inner: Cito<T>) =>
  inner.or<T | undefined>(literal(undefined))

function primitive<T>(primitive: string) {
  return new Cito((value): value is T => typeof value === primitive)
}

export function instance<T>(constructor: new (...args: any[]) => T) {
  return new Cito((value): value is T => value instanceof constructor)
}

export const string = primitive<string>('string')
export const number = primitive<number>('number')
export const bigint = primitive<bigint>('bigint')
export const boolean = primitive<boolean>('boolean')
export const symbol = primitive<symbol>('symbol')
export const date = instance<Date>(Date).and(
  (v): v is Date => !isNaN(v.getTime())
)

export function record<T>(inner: Cito<T>) {
  return new Cito((value): value is Record<string, T> => {
    for (const item of value) if (!inner(item)) return false
    return true
  })
}

export function object<T extends Record<string, Cito<any>>>(definition: T) {
  return new Cito(
    (
      value
    ): value is {
      [K in keyof T]: T[K] extends Cito<infer U> ? U : never
    } => {
      for (const key in definition) {
        if (!definition[key](value[key])) return false
      }
      return true
    }
  )
}

export function union<T extends Cito<any>[]>(...types: T) {
  return new Cito(
    (
      value
    ): value is {
      [K in keyof T]: T[K] extends Cito<infer U> ? U : never
    }[number] => {
      for (const type of types) if (type(value)) return true
      return false
    }
  )
}

export function array<T>(inner: Cito<T>) {
  return new Cito((value): value is Array<T> => {
    for (const item of value) if (!inner(item)) return false
    return true
  })
}

export function enums<T extends Record<string, any>>(types: T) {
  return new Cito((value): value is keyof T => (value as any) in types)
}
