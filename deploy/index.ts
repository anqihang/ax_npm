/*
 * @Author: 安琦航 anqihang0106@outlook.com
 * @Date: 2024-10-20 23:43:36
 */
import { NodeSSH } from "node-ssh";
const ssh = new NodeSSH();
class Deploy {
  host: string = "";
  port: number = 22;
  username: string = "";
  password: string = "";
  privateKey: string = "";
  constructor(host: string, port: number, username: string, password?: string, privateKey?: string) {
    this.host = host;
    this.port = port;
    this.username = username;
    password && (this.password = password);
    privateKey && (this.privateKey = privateKey);
  }

  deploy() {
    ssh
      .connect({
        host: this.host,
        port: this.port,
        username: this.username,
        password: this.password || void 0,
        privateKey: this.privateKey || void 0,
      })
      .then(() => {
        console.log("Connected");
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        // 断开连接
        ssh.dispose();
      });
  }
}
