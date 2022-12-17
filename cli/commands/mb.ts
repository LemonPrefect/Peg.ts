/** 创建存储桶 - mb
 * ./coscli mb cos://<BucketName-APPID> -r <Region> [flag]
 * https://cloud.tencent.com/document/product/436/63145
 */
import { Command, EnumType } from "../common/lib.ts";
import { chart, colorLog, configInit } from "../common/utils.ts"
import { Bucket } from "../../core/main/Bucket.ts";
import { IBucket } from "../../core/interfaces/IBucket.ts";
import { Config } from "../../core/main/Config.ts";
import i18n from "../common/i18n.ts";

export interface options{
  region: string, 
  level: string,
  
  configPath: string,
  secretId: string,
  secretKey: string
}
const t = i18n();

export default await new Command()
  .usage("<bucket-alias> [option]")
  .description(t("commands.mb.description"))
  .example(
    t("commands.mb.examples.createBucket"),
    "./peg mb examplebucket -r ap-chengdu -t standard"
  )

  .type("region", new EnumType(["ap-shanghai", "ap-beijing", "ap-guangzhou", "ap-chengdu"]))
  .type("level", new EnumType(["standard", "basic"]))

  .option("-l, --level <level:level>", t("commands.mb.options.level"), {
    required: true
  })
  .option("-r, --region <region:region>", t("cliche.options.region"), {
    default: "ap-chengdu",
    required: true
  })

  .arguments("<alias:string>")

  .action(async(e, alias) => {
    const { region, level, configPath, secretId, secretKey } = e as unknown as options;
    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);
      const bucket = new Bucket(config.getService());
      await bucket.createBucket(alias, region, level);
      const buckets: Array<IBucket> = await bucket.getBuckets();
      for(const bucket of buckets){
        if(bucket.alias === alias){
          colorLog("done", t("commands.mb.logs.created", { alias }));
          chart([
            t("charts.bucket.name"), 
            t("charts.bucket.alias"), 
            t("charts.bucket.region"), 
            t("charts.bucket.endpoint")  
          ], [[bucket.name, bucket.alias, bucket.region, bucket.endpoint]]).render();
          colorLog("info", t("commands.mb.logs.hintConfig", { alias }));
          return;
        }
      }
      console.log("error", t("commands.mb.errors.craete", { alias }));
    }catch(e){
      colorLog("error", e.message);
    }
  })
