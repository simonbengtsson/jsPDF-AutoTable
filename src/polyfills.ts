/* eslint-disable @typescript-eslint/no-unused-vars */

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
export function assign<T, U, V, W, X>(
  target: T,
  s: U,
  s1?: V,
  s2?: W,
  s3?: X
): T & U & V & W & X {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object')
  }
  const to = Object(target)
  for (let index = 1; index < arguments.length; index++) {
    // eslint-disable-next-line prefer-rest-params
    const nextSource = arguments[index]

    if (nextSource != null) {
      // Skip over if undefined or null
      for (const nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey]
        }
      }
    }
  }
  return to
}
