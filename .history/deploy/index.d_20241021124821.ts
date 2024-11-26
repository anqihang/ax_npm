declare module "Deploy" {
  function deploy(
    localPath: string,
    remotePath: string,
    host: string,
    port: number,
    fileNum: number,
    username: string,
    password?: string,
    privateKey?: string
  ): void;
}
