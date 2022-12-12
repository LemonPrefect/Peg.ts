/** 查询存储桶或文件列表 - ls
 * ./coscli ls [doge://bucketAlias[/prefix/]] [flag]
 * https://cloud.tencent.com/document/product/436/63668
 */
import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { Table, Row, Cell } from "https://deno.land/x/cliffy@v0.25.5/table/mod.ts";
import { tty } from "https://deno.land/x/cliffy@v0.25.5/ansi/tty.ts";
import { ansi } from "https://deno.land/x/cliffy@v0.25.5/ansi/ansi.ts";
import { Config } from "../core/main/Config.ts";
import { File } from "../core/main/File.ts"
import { IFile } from "../core/interfaces/IFile.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export interface options{
  exclude: string, 
  include: string, 
  limit: number,
  recursive: boolean,

  configPath: string,
  endpoint: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("[bucket-uri] [option]")
  .description("List buckets or objects")
  .example(
    "List file recursively",
    "./peg ls doge://examplebucket/test/ -r"
  )
  
  .arguments("[location:string]")
  
  .option("--exclude <exclude:string>", "Exclude files that meet the specified criteria")
  .option("--include <include:string>", "List files that meet the specified criteria")
  .option("--limit <limit:integer>", "Limit the number of objects listed(0~1000)")
  .option("-r, --recursive", "List objects recursively")
  
  .action(async(e, location) => {
    let { exclude, include, limit, recursive, configPath, endpoint, secretId, secretKey } = e as unknown as options;
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }
    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, endpoint, secretId, secretKey);

      if(!location){
        console.log("Buckets: ");
        const body: Array<Array<string>> = [];
        for(const bucket of config.getConfig().buckets){
          body.push([bucket.name, bucket.alias, bucket.region, bucket.endpoint])
        }
        new Table()
        .header(["Name", "Alias", "Region", "Endpoint"])
        .body(body)
        .border(true)
        .render();
        return;
      }
      let [dogeBucket, dogePath] = (location as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);

      if(!dogePath){
        dogePath = "";
      }
      if(!dogePath.endsWith("/") && !(dogePath === "")){
        dogePath += "/";
      }
      
      if(!dogeBucket){
        throw new Error(`dogeBucket: \`${dogeBucket}' or dogePath: \`${dogePath}' is invalid.`);
      }
      const bucket = config.getBucket(dogeBucket);
      if(!bucket){
        throw new Error(`Bucket \`${dogeBucket}' doesn't exist in config ${configPath}.`);
      }
      const file = new File(config.getService(), bucket);
      let files: Array<IFile> = [] as Array<IFile>;
      if(recursive){
        files = await file.getFilesRecurse(dogePath, (key: string) => {
          tty.eraseLine;
          console.log(`Walking ${key}...${ansi.eraseLineEnd.toString()}`);
          tty.cursorUp(1);
        });
      }else{
        files = (await file.getFiles(dogePath, limit)).files;
      }
      files = file.filterFilesRemote(files, include, exclude);
      const body: Array<Array<string>> = [] as Array<Array<string>>;
      for(const file of files){
        body.push(Row.from([
          file.key,
          file.key.endsWith("/") ? "dir" : "standard",
          file.time,
          File.formatBytes(file.size),
        ]).align("right"))
      }
      Table
        .from([
          ...body,
          Row.from([new Cell("Total Objects:").colSpan(3).align("right"), new Cell(files.length)]).border(false)
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
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })
