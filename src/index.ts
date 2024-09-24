let {assign, entries, keys, values, setPrototypeOf} = Object
let {stringify} = JSON

class Context {
  value: any = undefined
  path: Array<string> = []
  expected = ''
  at(name: string) {
    this.path.push(this.path.length > 0 ? `.${name}` : name)
  }
  index(index: number) {
    this.path.push(`[${index}]`)
  }
  back() {
    this.path.pop()
  }
  expect(e: any, v: any) {
    this.expected = e
    this.value = v
  }
  err(errorMessage?: string) {
    let at = this.path.length ? `@ ${this.path.join('')} ` : ''
    let value = this.value
    let type = typeof value
    let got =
      type === 'undefined'
        ? type
        : type === 'object'
        ? value === null
          ? 'null'
          : `${type}: ${value.constructor.name}`
        : type === 'function'
        ? `function: ${value.name}`
        : `${type}: ${value}`
    let prefix = errorMessage ? `${errorMessage} — expected` : 'Expected'
    return `${prefix} ${this.expected} ${at}(got ${got})`
  }
}

let arg = 'v'
let ctx = new Context()

export interface Validator<T> {
  (value: any, ctx: Context): value is T
}

export namespace Type {
  type obj<T> = {
    [K in keyof T]: T[K] extends Type<infer U> | undefined ? U : never
  } & {}
  type union<T extends Array<any>> = {
    [K in keyof T]: T[K] extends Type<infer U>
      ? U
      : T[K] extends new (...args: Array<any>) => infer U
      ? obj<U>
      : never
  }[number]
  export type Object<T> = obj<T>
  export type Union<T extends Array<any>> = union<T>
}

interface Gen {
  (path: string): string
}

export interface Type<T> {
  (value: any, errorMessage?: string): T
}

export let compile = <T>(type: Type<T>) => ({
  check: new Function(arg, `return ${type.gen(arg)}`) as (
    value: any
  ) => value is T
})

export class Type<T> {
  declare infer: T
  declare validate: Validator<T>
  declare gen: Gen

  narrow<E extends T>(): Type<E> {
    return this as any
  }

  new(value: T): T {
    return value as T
  }

  check(input: unknown): input is T {
    ctx = new Context()
    return this.validate(input, ctx)
  }

  assert(input: unknown, errorMessage?: string): asserts input is T {
    if (!this.check(input)) throw new TypeError(ctx.err(errorMessage))
  }

  and<E>(that: Type<E>): Type<T & E> {
    return type(
      (value): value is T & E =>
        this.validate(value, ctx) && that.validate(value, ctx),
      path => `${this.gen(path)} && ${that.gen(path)}`
    )
  }

  or<E>(that: Type<E>): Type<T | E> {
    return type(
      (value): value is T | E =>
        this.validate(value, ctx) || that.validate(value, ctx),
      path => `(${this.gen(path)} || ${that.gen(path)})`
    )
  }

  get nullable(): Type<T | null> {
    return nullable(this)
  }

  get optional(): Type<T | undefined> {
    return optional(this)
  }
}

let noGen = () => {
  throw new Error(`This type cannot be generated`)
}
export let type = <T>(validate: Validator<T>, gen: Gen = noGen): Type<T> => {
  const inst: Type<T> = assign(
    setPrototypeOf((value: any, errorMessage?: string): T => {
      inst.assert(value, errorMessage)
      return value
    }, Type.prototype),
    {validate, gen}
  )
  return inst
}
export type Infer<T> = T extends Type<infer U>
  ? U
  : T extends {new (): infer U}
  ? Infer<U>
  : {[K in keyof T]: Infer<T[K]>}
export let literal = <
  T extends null | undefined | string | number | boolean | symbol
>(
  literal: T
) =>
  type<T>(
    (value): value is T => (
      ctx.expect(stringify(literal), value), literal === value
    ),
    path => `${path} === ${stringify(literal)}`
  )

export let nullable = <T>(inner: Type<T>) => literal(null).or(inner)
export let optional = <T>(inner: Type<T>) => literal(undefined).or(inner)

let primitive = <T>(primitive: string) =>
  type(
    (value): value is T => (
      ctx.expect(primitive, value), typeof value === primitive
    ),
    path => `typeof ${path} === '${primitive}'`
  )

export let instance = <T>(constructor: new (...args: any[]) => T) =>
  type(
    (value, ctx): value is T => (
      ctx.expect(constructor.name, value), value instanceof constructor
    ),
    path => `${path} instanceof ${constructor.name}`
  )

