<!--
 * @Author: 安琦航 anqihang0106@outlook.com
 * @Date: 2024-10-20 23:40:27
-->
# ax_npm

npm tool package

## npm tool

- `deploy` deploy .zip to remote and unpack

```ts
import Deploy from "@anqihang/deploy";
const deploy = new Deploy(
    localPath: string,
    remotePath: string,
    host: string,
    password?: string,
    privateKeyPath?: string,
    fileNum: number = 3,
    port: number = 22,
    username: string = "root"
);

deploy.deploy();
```
