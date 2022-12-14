/** 生成与修改配置文件 - config add
 * ./coscli config add -b <bucket-name> -e <endpoint> -a <alias> [-c <config-file-path>]
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command, colors, path, os } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";
import { chart, configInit } from "../../common/utils.ts";


const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export default await new Command()
  .usage("[option]")
  .description("Used to add a new bucket configuration")
  .example("Format", "./peg config add -a <alias> [-c <config-file-path>]")
  .example("Add bucket", "./peg config add -a example")

  .option("-a, --alias <alias:string>", "Bucket alias", {
    required: true
  })

  .action(async(e) => {
    let {alias, configPath} = e as {alias: string, configPath: string};
    try{
      const config = configInit(configPath);
      if(await config.addBucket(alias)){
        const bucket = config.getBucket(alias);
        if(!bucket){
          console.log(error("[ERROR]"), `Bucket \`${alias}' add FAILED.`);
          return;
        }
        console.log(success("[SUCCESS]"), `Bucket \`${alias}' added, config filename ${configPath}`);
        chart(["Name", "Alias", "Region", "Endpoint"], [[bucket.name, bucket.alias, bucket.region, bucket.endpoint]]).render();
      }else{
        console.log(error("[FAILED]"), `Bucket \`${alias}' FAILED to add as it's not exist in endpoint.`);
      }
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })
