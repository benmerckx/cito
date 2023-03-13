import {type} from '../src/Type.js'

type X = typeof X.type
const X = type.object({
  a: type.string,
  b: type.number,
  array: type.array(type.string)
})
const test = {a: 'sdf'}
X.assert(test)
