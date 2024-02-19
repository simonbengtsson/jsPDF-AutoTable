import { UserOptions } from './config'

export function validateOptions(options: UserOptions) {
  if (options && typeof options !== 'object') {
    console.error(
      'The options parameter should be of type object, is: ' + typeof options,
    )
  }
  if (options.startY && typeof options.startY !== 'number') {
    console.error('Invalid value for startY option', options.startY)
    delete options.startY
  }
}
