/** 交互式地生成配置文件 - config init
 * ./coscli config init
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command, path, os, Input } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";
import { chart, colorLog } from "../../common/utils.ts"
import i18n from "../../common/i18n.ts";

const t = i18n();

export default await new Command()
  .usage("[option]")
  .description(t("commands.config.init.description"))
  .example(t("commands.config.init.examples.init"), "./peg config init -c ./1.yaml")
  
  .action(async(e) => {
    let {configPath} = e as unknown as {configPath: string};
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
      const _: string = await Input.prompt({
        message: t("commands.config.init.logs.configPathSet", { configPath }),
      }) ?? configPath;
      configPath = _ ? _ : configPath;
    }else{
      colorLog("info", t("commands.config.init.logs.configPathSet", { configPath }));
    }
    const accessId: string = await Input.prompt({
      message: t("commands.config.init.logs.accessIdSet"),
    });
    const accessKey: string = await Input.prompt({
      message: t("commands.config.init.logs.accessKeySet"),
    });
    const alias: string = await Input.prompt({
      message: t("commands.config.init.logs.bucketAliasSet"),
    });
    try{
      Config.init(configPath);
      const config = new Config(configPath);
      config.setCredentials(accessId, accessKey);
      config.setDogeEndpoint("https", "api.dogecloud.com");
      colorLog("info", t("cliche.configPathIndicator", { configPath }));
      colorLog("info", t("cliche.basicConfigTitle"));

      chart([], [
        ["Secret ID", config.getConfig().secretId],
        ["Secret Key", config.getConfig().secretKey],
      ]).render();
      if(await config.addBucket(alias)){
        const bucket = config.getBucket(alias);
        if(!bucket){
          colorLog("warn", t("commands.config.add.errors.add", { alias }))
          return
        }else{
          colorLog("done", t("commands.config.add.logs.added", { alias }));
          chart(["Name", "Alias", "Region", "Endpoint"], [[
            bucket.name, 
            bucket.alias, 
            bucket.region, 
            bucket.endpoint
          ]]).render();  
        }
      }else{
        colorLog("warn", t("cliche.notInEndpoint", { alias }));
      }
    }catch(e){
      colorLog("error", e.message);
    }
  })
