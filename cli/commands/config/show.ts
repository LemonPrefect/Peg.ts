/** 打印指定配置文件中的信息 - config show
 * ./coscli config show [-c <config-file-path>]
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command } from "../../common/lib.ts";
import { chart, colorLog, configInit } from "../../common/utils.ts"
import i18n from "../../common/i18n.ts";

const t = i18n();

export default await new Command()
  .usage("[option]")
  .description(t("commands.config.show.description"))
  .example(t("commands.config.set.examples.format"), "./peg config show [-c <config-file-path>]")
  .example(t("commands.config.set.examples.showAllInfo"), "./peg config show")

  .action((e) => {
    const { configPath } = e as unknown as { configPath: string };
    try{
      const config = configInit(configPath); //fix path display
      colorLog("info", t("cliche.configPathIndicator", { configPath: config.getService().path }));
      colorLog("info", t("cliche.basicConfigTitle"));
      chart([], [
        ["Secret ID", config.getConfig().secretId],
        ["Secret Key", config.getConfig().secretKey],
      ]).render();
      colorLog("info", t("cliche.chartBucketTitle"));
      const body: Array<Array<string>> = [];
      for(const bucket of config.getConfig().buckets){
        body.push([bucket.name, bucket.alias, bucket.region, bucket.endpoint])
      }
      chart([          
        t("charts.bucket.name"), 
        t("charts.bucket.alias"), 
        t("charts.bucket.region"), 
        t("charts.bucket.endpoint")
      ], body).render();
    }catch(e){
      colorLog("error", e.message);
    }
  })
