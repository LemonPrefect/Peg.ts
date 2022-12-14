/** 查询存储桶或文件列表 - ls
 * ./coscli ls [doge://bucketAlias[/prefix/]] [flag]
 * https://cloud.tencent.com/document/product/436/63668
 */
import { Command, path, colors, os, tty, ansi } from "../common/lib.ts";
import { chart, colorLog, configInit } from "../common/utils.ts"
import { Bucket } from "../../core/main/Bucket.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import i18n from "../common/i18n.ts";

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
const t = i18n();

export default await new Command()
  .usage("[bucket-uri] [option]")
  .description(t("commands.ls.description"))
  .example(
    "List file recursively",
    "./peg ls doge://examplebucket/test/ -r"
  )
  
  .arguments("[location:string]")
  
  .option("--exclude <exclude:string>", t("commands.ls.options.exclude"))
  .option("--include <include:string>", t("commands.ls.options.include"))
  .option("--limit <limit:integer>", t("commands.ls.options.limit"))
  .option("-r, --recursive", t("commands.ls.options.recurse"))
  
  .action(async(e, location) => {
    const { exclude, include, limit, recursive, configPath, secretId, secretKey } = e as unknown as options;
    try{
      const config = configInit(configPath, secretId, secretKey);
      if(!location){
        colorLog("info", t("commands.ls.logs.buckets"));
        const bucket = new Bucket(config.getService());
        const buckets = await bucket.getBuckets();
        const body: Array<Array<string>> = [];
        for(const bucket of buckets){
          body.push([bucket.name, bucket.alias, bucket.region, bucket.endpoint])
        }
        chart(["Name", "Alias", "Region", "Endpoint"], body).render();
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
        body.push([
          file.key,
          file.key.endsWith("/") ? "dir" : "standard",
          file.time,
          File.formatBytes(file.size),
        ])
      }
      chart(["Key", "Type", "Last Modified", "Size"], body, true, files.length).render();  
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })
