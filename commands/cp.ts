/** 上传下载或拷贝文件 - cp
 * ./coscli cp <source_path> <destination_path> [option]
 * https://cloud.tencent.com/document/product/436/63669
 */
import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { Config } from "../core/main/Config.ts";
import download from "./cp/download.ts";
import upload from "./cp/upload.ts";
import copy from "./cp/copy.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

interface options{
  exclude: string, 
  include: string, 
  partSize: number, 
  threadNum: number,  
  recursive: boolean,
  signUrl: boolean,
  sync: boolean,

  configPath: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<source_path> <destination_path> [option]")
  .description("Upload, download or copy objects")
  .example(
    "Upload",
    "./peg cp ~/example.txt doge://examplebucket/example.txt"
  )
  .example(
    "Download",
    "./peg cp doge://examplebucket/example.txt ~/example.txt"
  )
  .example(
    "Copy",
    "./peg cp doge://examplebucket1/example1.txt doge://examplebucket2/example2.txt"
  )
  
  .arguments("[paths...]")

  .option("--exclude <exclude:string>", "Exclude files that meet the specified criteria")
  .option("--include <include:string>", "Exclude files that meet the specified criteria")
  .option("--part-size <partSize:number>", "(Upload only) Specifies the block size(MB)", {
    default: 32
  })
  .option("-r, --recursive", "List objects recursively")
  .option("-s, --sign-url", "(Download/Sync only) Generate OSS signed URL, CHARGED")
  .option("--sync", "Examine CRC64 first")
  .option("--thread-num <threadNum:number>", "(Upload only) Specifies the number of concurrent upload threads", {
    default: 5
  })

  .action(async(e, ...paths) => {
    let { configPath, secretId, secretKey } = e as unknown as options;
    
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }

    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      if(paths.length !== 2){
        throw new Error(`Arg(s) \`${paths}' are invalid.`);
      }

      if(paths[0].startsWith("doge://") && !paths[1].startsWith("doge://")){
        return await download(config, paths, e as unknown as options);
      }else if(!paths[0].startsWith("doge://") && paths[1].startsWith("doge://")){
        return await upload(config, paths, e as unknown as options);
      }else if(paths[0].startsWith("doge://") && paths[1].startsWith("doge://")){
        return await copy(config, paths, e as unknown as options);
      }else{
        throw new Error(`Arg(s) \`${paths}' are invalid.`);
      }
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })