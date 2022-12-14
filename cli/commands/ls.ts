/** 查询存储桶或文件列表 - ls
 * ./coscli ls [doge://bucketAlias[/prefix/]] [flag]
 * https://cloud.tencent.com/document/product/436/63668
 */
import { Command, path, colors, os, Table, Row, Cell, tty, ansi } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { Bucket } from "../../core/main/Bucket.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export interface options{
  exclude: string, 
  include: string, 
  limit: number,
  recursive: boolean,

  configPath: string,
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
    let { exclude, include, limit, recursive, configPath, secretId, secretKey } = e as unknown as options;
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }
    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      if(!location){
        console.log("Buckets: ");
        const bucket = new Bucket(config.getService());
        const buckets = await bucket.getBuckets();
        const body: Array<Array<string>> = [];
        for(const bucket of buckets){
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
