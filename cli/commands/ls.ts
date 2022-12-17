/** 查询存储桶或文件列表 - ls
 * ./coscli ls [doge://bucketAlias[/prefix/]] [flag]
 * https://cloud.tencent.com/document/product/436/63668
 */
import { Command } from "../common/lib.ts";
import { bucketInit, chart, colorLog, configInit, parseDogeURL, recurseLog } from "../common/utils.ts"
import { Bucket } from "../../core/main/Bucket.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import i18n from "../common/i18n.ts";
import { Config } from "../../core/main/Config.ts";
import { CommandError } from "../exceptions/CommandError.ts";

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
  
  .option("--exclude <exclude:string>", t("cliche.options.exclude"))
  .option("--include <include:string>", t("cliche.options.include"))
  .option("--limit <limit:integer>", t("commands.ls.options.limit"))
  .option("-r, --recursive", t("commands.ls.options.recurse"))
  
  .action(async(e, location) => {
    const { exclude, include, limit, recursive, configPath, secretId, secretKey } = e as unknown as options;
    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);
      if(!location){
        colorLog("info", t("cliche.chartBucketTitle"));
        const bucket = new Bucket(config.getService());
        const buckets = await bucket.getBuckets();
        const body: Array<Array<string>> = [];
        for(const bucket of buckets){
          body.push([bucket.name, bucket.alias, bucket.region, bucket.endpoint])
        }
        chart([
          t("charts.bucket.name"), 
          t("charts.bucket.alias"), 
          t("charts.bucket.region"), 
          t("charts.bucket.endpoint")  
        ], body).render();
        return;
      }
      const doge = parseDogeURL(location as string);

      if(!doge.path){
        doge.path = "";
      }
      if(!doge.path.endsWith("/") && !(doge.path === "")){
        doge.path += "/";
      }
      
      const bucket = bucketInit(config, doge.bucket);
      const file = new File(config.getService(), bucket);
      let files: Array<IFile> = [] as Array<IFile>;
      if(recursive){
        files = await file.getFilesRecurse(doge.path, (key: string) => {
          recurseLog(t("cliche.recurse.walking", { key }));
        });
      }else{
        files = (await file.getFiles(doge.path, limit)).files;
      }
      files = file.filterFilesRemote(files, include, exclude);
      if(files.length === 0){
        throw new CommandError(t("cliche.errors.noFileFound", { path: doge.path }), "error");
      }
      const body: Array<Array<string>> = [] as Array<Array<string>>;
      for(const file of files){
        body.push([
          file.key,
          file.key.endsWith("/") ? "dir" : "standard",
          file.time,
          File.formatBytes(file.size),
        ])
      }
      chart([
        t("charts.file.key"),
        t("charts.file.type"),
        t("charts.file.lastModified"),
        t("charts.file.size")
      ], body, true, files.length).render();  
    }catch(e){
      colorLog("error", e.message);
    }
  })
