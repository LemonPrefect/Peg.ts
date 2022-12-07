import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import ls from "./commands/ls.ts";
import mb from "./commands/mb.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

await new Command()
  .name("peg")
  .description("Upload images to hdslb.")
  .version("0.0.221207.1")
  .usage("[flags/command]")
  .globalOption("-c, --config-path <configPath:string>", "config file path(default is $HOME/.cos.yaml)")
  .globalOption("-e, --endpoint <endpoint:string>", "config endpoint")
  .globalOption("-i, --secret-id <secretId:string>", "config secretId")
  .globalOption("-k, --secret-key <secretKey:string>", "config secretKey")
  .globalOption("-t, --session-token <sessionToken:string>", "config sessionToken")
  .command("ls", ls)
  .command("mb", mb)
  .parse(Deno.args)


/** Functions from Tencent COS CLI
 * 生成与修改配置文件 - config
 * 创建存储桶 - mb
 * 删除存储桶 - rb
 * 存储桶标签 - bucket-tagging
 * 查询存储桶或文件列表 - ls
 * 获取不同类型文件的统计信息 - du
 * 上传下载或拷贝文件 - cp
 * [?] 同步上传下载或拷贝文件 - sync
 * 删除文件 - rm
 * [?] 获取文件哈希值 - hash
 * 列出分块上传中产生的碎片 - lsparts
 * 清理碎片 - abort
 * 取回归档文件 - restore
 * [x] 获取预签名 URL - signurl
 */