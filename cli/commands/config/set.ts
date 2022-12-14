/** 修改配置文件 base 组中的一个或多个配置项 - config set
 * ./coscli config set [option]
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command, colors, path, os, Table } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export default await new Command()
  .usage("[option]")
  .description("Used to modify configuration items in the [base] group of the configuration file")
  .example("Format", "./peg set [option]")
  .example("Set credentials", "./peg config set -i 123 -k 234")

  .action((e) => {
    let {secretKey, secretId, configPath} = e as unknown as {secretKey: string, secretId: string, configPath: string};
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }
    try{
      const config = new Config(configPath);
      if(secretId && secretKey){
        config.setCredentials(secretId, secretKey);
        console.log(success("[SUCCESS]"), `Credential set.`);
      }
      console.log("Basic Configuration Information: ");
      new Table()
      .body([
        ["Secret ID", config.getConfig().secretId],
        ["Secret Key", config.getConfig().secretKey],
      ])
      .border(true)
      .render();
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })