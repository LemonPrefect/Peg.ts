/** 删除文件 - rm
 * ./coscli rm doge://<bucketAlias>[/prefix/] [doge://<bucket-name>[/prefix/]...] [flag]
 * https://www.tencentcloud.com/zh/document/product/436/43258
 */
import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { File } from "../core/main/File.ts"
import { IFile } from "../core/interfaces/IFile.ts";
import { tty } from "https://deno.land/x/cliffy@v0.25.5/ansi/tty.ts";
import { ansi } from "https://deno.land/x/cliffy@v0.25.5/ansi/ansi.ts";
import { Table, Row, Cell } from "https://deno.land/x/cliffy@v0.25.5/table/mod.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.5/prompt/mod.ts";
import { Config } from "../core/main/Config.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

interface options{
  exclude: string, 
  include: string,
  force: boolean,
  recursive: boolean,

  configPath: string,
  endpoint: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<source_path> <destination_path> [option]")
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
    let { exclude, include, recursive, configPath, endpoint, secretId, secretKey } = e as unknown as options;
    
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }

    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, endpoint, secretId, secretKey);

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
          body.push(Row.from([
            task.key,
            task.key.endsWith("/") ? "dir" : "standard",
            task.time,
            File.formatBytes(task.size),
          ]).align("right"))
        }
        Table
        .from([
          ...body,
          Row.from([new Cell("Total Objects:").colSpan(3).align("right"), new Cell(tasks.length)]).border(false)
        ])
        .header(Row.from(["Key", "Type", "Last Modified", "Size"]).border(false).align("center"))
        .border(true)
        .chars({
          "top": "-",
          "topMid": "+",
          "topLeft": "",
          "topRight": "",
          "bottom": "-",
          "bottomMid": "+",
          "bottomLeft": "",
          "bottomRight": "",
          "left": "",
          "leftMid": "",
          "mid": "",
          "midMid": "",
          "right": "",
          "rightMid": "",
          "middle": "│"
        })
        .render();
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