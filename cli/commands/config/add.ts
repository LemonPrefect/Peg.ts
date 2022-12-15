/** 生成与修改配置文件 - config add
 * ./coscli config add -b <bucket-name> -e <endpoint> -a <alias> [-c <config-file-path>]
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command } from "../../common/lib.ts";
import { chart, colorLog, configInit } from "../../common/utils.ts";
import i18n from "../../common/i18n.ts";
import { CommandError } from "../../exceptions/CommandError.ts";

const t = i18n();
interface options{
  alias: string, 
  configPath: string
}

export default await new Command()
  .usage("[option]")
  .description(t("commands.config.add.description"))
  .example(t("commands.config.add.examples.addBucket"), "./peg config add -a example")

  .option("-a, --alias <alias:string>", t("commands.config.add.options.alias"), {
    required: true
  })

  .action(async(e) => {
    const { alias, configPath } = e as options;
    try{
      const config = configInit(configPath);
      if(await config.addBucket(alias)){
        const bucket = config.getBucket(alias);
        if(!bucket){
          throw new CommandError(t("commands.config.add.errors.add", { alias }), "error");
        }
        colorLog("done", t("commands.config.add.logs.added", { alias }));
        chart([
          t("charts.bucket.name"), 
          t("charts.bucket.alias"), 
          t("charts.bucket.region"), 
          t("charts.bucket.endpoint")
        ], [[bucket.name, bucket.alias, bucket.region, bucket.endpoint]]).render();
      }else{
        colorLog("error", t("commands.config.add.errors.notInEndpoint", { alias }));
      }
    }catch(e){
      colorLog("error", e.message);
    }
  })
