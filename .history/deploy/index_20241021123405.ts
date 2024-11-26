/*
 * @Author: 安琦航 anqihang0106@outlook.com
 * @Date: 2024-10-20 23:43:36
 */
import archiver from "archiver";
import { NodeSSH } from "node-ssh";
import { createInterface } from "readline";
import fs from "fs";
// 环境变量
import process from "process";
// 压缩文件
const archive = archiver("zip", {
  zlib: { level: 9 },
});
// ssh传输
const ssh = new NodeSSH();
// 终端输入
const readInput = createInterface({
  input: process.stdin,
  output: process.stdout,
});
class Deploy {
  // 本地路径
  localPath: string = "";
  // 远程路径
  remotePath: string = "";
  // 服务器地址
  host: string = "";
  // 端口
  port: number = 0;
  // 服务器上最多保存几个版本的压缩包
  fileNum: number = 0;
  // 用户名
  username: string = "";
  password: string = "";
  // 电脑密钥
  privateKey: string = "";
  constructor(
    localPath: string,
    remotePath: string,
    host: string,
    port: number = 22,
    fileNum: number = 3,
    username: string = "root",
    password?: string,
    privateKey?: string
  ) {
    this.localPath = localPath;
    this.remotePath = remotePath;
    this.host = host;
    this.port = port;
    this.fileNum = fileNum;
    this.username = username;
    password && (this.password = password);
    privateKey && (this.privateKey = privateKey);
  }

  /**
   * @description 压缩dist文件夹成.zip并上传到服务器,在服务器更新历史.zip文件并解压最新的.zip文件为dist文件夹
   */
  deploy() {
    const output = fs.createWriteStream("/dist.zip");
    output.on("close", function () {
      console.log(archive.pointer() + " total bytes");
      console.log("archiver has been finalized and the output file descriptor has closed.");
    });
    archive.pipe(output);
    // 压缩包里文件在压缩包根目录下
    archive.directory("/dist", false);
    archive.finalize();
    // ssh连接
    ssh
      .connect({
        host: this.host,
        port: this.port,
        username: this.username,
        password: this.password || void 0,
        privateKey: this.privateKey || void 0,
      })
      .then(async () => {
        console.log("Connected");
        // 查询文件/文件夹时间信息
        const filesStr = (
          await ssh.execCommand(`ls -l --time-style=long-iso | awk '{print $6, $7, $8}'`, {
            cwd: this.remotePath,
          })
        ).stdout;
        console.log(filesStr);
        // 2024-01-01 12:12:12 fileName
        const fileList = filesStr
          .split("\n")
          // 排除非.zip文件
          .filter((file: string) => file.indexOf("zip") >= 0)
          .map((file: string) => {
            return { name: file.split(" ")[2], time: file.split(" ")[0] + " " + file.split(" ")[1] };
          });
        console.log(fileList.map((file: { name: string; time: string }) => file.name).join("\n"));
        // 将发布的版本号
        const version = await new Promise((resolve) => {
          readInput.question("新版本号：", async (answer) => {
            // 删除旧版本
            resolve(answer);
          });
        });
        const yn: string = await new Promise((resolve) => {
          readInput.question("确定发布版本么?（y/n)", (answer) => {
            resolve(answer);
          });
        });
        if (["yes", "y"].includes(yn.toLowerCase())) {
        } else if (["no", "n"].includes(yn.toLowerCase())) {
          return;
        } else {
          return;
        }
        // 上传压缩包
        console.log("开始上传压缩包...");
        ssh.putFile(`${this.localPath}/dist.zip`, `${this.remotePath}/dist_${version}.zip`).then(async () => {
          console.log("历史版本更新.");
          // 删除旧版本压缩包
          while (fileList.length >= this.fileNum) {
            console.log("历史版本更新..");
            await ssh.execCommand(`rm ${fileList[0]?.name} -f`, {
              cwd: this.remotePath,
            });
            fileList.shift();
            console.log("历史版本更新...");
          }
          console.log("更新版本...");
          // 删除dist文件夹
          ssh.execCommand(`rm dist -rf`, { cwd: this.remotePath }).then(() => {
            // 解压最新版
            ssh.execCommand(`unzip -o dist_${version}.zip -d dist`, { cwd: this.remotePath }).then(() => {
              console.log("版本更新完成！");
              // 断开连接
              ssh.dispose();
            });
          });
        });
      })
      .catch((err) => {
        console.log("更新失败！");
        console.log(err);
      });
  }
}
