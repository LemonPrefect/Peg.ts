/** 删除文件 - rm
 * ./coscli rm cos://<bucketAlias>[/prefix/] [cos://<bucket-name>[/prefix/]...] [flag]
 * https://www.tencentcloud.com/zh/document/product/436/43258
 */
import { Command, path, colors, os, tty, ansi, Input } from "../common/lib.ts";

import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { Config } from "../../core/main/Config.ts";
import { chart } from "../common/utils.ts";


const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

interface options{
  exclude: string, 
  include: string,
  force: boolean,
  recursive: boolean,

  configPath: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<bucket-uri> [option]")
  .description("Remove objects")
  .example(
    "Remove all files in test/ of bucket `example'",
    "./peg rm doge://example/test/ -r"
  )
  
  .arguments("[paths...]")

  .option("--exclude <exclude:string>", "Exclude files that meet the specified criteria")
  .option("--include <include:string>", "Exclude files that meet the specified criteria")
  .option("-r, --recursive", "Delete object recursively")

  .action(async(e, ...paths) => {
    let { exclude, include, recursive, configPath, secretId, secretKey } = e as unknown as options;
    
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }

    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      for(const dogeurl of paths){
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
        tasks = file.filterFilesRemote(tasks, include, exclude);

        console.log(warn("These files will be deleted!"));
        const body: Array<Array<string>> = [] as Array<Array<string>>;
        for(const task of tasks){
          body.push([
            task.key,
            task.key.endsWith("/") ? "dir" : "standard",
            task.time,
            File.formatBytes(task.size)
          ])
        }
        chart(["Key", "Type", "Last Modified", "Size"], body, true, tasks.length).render();
        const confirm: string = await Input.prompt({
          message: `Are you sure to delete them? Enter \`delete' to confirm`,
        });
        if(confirm !== "delete"){
          console.log(error("[FAILED]"), `Files will NOT be delete.`);
          return;
        }
        await file.deleteFiles(tasks);
        console.log(success("[SUCCESS]"), `Files deleted.`);
      }
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })