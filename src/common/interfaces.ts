// TODO: add doc
export type Resolve<T> = (value?: T | PromiseLike<T> | undefined) => void

// TODO: add doc
export type Reject = (reason?: any) => void

// TODO: add doc
export type Maybe<T> = T | void

// TODO: add doc
export type ValueOf<T> = T[keyof T]

// TODO: add doc
export type StringObject = { [index: string]: string }
