/** 删除存储桶 - rb
 * ./coscli rb cos://<BucketName-APPID> -r <Region> [flag]
 * https://cloud.tencent.com/document/product/436/63667
 */
import { Command, EnumType, Input } from "../common/lib.ts";
import { Bucket } from "../../core/main/Bucket.ts";
import { IBucket } from "../../core/interfaces/IBucket.ts";
import { Config } from "../../core/main/Config.ts";
import { chart, colorLog, configInit } from "../common/utils.ts";
import i18n from "../common/i18n.ts";
import { CommandError } from "../exceptions/CommandError.ts";

export interface options{
  region: string, 

  configPath: string,
  secretId: string,
  secretKey: string
}
const t = i18n();

export default await new Command()
  .usage("<bucket-alias> [option]")
  .description(t("commands.rb.description"))
  .example(
    t("commands.rb.examples.deleteBucket"),
    "./peg rb examplebucket -r ap-chengdu"
  )

  .type("region", new EnumType(["ap-shanghai", "ap-beijing", "ap-guangzhou", "ap-chengdu"]))

  .option("-r, --region <region:region>", t("cliche.options.region"), {
    required: true
  })

  .arguments("<alias:string>")

  .action(async(e, alias) => {
    const { region, configPath, secretId, secretKey } = e as unknown as options;
    
    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      const bucket = new Bucket(config.getService());
      const buckets: Array<IBucket> = await bucket.getBuckets();
      
      for(const _ of buckets){
        if(_.alias === alias && _.region === region){
          chart([
            t("charts.bucket.name"), 
            t("charts.bucket.alias"), 
            t("charts.bucket.region"), 
            t("charts.bucket.endpoint")  
          ], [[_.name, _.alias, _.region, _.endpoint]]).render();
          const confirm: string = await Input.prompt({
            message: t("commands.rb.logs.deleteConfirm", { alias }),
          });
          if(confirm !== alias){
            throw new CommandError(t("commands.rb.errors.checkFailed", { alias }), "error");
          }
          await bucket.deleteBucket(alias);
          colorLog("done", t("commands.rb.logs.deleted", { alias }));
          colorLog("info", t("commands.rb.logs.hintConfig", { alias }));
          return;
        }
      }
      colorLog("error", t("commands.rb.errors.deleteFailedOrNotExist", { alias }));
    }catch(e){
      colorLog("error", e.message);
    }
  })
