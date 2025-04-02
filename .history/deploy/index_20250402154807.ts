/*
 * @Author: 安琦航 anqihang0106@outlook.com
 * @Date: 2024-10-20 23:43:36
 */
import archiver from "archiver";
import fs from "fs";
import { NodeSSH } from "node-ssh";
import { createInterface } from "readline";
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
export default class Deploy {
  // 本地路径
  localPath: string = "";
  // 远程路径
  remotePath: string = "";
  // 服务器地址
  host: string = "";
  // 服务器上最多保存几个版本的压缩包
  fileNum: number = 0;
  // 端口
  port: number = 0;
  password: string = "";
  // 电脑密钥
  privateKeyPath: string = "";
  // 用户名
  username: string = "";
  // 传输文件名称
  fileName: string = "";
  constructor(options: {
    localPath: string;
    remotePath: string;
    host: string;
    password?: string;
    privateKeyPath?: string;
    fileNum?: number;
    port?: number;
    username?: string;
    fileName?: string;
  }) {
    this.localPath = options.localPath;
    this.remotePath = options.remotePath;
    this.host = options.host;
    this.password = options.password || "";
    this.privateKeyPath = options.privateKeyPath || "";
    this.fileNum = options.fileNum || 3;
    this.port = options.port || 22;
    this.username = options.username || "root";
    this.fileName = options.fileName || "dist";
  }
  run() {
    switch (process.argv[2]) {
      case "--deploy":
        this.deploy();
        break;
      case "--reset":
        this.reset();
        break;
      case "--ls":
        {
          this.ls().then((res) => {
            // 断开连接
            ssh.dispose();
            process.exit(0);
          });
        }
        break;
    }
  }
  /**
   * @description 查看历史版本
   */
  ls() {
    return new Promise<FileInfo[]>((resolve, reject) => {
      ssh
        .connect({
          host: this.host,
          port: this.port,
          username: this.username,
          password: this.password || void 0,
          privateKey: this.privateKeyPath ? fs.readFileSync(this.privateKeyPath) : void 0,
        })
        .then(async () => {
          console.log("SSH Connected");
          // 查询文件/文件夹时间信息
          const filesStr = (
            await ssh.execCommand(`ls -l --time-style=long-iso | awk '{print $6, $7, $8}'`, {
              cwd: this.remotePath,
            })
          ).stdout;
          // 2024-01-01 12:12:12 fileName
          const fileList: FileInfo[] = filesStr
            .split("\n")
            // 排除非.zip文件
            .filter((file: string) => file.indexOf("zip") >= 0)
            .map((file: string) => {
              return {
                name: file.split(" ")[2],
                time: file.split(" ")[0] + " " + file.split(" ")[1],
              };
            });
          console.log("历史版本如下：");
          console.log(fileList.map((file: FileInfo) => `${file.time} ${file.name}`).join("\n"));

          resolve(fileList);
        })
        .catch((err) => {
          console.log("连接失败！");
          console.log(err);
        });
    });
  }
  /**
   * @description 压缩dist文件夹成dist.zip并上传到服务器,在服务器更新历史.zip文件并解压最新的.zip文件为dist文件夹
   */
  deploy() {
    // 写入流
    const output = fs.createWriteStream(`${this.localPath}\\${this.fileName}.zip`);
    // 监听压缩进度
    output.on("close", function () {
      console.log(archive.pointer() + " total bytes");
      console.log("archiver has been finalized and the output file descriptor has closed.");
    });
    archive.pipe(output);
    // 压缩包里文件在压缩包根目录下
    archive.directory(`${this.localPath}\\${this.fileName}`, false);
    archive.finalize();
    console.log("压缩完成。");

    this.ls().then(async (fileList: FileInfo[]) => {
      // 将发布的版本号
      const version = await new Promise<string>((resolve) => {
        readInput.question("新版本号：", async (answer) => {
          resolve(answer);
        });
      });
      if (fileList.find((file) => file.name.indexOf(version) >= 0)) {
        console.log("版本号重复！");
      }
      while (true) {
        const yn: string = await new Promise<string>((resolve) => {
          readInput.question("确定上传并发布新版本么?（y/n): ", (answer) => {
            resolve(answer);
          });
        });
        if (["yes", "y"].includes(yn.toLowerCase())) {
          break;
        } else if (["no", "n"].includes(yn.toLowerCase())) {
          ssh.dispose();
          process.exit(0);
        } else {
        }
      }
      // 上传压缩包
      console.log("开始上传压缩包...");
      ssh.putFile(`${this.localPath}\\${this.fileName}.zip`, `${this.remotePath}/${this.fileName}_${version}.zip`).then(async () => {
        console.log("历史版本更新中...");
        // 删除旧版本压缩包
        while (fileList.length >= this.fileNum) {
          await ssh.execCommand(`rm ${fileList[0]?.name.replace} -f`, {
            cwd: this.remotePath,
          });
          fileList.shift();
        }
        console.log("更新版本...");
        // 删除dist文件夹
        await ssh.execCommand(`rm ${this.fileName} -rf`, { cwd: this.remotePath });
        // 解压最新版
        await ssh.execCommand(`unzip -o ${this.fileName}_${version}.zip -d ${this.fileName}`, { cwd: this.remotePath });
        // 存储部署的版本号
        await ssh.execCommand(`echo "${version}" > version.md`, { cwd: this.remotePath });
        console.log("版本更新完成！");
        // 断开连接
        ssh.dispose();
        process.exit(0);
      });
    });
  }
  /**
   * @description 部署指定历史版本
   */
  reset() {
    this.ls().then(async (fileList: FileInfo[]) => {
      let version = "";
      while (true) {
        version = await new Promise<string>((resolve) => {
          readInput.question("回退的版本号：", async (answer) => {
            resolve(answer);
          });
        });
        const targetFile = fileList.find((file) => file.name.indexOf(version) >= 0);
        const preVersion = await ssh.execCommand(`cat version.md`, { cwd: this.remotePath });
        if (!targetFile) {
          console.log("该版本不存在！");
        } else if (preVersion.stdout.trim() === version) {
          console.log("该版本已部署，请选择其他版本！");
        } else {
          break;
        }
      }
      while (true) {
        const yn: string = await new Promise<string>((resolve) => {
          readInput.question("确定回退到所选版本么?（y/n）: ", (answer) => {
            resolve(answer);
          });
        });
        if (["yes", "y"].includes(yn.toLowerCase())) {
          break;
        } else if (["no", "n"].includes(yn.toLowerCase())) {
          ssh.dispose();
          process.exit(0);
        } else {
        }
      }
      console.log("更新版本...");
      // 删除dist文件夹
      await ssh.execCommand(`rm ${this.fileName} -rf`, { cwd: this.remotePath });
      // 解压指定版本
      await ssh.execCommand(`unzip -o ${this.fileName}_${version}.zip -d ${this.fileName}`, { cwd: this.remotePath });
      console.log("版本更新完成！");
      // 断开连接
      ssh.dispose();
      process.exit(0);
    });
  }
}
