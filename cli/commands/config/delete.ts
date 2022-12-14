/** 删除一个已经存在的存储桶配置 - config delete
 * ./coscli config delete -a <alias> [-c <config-file-path>]
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command, colors, path, os, Table } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export default await new Command()
  .usage("[option]")
  .description("Used to delete an existing bucket")
  .example("Format", "./peg config delete -a <alias> [-c <config-file-path>]")
  .example("Delete an existing bucket", "./peg config delete -a example")
  
  .option("-a, --alias <alias:string>", "Bucket alias", {
    required: true
  })

  .action((e) => {
    let {alias, configPath} = e as {alias: string, configPath: string};
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }
    try{
      const config = new Config(configPath);
      const bucket = config.getBucket(alias);
      if(!bucket){
        console.log(warn("[WARN]"), `Bucket \`${alias}' doesn't exist.`);
        return;
      }
      config.deleteBucket(alias);
      console.log(success("[SUCCESS]"), `Bucket \`${alias}' deleted, showed as follow, config filename ${configPath}`);
      new Table()
      .header(["Name", "Alias", "Region", "Endpoint"])
      .body([
        [bucket.name, bucket.alias, bucket.region, bucket.endpoint],
      ])
      .border(true)
      .render();
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })