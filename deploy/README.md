# install

```cmd
npm install @anqihang/deploy
```

```js
import Deploy fro "@anqihang/deploy";
const deploy = new Deploy({
    localPath: string; // 本地路径C:\\Web\\project_name
    remotePath: string;// 服务器路径 /home/Web/project_name
    host: string;// 服务器IP地址 
    password?: string; // 服务器密码
    privateKeyPath?: string;
    fileNum?: number; // 服务器存在的dist.zip版本数量 3
    port?: number; // 服务器SSH端口 22
    username?: string;// 服务器用户名 root
    fileName?: string; // 服务器dist.zip文件名 dist.zip
});
deploy.run();
```

简单封装的前端dist文件快速部署到服务器，使用archiver来压缩dist文件，使用node-ssh来上传文件并在服务器解压
