<!--
 * @Author: 安琦航 anqihang0106@outlook.com
 * @Date: 2025-04-02 23:11:16
-->
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
deploy.deploy(); // 发布到服务器并部署
deploy.reset(); // 回退版本
deploy.ls(); // 查看历史版本

deploy.run();// 根据 --deploy --reset --ls 来执行对应方法
```

## description

简单封装的前端 dist 文件快速部署到服务器，使用 archiver 来压缩 dist 文件，使用 node-ssh 来上传文件并在服务器解压,version.md记录发布的版本
