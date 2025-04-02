/*
 * @Author: 安琦航 anqihang0106@outlook.com
 * @Date: 2024-11-27 00:10:12
 */
declare module "Deploy" {
  function run(options: {
    localPath: string;
    remotePath: string;
    host: string;
    password?: string;
    privateKey?: string;
    fileNum?: number;
    port?: number;
    username?: string;
    fileName?: string;
  }): void;
}
type FileInfo = {
  name: string;
  time: string;
  deployed: boolean;
};
