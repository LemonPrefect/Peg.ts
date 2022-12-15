/** 修改配置文件 base 组中的一个或多个配置项 - config set
 * ./coscli config set [option]
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command } from "../../common/lib.ts";
import { chart, colorLog, configInit } from "../../common/utils.ts"
import i18n from "../../common/i18n.ts";

const t = i18n();

export default await new Command()
  .usage("[option]")
  .description(t("commands.config.set.description"))
  .example(t("commands.config.set.examples.credentialSet"), "./peg config set -i 123 -k 234")

  .action((e) => {
    const {secretKey, secretId, configPath} = e as unknown as {secretKey: string, secretId: string, configPath: string};
    try{
      const config = configInit(configPath);
      if(secretId && secretKey){
        config.setCredentials(secretId, secretKey);
        console.log("done", t("commands.config.set.logs.credentialSet"));
      }
      colorLog("info", t("cliche.basicConfigTitle"));
      chart([], [
        ["Secret ID", config.getConfig().secretId],
        ["Secret Key", config.getConfig().secretKey],
      ]).render();
    }catch(e){
      colorLog("error", e.message);
    }
  })
