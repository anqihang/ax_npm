# install

```cmd
npm install
```

```js
import Deploy fro "@anqihang/deploy";
const deploy = new Deploy({
    localPath: string;
    remotePath: string;
    host: string;
    password?: string;
    privateKeyPath?: string;
    fileNum?: number;
    port?: number;
    username?: string;
});
deploy.run();
```
