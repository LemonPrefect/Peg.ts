/** 创建存储桶 - mb
 * ./coscli mb cos://<BucketName-APPID> -r <Region> [flag]
 * https://cloud.tencent.com/document/product/436/63145
 */
import { Command, EnumType } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { Table } from "https://deno.land/x/cliffy@v0.25.5/table/mod.ts";
import { Bucket } from "../core/main/Bucket.ts";
import { IBucket } from "../core/interfaces/IBucket.ts";
import { Config } from "../core/main/Config.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export interface options{
  region: string, 
  level: string,
  
  configPath: string,
  endpoint: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<bucket-alias> [flags]")
  .description("Create bucket")
  .example(
    "Create standard bucket `examplebucket' in chengdu",
    "./peg mb examplebucket -r ap-chengdu -t standard"
  )

  .type("region", new EnumType(["ap-shanghai", "ap-beijing", "ap-guangzhou", "ap-chengdu"]))
  .type("level", new EnumType(["standard", "basic"]))

  .option("-l, --level <level:level>", "Bucket type", {
    required: true
  })
  .option("-r, --region <region:region>", "Region", {
    default: "ap-chengdu",
      required: true
  })

  .arguments("<alias:string>")

  .action(async(e, alias) => {
    let { region, level, configPath, endpoint, secretId, secretKey } = e as unknown as options;
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }
    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, endpoint, secretId, secretKey);
      const bucket = new Bucket(config.getService());
      await bucket.createBucket(alias, region, level);
      const buckets: Array<IBucket> = await bucket.getBuckets();
      for(const bucket of buckets){
        if(bucket.alias === alias){
          console.log(success("[SUCCESS]"), `Bucket \`${alias}' added.`);
          new Table()
          .header(["Name", "Alias", "Region", "Endpoint"])
          .body([
            [bucket.name, bucket.alias, bucket.region, bucket.endpoint],
          ])
          .border(true)
          .render();
          console.log(success("[INFO]"), `Use ./peg config add ${alias} to add bucket into config.`);
          return;
        }
      }
      console.log(error("[FAILED]"), `Bucket \`${alias}' FAILED.`);
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })
