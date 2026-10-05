export interface AddArgs {
  arg1: number
  arg2: number
}

export interface AddResult {
  sum: number
}

export function add(args: AddArgs): AddResult {
  return {
    sum: args.arg1 + args.arg2
  }
}
