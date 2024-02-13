/**
 * Allows to deeply inspect a type while debugging
 */
export type Resolve<T> = T extends (...args: infer A) => infer R
  ? (...args: Resolve<A>) => Resolve<R>
  : T extends [infer A]
    ? [Resolve<A>]
    : T extends [infer A, ...infer B]
      ? [Resolve<A>, ...Resolve<B>]
      : T extends Promise<infer R>
        ? Promise<Resolve<R>>
        : T extends object
          ? T extends infer O
            ? { [K in keyof O]: Resolve<O[K]> }
            : never
          : T

export type Cast<T, U> = T extends U ? T : U

type _Tuple<T, N extends number, R extends any[]> = R['length'] extends N ? R : _Tuple<T, N, [T, ...R]>
export type Tuple<T, N extends number> = number extends N ? T[] : _Tuple<T, N, []>

export type Expect<T extends true> = T extends true ? true : 'Expectation failed'

export type Extends<T, U> = T extends U ? true : false

export type Equals<T, U> = Extends<T, U> extends true ? Extends<U, T> : false
