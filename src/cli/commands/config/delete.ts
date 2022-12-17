/** 删除一个已经存在的存储桶配置 - config delete
 * ./coscli config delete -a <alias> [-c <config-file-path>]
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command } from "../../common/lib.ts";
import { bucketInit, chart, colorLog, configInit } from "../../common/utils.ts";
import i18n from "../../common/i18n.ts";

const t = i18n();

export default await new Command()
  .usage("[option]")
  .description(t("commands.config.delete.description"))
  .example(t("commands.config.delete.examples.deleteBucket"), "./peg config delete -a example")
  
  .option("-a, --alias <alias:string>", t("commands.config.delete.options.alias"), {
    required: true
  })

  .action((e) => {
    const {alias, configPath} = e as {alias: string, configPath: string};
    try{
      const config = configInit(configPath);
      const bucket = bucketInit(config, alias);
      config.deleteBucket(alias);
      colorLog("done", t("commands.config.delete.logs.deleted", { alias }));
      chart([
        t("charts.bucket.name"), 
        t("charts.bucket.alias"), 
        t("charts.bucket.region"), 
        t("charts.bucket.endpoint")
      ], [[bucket.name, bucket.alias, bucket.region, bucket.endpoint]]).render();
    }catch(e){
      colorLog("error", e.message);
    }
  })
