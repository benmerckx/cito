let {setPrototypeOf, entries, assign, keys} = Object

// Context: keep a path and the current value around to produce
// proper error messages
let value: any = undefined
let path: Array<string> = []
let expected = ''
let init = () => {
  value = undefined
  path = []
  expected = ''
}
let at = (name: string) => path.push(path.length > 0 ? `.${name}` : name)
let index = (index: number) => path.push(`[${index}]`)
let back = () => path.pop()
let expect = (e: any, v: any) => {
  value = v
  expected = e
}
let err = () => {
  let at = path.length ? `@ ${path.join('')} ` : ''
  return `Expected ${expected} ${at}(got: ${JSON.stringify(value)})`
}

export interface Validator<T> {
  (value: any): value is T
}

export interface Type<T> extends Validator<T> {}

export class Type<T> {
  declare infer: T & {}
  declare validate: Validator<T>

  narrow = <E extends T>(): Type<E> => this as any

  new(input: T): T {
    this.assert(input)
    return input
  }

  assert(input: unknown): asserts input is T {
    if (!this(input)) throw new TypeError(err())
  }

  and<E = T>(validate: Validator<E>): Type<E> {
    return type((value): value is E => this(value) && validate(value))
  }

  or<E = T>(validate: Validator<E>): Type<E> {
    return type((value): value is E => this(value) || validate(value))
  }

  get nullable(): Type<T | null> {
    return nullable(this)
  }

  get optional(): Type<T | undefined> {
    return optional(this)
  }
}

export function type<T>(validate: Validator<T>): Type<T> {
  return assign(
    setPrototypeOf((value: any) => (init(), validate(value)), Type.prototype),
    {validate}
  )
}

export let literal = <
  T extends null | undefined | string | number | boolean | symbol
>(
  value: T
) => type<T>((v): v is T => (expect(value, v), v === value))

export let nullable = <T>(inner: Type<T>) => inner.or<T | null>(literal(null))
export let optional = <T>(inner: Type<T>) =>
  inner.or<T | undefined>(literal(undefined))

let primitive = <T>(primitive: string) =>
  type(
    (value): value is T => (
      expect(primitive, value), typeof value === primitive
    )
  )

export let instance = <T>(constructor: new (...args: any[]) => T) =>
  type(
    (value): value is T => (
      expect(constructor.name, value), value instanceof constructor
    )
  )

export let string = primitive<string>('string')
export let number = primitive<number>('number')
export let bigint = primitive<bigint>('bigint')
export let boolean = primitive<boolean>('boolean')
export let symbol = primitive<symbol>('symbol')
export let date = instance<Date>(Date).and(
  (v): v is Date => !isNaN(v.getTime())
)
export let any = type((value): value is any => true)
export let func = instance<Function>(Function)
let obj = instance<Object>(Object)

export let tuple = <T extends Array<Type<any>>>(...types: T) =>
  instance(Array).and(
    (
      value
    ): value is {
      [K in keyof T]: T[K] extends Type<infer U> ? U : never
    } => {
      if (value.length !== types.length) return false
      for (let [i, type] of types.entries()) {
        index(i)
        if (!type.validate(value[i])) return false
        back()
      }
      return true
    }
  )

export let record = <T>(inner: Type<T>) =>
  obj.and((value): value is Record<string, T> => {
    for (let [key, item] of entries(value)) {
      at(key)
      if (!inner.validate(item)) return false
      back()
    }
    return true
  })

export type obj<T> = {
  [K in keyof T as T[K] extends Type<any> ? K : never]: T[K] extends Type<
    infer U
  >
    ? U
    : never
}
export let object = <T extends object>(
  definition: T | (new (...args: Array<any>) => T)
) =>
  obj.and((value): value is obj<T> => {
    let inst: any = func(definition) ? new definition() : definition
    for (let key in inst) {
      at(key)
      if (!(inst[key] as Type<any>).validate(value[key])) return false
      back()
    }
    return true
  })

export type union<T extends Array<any>> = {
  [K in keyof T]: T[K] extends Type<infer U>
    ? U
    : T[K] extends new (...args: Array<any>) => infer U
    ? obj<U>
    : never
}[number]
export let union = <T extends Array<any>>(...types: T) => {
  let definitions = types.map(type =>
    type instanceof Type ? type : object(type)
  )
  return type((value): value is union<T> => {
    let current = path
    for (let type of definitions) {
      path = current
      if (type.validate(value)) return true
    }
    return false
  })
}

export let array = <T>(inner: Type<T>) =>
  instance(Array).and((value): value is Array<T> => {
    for (let [i, item] of value.entries()) {
      index(i)
      if (!inner.validate(item)) return false
      back()
    }
    return true
  })

export let enums = <T extends Record<string, any>>(types: T) =>
  type(
    (value): value is keyof T => (
      expect(keys(types).join(' | '), value), (value as any) in types
    )
  )

export let lazy = <T>(
  fn: () => Type<T>,
  inst: Validator<T> | undefined = undefined
) =>
  type((value): value is T =>
    inst ? inst(value) : (inst = fn().validate)(value)
  )

export function assert<T>(value: unknown, type: Type<T>): asserts value is T {
  type.assert(value)
}

export function is<T>(value: unknown, type: Type<T>): value is T {
  return type(value)
}