export let string = primitive<string>('string')
export let number = primitive<number>('number').and(
  type(
    (value): value is number => !isNaN(value),
    path => `!isNaN(${path})`
  )
)
export let bigint = primitive<bigint>('bigint')
export let boolean = primitive<boolean>('boolean')
export let symbol = primitive<symbol>('symbol')
export let any = type(
  (value): value is any => true,
  () => `!0`
)
export let date = instance(Date).and(
  type(
    (value): value is Date => !isNaN(value.getTime()),
    path => `!isNaN(${path}.getTime())`
  )
)

let isFunction = (f: any) => typeof f === 'function'
let isObject = type(
  (value): value is object => (
    ctx.expect('object', value), typeof value === 'object' && value != null
  ),
  path => `typeof ${path} === 'object' && ${path} !== null`
)
let isArray = type(
  (value): value is unknown[] => (
    ctx.expect('array', value), Array.isArray(value)
  ),
  path => `Array.isArray(${path})`
)

export type TupleOf<T> = {
  [K in keyof T]: T[K] extends Type<infer U> ? U : never
}

export let tuple = <T extends Array<Type<any>>>(
  ...types: T
): Type<TupleOf<T>> =>
  isArray.and(
    type(
      (value): value is TupleOf<T> => {
        if (value.length !== types.length) return false
        for (let i = 0; i < types.length; i++) {
          ctx.index(i)
          if (!types[i].validate(value[i], ctx)) return false
          ctx.back()
        }
        return true
      },
      path =>
        `${path}.length === ${types.length} && ${types
          .map((type, i) => type.gen(`${path}[${i}]`))
          .join(' && ')}`
    )
  )

export let record = <T>(inner: Type<T>): Type<Record<string, T>> =>
  isObject.and(
    type(
      (value): value is Record<string, T> => {
        for (let [key, item] of entries(value)) {
          ctx.at(key)
          if (!inner.validate(item, ctx)) return false
          ctx.back()
        }
        return true
      },
      path => `Object.values(${path}).every(${arg} => ${inner.gen(arg)})`
    )
  )
export let object = <T extends object>(
  definition: T | (new (...args: Array<any>) => T)
): Type<Type.Object<T>> => {
  let inst: any = definition
  return isObject.and(
    type(
      (value): value is Type.Object<T> => {
        if (isFunction(inst)) inst = new inst()
        for (let key in inst) {
          ctx.at(key)
          if (!(inst[key] as Type<any>).validate(value[key], ctx)) return false
          ctx.back()
        }
        return true
      },
      path => {
        if (isFunction(inst)) inst = new inst()
        const types = keys(inst).map(key => [key, inst[key]])
        return types
          .map(([key, inner]) => inner.gen(`${path}.${key}`))
          .join(' && ')
      }
    )
  )
}

export let union = <T extends Array<any>>(...types: T) => {
  let definitions = types.map(type =>
    type instanceof Type ? type : object(type)
  )
  return type(
    (value): value is Type.Union<T> => {
      let current = ctx.path.length
      let relevancy = 0
      let expectation: [Array<string>, string, string] | undefined = undefined
      for (let type of definitions) {
        ctx.path.splice(current, Infinity)
        if (type.validate(value, ctx)) return true
        if (ctx.path.length >= relevancy) {
          relevancy = ctx.path.length
          expectation = [ctx.path.slice(), ctx.expected, ctx.value]
        }
      }
      if (expectation) {
        ctx.path = expectation[0]
        ctx.expected = expectation[1]
        ctx.value = expectation[2]
      }
      return false
    },
    path => `(${definitions.map(type => `${type.gen(path)}`).join(' || ')})`
  )
}

export let array = <T>(inner: Type<T>): Type<Array<T>> =>
  isArray.and(
    type(
      (value: Array<any>, ctx): value is Array<T> => {
        for (let i = 0; i < value.length; i++) {
          ctx.index(i)
          if (!inner.validate(value[i], ctx)) return false
          ctx.back()
        }
        return true
      },
      path => `${path}.every(${arg} => ${inner.gen(arg)})`
    )
  )

export let enums = <T>(types: Record<string, T>) => {
  const options = values(types)
  const desc = options.join(' | ')
  return type(
    (value): value is T => (
      ctx.expect(desc, value), options.includes(value as any)
    ),
    path => `${stringify(options)}.includes(${path})`
  )
}

export let lazy = <T>(fn: () => Type<T>) => {
  let inst: Validator<T> | undefined = undefined
  return type(
    (value): value is T =>
      inst ? inst(value, ctx) : (inst = fn().validate)(value, ctx),
    path => fn().gen(path)
  )
}

export function assert<T>(value: unknown, type: Type<T>): asserts value is T {
  type.assert(value)
}

export function is<T>(value: unknown, type: Type<T>): value is T {
  return type.check(value)
}
