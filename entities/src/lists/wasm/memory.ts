type Freeable = { free(): void }
type Pushable<S> = Freeable & { push: (item: S) => void }
type Ctor<S extends Freeable, Args extends any[]> = new (...args: Args) => S

type ElementOf<A extends Pushable<any>> = A extends Pushable<infer S> ? S : never

export class WasmVec<A extends Pushable<any>> {
  public readonly x: A

  public static of<A extends Pushable<any>>(heap: Heap, ctor: Ctor<A, []>) {
    return new WasmVec(heap, ctor)
  }

  private constructor(private heap: Heap, ctor: Ctor<A, []>) {
    this.x = heap.allocate(ctor)
  }

  public fill = (items: ElementOf<A>[]): A => {
    items.forEach((item) => this.heap.revokeOwnership(item))
    items.forEach((item) => this.x.push(item))
    return this.x
  }
}

export class WasmStruct<S extends Freeable, X extends any[]> {
  public readonly x: S

  public static of<S extends Freeable, X extends any[]>(heap: Heap, ctor: Ctor<S, X>, ...x: X) {
    return new WasmStruct(heap, ctor, ...x)
  }

  private constructor(heap: Heap, ctor: Ctor<S, X>, ...x: X) {
    x.forEach((item) => heap.revokeOwnership(item))
    this.x = heap.allocate(ctor, ...x)
  }
}

export class Heap {
  private _refs: Freeable[] = []

  public static create = () => new Heap()
  private constructor() {}

  public allocate = <S extends Freeable, Args extends any[]>(ctor: Ctor<S, Args>, ...args: Args): S => {
    const ref = new ctor(...args)
    this._refs.push(ref)
    return ref
  }

  // once an object is being referred to by another object, it cannot be freed (the program will crash)
  // we purposefully remove the object from the list of references because it is not ours to free
  public revokeOwnership = (ref: Freeable): void => {
    const idx = this._refs.indexOf(ref)
    if (idx === -1) {
      return
    }
    this._refs.splice(idx, 1)
  }

  public free = () => {
    for (const ref of this._refs) {
      ref.free()
    }
    this._refs = []
  }
}
