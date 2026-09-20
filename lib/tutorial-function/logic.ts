export interface AddArgs {
  arg1: number
  arg2: number
}

export function add(args: AddArgs): number {
  return args.arg1 + args.arg2
}
