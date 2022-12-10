/** 查询存储桶或文件列表 - ls
 * ./coscli ls [cos://bucketAlias[/prefix/]] [flag]
 * https://cloud.tencent.com/document/product/436/63668
 */
import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { Config } from "../core/main/Config.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { Table, Row, Cell } from "https://deno.land/x/cliffy@v0.25.5/table/mod.ts";
import { tty } from "https://deno.land/x/cliffy@v0.25.5/ansi/tty.ts";
import { ansi } from "https://deno.land/x/cliffy@v0.25.5/ansi/ansi.ts";
import { File } from "../core/main/File.ts"
import { IFile } from "../core/interfaces/IFile.ts";
import * as fs from "https://deno.land/std@0.167.0/node/fs.ts";
import { walk } from "https://deno.land/std@0.121.0/fs/walk.ts";
import { FileService } from "../core/services/file.service.ts";
import download from "./cp/download.ts";
import upload from "./cp/upload.ts";
import copy from "./cp/copy.ts";


const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

interface options{
  exclude: string, 
  include: string, 
  partSize: number, 
  threadNum: number, 
  configPath: string, 
  recursive: boolean,
  signUrl: boolean
}

export default await new Command()
  .usage("<source_path> <destination_path> [flags]")
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
  .option("--thread-num <threadNum:number>", "(Upload only) Specifies the number of concurrent upload threads", {
    default: 5
  })
  .option("-s, --sign-url", "(Download only) Generate OSS signed URL, CHARGED.", {
    default: false
  })

  .action(async(e, ...paths) => {
    let { exclude, include, partSize, threadNum, configPath, recursive, signUrl } = e as unknown as options;
    
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }

    try{
      const config = new Config(configPath);
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