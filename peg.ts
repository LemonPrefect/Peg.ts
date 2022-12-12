import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import ls from "./commands/ls.ts";
import mb from "./commands/mb.ts";
import mv from "./commands/mv.ts";
import rb from "./commands/rb.ts";
import cp from "./commands/cp.ts";
import config from "./commands/config/config.ts";
import signurl from "./commands/signurl.ts";
import hash from "./commands/hash.ts";
import rm from "./commands/rm.ts";

await new Command()

  .name("peg")
  .description("Welcome to use peg, a third-party open source DogeCloud OSS CLI.")
  .version("0.0.221207.2")
  .usage("[option/command]")
  .group("Global Options")
  .globalOption("-c, --config-path <configPath:string>", "config file path(default is $HOME/.peg.config.yaml)")
  .globalOption("-e, --endpoint <endpoint:string>", "config endpoint")
  .globalOption("-i, --secret-id <secretId:string>", "config secretId", {
    depends: ["secret-key"]
  })
  .globalOption("-k, --secret-key <secretKey:string>", "config secretKey", {
    depends: ["secret-id"]
  })
  .globalOption("-t, --session-token <sessionToken:string>", "config sessionToken")
  .command("config", config)
  .command("cp", cp)
  .command("hash", hash)
  .command("ls", ls)
  .command("mb", mb)
  .command("mv", mv)
  .command("rb", rb)
  .command("rm", rm)
  .command("signurl", signurl)
  .parse(Deno.args)


/** Functions from Tencent COS CLI
 * [√√] 生成与修改配置文件 - config
 * [√√] 创建存储桶 - mb
 * [√√] 删除存储桶 - rb
 * [x] 存储桶标签 - bucket-tagging - 无标签
 * [√√] 查询存储桶或文件列表 - ls
 * [x] 获取不同类型文件的统计信息 - du - 无存档
 * [√√] 上传下载或拷贝文件 - cp --meta ?
 * [√√] 同步上传下载或拷贝文件 - sync
 * [√√] 删除文件 - rm
 * [√√] 获取文件哈希值 - hash -  crc
 * [x] 列出分块上传中产生的碎片 - lsparts - s3 处理
 * [x] 清理碎片 - abort - s3 处理
 * [x] 取回归档文件 - restore - 无归档
 * [√√] 获取预签名 URL - signurl
 * [√√] 移动文件 - mv
 */

