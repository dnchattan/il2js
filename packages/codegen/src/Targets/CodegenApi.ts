export interface CodegenApi {
  writeFile(path: string, data: string | Buffer): Promise<void>;
}
