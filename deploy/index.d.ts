declare module "Deploy" {
  function deploy(
    localPath: string,
    remotePath: string,
    host: string,
    password?: string,
    privateKey?: string,
    fileNum?: number,
    port?: number,
    username?: string
  ): void;
}
