/** 删除文件 - rm
 * ./coscli rm cos://<bucketAlias>[/prefix/] [cos://<bucket-name>[/prefix/]...] [flag]
 * https://www.tencentcloud.com/zh/document/product/436/43258
 */
import { Command, path, colors, os, tty, ansi, Input } from "../common/lib.ts";

import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { Config } from "../../core/main/Config.ts";
import { bucketInit, chart, configInit, parseDogeURL } from "../common/utils.ts";


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
    const { exclude, include, recursive, configPath, secretId, secretKey } = e as unknown as options;
    
    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      for(const dogeurl of paths){ ///dogeurl???
        const doge = parseDogeURL(dogeurl as string);
        const bucket = bucketInit(config, doge.bucket);
        const file = new File(config.getService(), bucket);
        let tasks: Array<IFile> = [] as Array<IFile>;

        if(doge.path.endsWith("/") && !recursive){
          throw new Error(`${dogeurl} refers to a directory, \`-r' to remove it.`);
        }

        if(recursive){
          tasks = await file.getFilesRecurse(doge.path, (key: string) => {
            tty.eraseLine;
            console.log(`Walking ${key}...${ansi.eraseLineEnd.toString()}`);
            tty.cursorUp(1);
          });
        }else{
          tasks = (await file.getFiles(doge.path)).files.filter((file) => !file.key.endsWith("/"));
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