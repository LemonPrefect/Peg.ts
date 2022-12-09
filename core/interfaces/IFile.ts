export interface IFile{
  key: string,
  hash: string,
  size: number,
  mime: string,
  time: string,
  /** local FULL path of the file. use ONLY upload/hash. */
  local: string | undefined
}
