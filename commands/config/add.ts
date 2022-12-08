/** 生成与修改配置文件 - config add
 * ./coscli config add -b <bucket-name> -e <endpoint> -a <alias> [-c <config-file-path>]
 * https://cloud.tencent.com/document/product/436/63679
 */
 import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";


export default await new Command()
  .usage("[flags]")
  .description("Used to add a new bucket configuration")
  .example("Format", "./peg config add -b <bucket-name> -e <endpoint> -a <alias> [-c <config-file-path>]")
  .example("Add bucket", "./peg config add -b example-1234567890 -r ap-shanghai -a example")

  .option("-a, --alias <alias:string>", "Bucket alias")
  .option("-b, --bucket <bucket:string>", "Bucket name")
  .option("-r, --region <region:string>", "Bucket region")

  .action(async({alias, bucket, region}) => {
    

  })
