
import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { tty } from "https://deno.land/x/cliffy@v0.25.5/ansi/tty.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { ansi } from "https://deno.land/x/cliffy@v0.25.5/ansi/ansi.ts";
import * as progress from "https://deno.land/x/progress@v1.3.4/mod.ts";
import { Config } from "../core/main/Config.ts";
import { File } from "../core/main/File.ts"
import { IFile } from "../core/interfaces/IFile.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

const bars = new progress.MultiProgressBar({
  title: "Moving files",
  display: "[:bar] :text :percent :time :completed/:total"
});

interface options{
  exclude: string, 
  include: string,
  recursive: boolean,
  force: boolean,

  configPath: string,
  endpoint: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<source_path> <destination_path> [flags]")
  .description("Move objects")
  .example(
    "Move file",
    "./peg mv doge://examplebucket1/example1.txt doge://examplebucket2/example2.txt"
  )
  .example(
    "Move files from a to b",
    "./peg mv doge://examplebucket1/a doge://examplebucket2/b"
  )
  .arguments("[paths...]")


  .option("--exclude <exclude:string>", "Exclude files that meet the specified criteria")
  .option("-f, --force", "Move file overwritely")
  .option("--include <include:string>", "Exclude files that meet the specified criteria")
  .option("-r, --recursive", "Move objects recursively")

  .action(async(e, ...paths) => {
    let { exclude, include, recursive, force, configPath, endpoint, secretId, secretKey } = e as unknown as options;
    
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }

    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, endpoint, secretId, secretKey);

      if(paths.length !== 2 || !paths[0].startsWith("doge://") || !paths[1].startsWith("doge://")){
        throw new Error(`Arg(s) \`${paths}' are invalid.`);
      }

      const [sourceBucket, sourcePath] = (paths[0] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
      const [destinationBucket, destinationPath] = (paths[1] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
      
      if(!sourceBucket){
        throw new Error(`sourceBucket: \`${sourceBucket}' or sourcePath: \`${sourcePath}' is invalid.`);
      }
      if(!destinationBucket){
        throw new Error(`destinationBucket: \`${destinationBucket}' or sourcePath: \`${destinationPath}' is invalid.`);
      }
      
      const bucket = config.getBucket(sourceBucket);
      if(!bucket){
        throw new Error(`Bucket \`${sourceBucket}' doesn't exist in config.`);
      }
    
      const file = new File(config.getService(), bucket);
      let files: Array<IFile> = [] as Array<IFile>;
      files = (await file.getFiles(sourcePath)).files;  
    
      if(recursive){
        files = await file.getFilesRecurse(sourcePath, (key: string) => {
          tty.eraseLine;
          console.log(`Walking ${key}...${ansi.eraseLineEnd.toString()}`);
          tty.cursorUp(1);
        });
      }else{
        files = (await file.getFiles(sourcePath)).files.filter((file) => !file.key.endsWith("/"));
      }
      const originalFileCount = files.length;
      files = file.filterFilesRemote(files, include, exclude);
    
      const tasks: Array<IFile> = [] as Array<IFile>;
      if(originalFileCount === 1){
        files[0].local = destinationPath;
        tasks.push(files[0]);
      }else{
        for(const file of files){
          file.local = path.posix.join(destinationPath, file.key.replace(sourcePath, ""));
          tasks.push(file);
        }
      }
      for(const task of tasks){
        moving(`${sourceBucket}/${task.key} => ${destinationBucket}/${task.local}`, tasks.indexOf(task), tasks.length)
        await file.moveFile(task.key, task.local!, sourceBucket, destinationBucket, force);
        moving(`${sourceBucket}/${task.key} => ${destinationBucket}/${task.local}`, tasks.indexOf(task) + 1, tasks.length)
      }    
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })

function moving(file: string, index: number, total: number){
  bars.render([
    { completed: index, total: total, text: file },
  ]);
}