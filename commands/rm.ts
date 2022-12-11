/** 删除文件 - rm
 * ./coscli rm cos://<bucketAlias>[/prefix/] [cos://<bucket-name>[/prefix/]...] [flag]
 * https://www.tencentcloud.com/zh/document/product/436/43258
 */
import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { Config } from "../core/main/Config.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { File } from "../core/main/File.ts"
import { IFile } from "../core/interfaces/IFile.ts";
import { tty } from "https://deno.land/x/cliffy@v0.25.5/ansi/tty.ts";
import { ansi } from "https://deno.land/x/cliffy@v0.25.5/ansi/ansi.ts";


const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

interface options{
  configPath: string,
  exclude: string, 
  include: string,
  force: boolean,
  recursive: boolean
}

export default await new Command()
  .usage("[flags]")
  .description("Remove objects")
  .example(
    "Remove all files in test/ of bucket `example'",
    "./peg rm cos://example/test/ -r"
  )
  
  .arguments("[files...]")

  .option("-f, --force", "Force delete")
  .option("--exclude <exclude:string>", "Exclude files that meet the specified criteria")
  .option("--include <include:string>", "Exclude files that meet the specified criteria")

  .action(async(e, ...files) => {
    let { configPath, exclude, include, recursive, force } = e as unknown as options;
    
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }

    try{
      const config = new Config(configPath);
      
      for(const dogeurl of files){
        const [dogeBucket, dogePath] = (dogeurl as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
        if(!dogeBucket){
          throw new Error(`dogeBucket: \`${dogeBucket}' or dogePath: \`${dogePath}' is invalid.`);
        }
        const bucket = config.getBucket(dogeBucket);
        if(!bucket){
          throw new Error(`Bucket \`${dogeBucket}' doesn't exist in config.`);
        }
      
        const file = new File(config.getService(), bucket);
        let tasks: Array<IFile> = [] as Array<IFile>;

        if(dogePath.endsWith("/") && !recursive){
          throw new Error(`${dogeurl} refers to a directory, \`-r' to remove it.`);
        }

        if(recursive){
          tasks = await file.getFilesRecurse(dogePath, (key: string) => {
            tty.eraseLine;
            console.log(`Walking ${key}...${ansi.eraseLineEnd.toString()}`);
            tty.cursorUp(1);
          });
        }else{
          tasks = (await file.getFiles(dogePath)).files.filter((file) => !file.key.endsWith("/"));
        }

      
      
      }



    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })