type Struct = { free(): void }
type Arr<S> = Struct & { push: (item: S) => void }
type Ctor<S extends Struct, Args extends any[]> = new (...args: Args) => S
type ElementOf<A extends Arr<any>> = A extends Arr<infer S> ? S : never

export class WasmVec<A extends Arr<any>> {
  public readonly x: A

  public static of<A extends Arr<any>>(heap: Heap, ctor: Ctor<A, []>) {
    return new WasmVec(heap, ctor)
  }

  private constructor(heap: Heap, ctor: Ctor<A, []>) {
    this.x = heap.allocate(ctor)
  }

  public fill = (items: ElementOf<A>[]): this => {
    items.forEach((item) => this.x.push(item))
    return this
  }
}

export class Heap {
  private _refs: Struct[] = []

  public static create = () => new Heap()
  private constructor() {}

  public allocate = <S extends Struct, Args extends any[]>(ctor: Ctor<S, Args>, ...args: Args): S => {
    const ref = new ctor(...args)
    this._refs.push(ref)
    return ref
  }

  public free = () => {
    this._refs.forEach((ref) => ref.free())
    this._refs = []
  }
}
