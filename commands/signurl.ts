/** 获取预签名 URL - signurl
 * ./coscli signurl cos://<bucketAlias>/<key> [flag]
 * https://tencentcloud.com/zh/document/product/436/43263
 */
import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { Config } from "../core/main/Config.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { File } from "../core/main/File.ts"
import { IFile } from "../core/interfaces/IFile.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

interface options{
  configPath: string,
  endpoint: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("[flags]")
  .description("(CHARGED) Query sign url for 10s")
  .example(
    "sign url for `example.file' in test/ of bucket `example'",
    "./peg signurl doge://example/test/example.file"
  )
  
  .arguments("<location:string>")

  .action(async(e, location) => {
    let { configPath, endpoint, secretId, secretKey } = e as unknown as options;
    
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }

    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, endpoint, secretId, secretKey);

      const [dogeBucket, dogePath] = (location as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
      if(dogePath.endsWith("/")){
        throw new Error(`${location} refers to a directory.`);
      }
      if(!dogeBucket){
        throw new Error(`dogeBucket: \`${dogeBucket}' or dogePath: \`${dogePath}' is invalid.`);
      }

      const bucket = config.getBucket(dogeBucket);
      if(!bucket){
        throw new Error(`Bucket \`${dogeBucket}' doesn't exist in config.`);
      }

      const file = new File(config.getService(), bucket);
      const files: Array<IFile> = (await file.getFiles(dogePath, 1)).files;
      if(files.length !== 1){
        throw new Error("No file found!");
      }
      console.log(success("[SUCCESS]"), await file.getUrl(files[0], true));
      console.log(warn("[WARN]"), "This url is CHARGED for CNY0.5/GB/DAY");

    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })