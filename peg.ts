import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import ls from "./commands/ls.ts";
import mb from "./commands/mb.ts";
import rb from "./commands/rb.ts";
import cp from "./commands/cp.ts";
import config from "./commands/config/config.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

await new Command()

  .name("peg")
  .description("Welcome to use peg, a third-party open source DogeCloud OSS CLI.")
  .version("0.0.221207.1")
  .usage("[flags/command]")
  .group("Global Options")
  .globalOption("-c, --config-path <configPath:string>", "config file path(default is $HOME/.cos.yaml)")
  .globalOption("-e, --endpoint <endpoint:string>", "config endpoint")
  .globalOption("-i, --secret-id <secretId:string>", "config secretId", {
    depends: ["secret-key"]
  })
  .globalOption("-k, --secret-key <secretKey:string>", "config secretKey", {
    depends: ["secret-id"]
  })
  .globalOption("-t, --session-token <sessionToken:string>", "config sessionToken")
  .command("config", config)
  .command("ls", ls)
  .command("mb", mb)
  .command("rb", rb)
  .command("cp", cp)
  .parse(Deno.args)


/** Functions from Tencent COS CLI
 * [√√] 生成与修改配置文件 - config
 * [√√] 创建存储桶 - mb
 * [√√] 删除存储桶 - rb
 * [x] 存储桶标签 - bucket-tagging - 无标签
 * [√√] 查询存储桶或文件列表 - ls
 * [x] 获取不同类型文件的统计信息 - du - 无存档
 * 上传下载或拷贝文件 - cp
 * [?] 同步上传下载或拷贝文件 - sync
 * 删除文件 - rm
 * [?] 获取文件哈希值 - hash - 没有人知道 DogeCloud 的哈希怎么算的 w(ﾟДﾟ)w
 * [?] 列出分块上传中产生的碎片 - lsparts - s3 处理
 * [?] 清理碎片 - abort - s3 处理
 * [x] 取回归档文件 - restore - 无归档
 * [?1] 获取预签名 URL - signurl
 * mv
 */