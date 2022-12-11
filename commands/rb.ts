/** 删除存储桶 - rb
 * ./coscli rb cos://<BucketName-APPID> -r <Region> [flag]
 * https://cloud.tencent.com/document/product/436/63667
 */
import { Command, EnumType } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { Table } from "https://deno.land/x/cliffy@v0.25.5/table/mod.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.5/prompt/mod.ts";
import { Bucket } from "../core/main/Bucket.ts";
import { IBucket } from "../core/interfaces/IBucket.ts";
import { Config } from "../core/main/Config.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export interface options{
  region: string, 

  configPath: string,
  endpoint: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<bucket-alias> [flags]")
  .description("Remove bucket")
  .example(
    "Delete bucket `examplebucket' in chengdu",
    "./peg rb examplebucket -r ap-chengdu"
  )

  .type("region", new EnumType(["ap-shanghai", "ap-beijing", "ap-guangzhou", "ap-chengdu"]))

  .option("-r, --region <region:region>", "Region", {
    required: true
  })

  .arguments("<alias:string>")

  .action(async(e, alias) => {
    let { region, configPath, endpoint, secretId, secretKey } = e as unknown as options;
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }
    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, endpoint, secretId, secretKey);

      const bucket = new Bucket(config.getService());
      const buckets: Array<IBucket> = await bucket.getBuckets();
      
      for(const _ of buckets){
        if(_.alias === alias && _.region === region){
          new Table()
          .header(["Name", "Alias", "Region", "Endpoint"])
          .body([
            [_.name, _.alias, _.region, _.endpoint],
          ])
          .border(true)
          .render();
          const confirm: string = await Input.prompt({
            message: `Are you sure to delete bucket ${alias}? Enter \`${alias}' to confirm`,
          });
          if(confirm !== alias){
            console.log(error("[FAILED]"), `Bucket \`${alias}' will NOT be delete.`);
            return;
          }
          await bucket.deleteBucket(alias);
          console.log(success("[SUCCESS]"), `Bucket \`${alias}' deleted.`);
          console.log(success("[INFO]"), `Use ./peg config delete ${alias} to delete bucket in config.`);
        }
      }
      console.log(error("[FAILED]"), `Bucket \`${alias}' delete FAILED.`);
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })
