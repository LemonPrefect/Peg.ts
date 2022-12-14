/** 打印指定配置文件中的信息 - config show
 * ./coscli config show [-c <config-file-path>]
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command, colors, path, os } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";
import { chart, colorLog, configInit } from "../../common/utils.ts"


const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export default await new Command()
  .usage("[option]")
  .description("Prints information from a specified configuration file")
  .example("Format", "./peg config show [-c <config-file-path>]")
  .example("Show all info", "./peg config show")

  .action((e) => {
    let { configPath } = e as unknown as { configPath: string };
    try{
      const config = configInit(configPath);
      console.log(`Configuration file path: ${configPath}`);
      console.log("Basic Configuration Information: ");
      chart([], [
        ["Secret ID", config.getConfig().secretId],
        ["Secret Key", config.getConfig().secretKey],
      ]).render();
      console.log("Buckets: ");
      const body: Array<Array<string>> = [];
      for(const bucket of config.getConfig().buckets){
        body.push([bucket.name, bucket.alias, bucket.region, bucket.endpoint])
      }
      chart(["Name", "Alias", "Region", "Endpoint"], body).render();
  }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })
