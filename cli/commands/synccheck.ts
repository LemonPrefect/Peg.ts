/** 查看 CDN 缓存文件 - synccheck */
import { Command } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { bucketInit, chart, colorLog, configInit, parseDogeURL, recurseLog } from "../common/utils.ts";
import { CommandError } from "../exceptions/CommandError.ts";
import i18n from "../common/i18n.ts";

interface options{
  url: boolean,
  include: string,
  exclude: string,
  recursive: boolean,

  configPath: string,
  secretId: string,
  secretKey: string
}
const t = i18n();

export default await new Command()
  .usage("<bucket-uri> [option]")
  .description(t("commands.synccheck.description"))
  .example(
    t("commands.synccheck.examples.checkFiles"),
    "./peg synccheck doge://bucket/fonts/ -r --include .*.otf doge://bucket/fonts2/"
  )
  .option("--exclude <exclude:string>", t("cliche.options.exclude"))
  .option("--include <include:string>", t("cliche.options.include"))
  .option("-r, --recursive", t("commands.synccheck.options.recursive"))
  .option("--url", t("commands.synccheck.options.url"))
  .arguments("[paths...]")

  .action(async(e, ...paths) => {
    const { url, include, exclude, recursive, configPath, secretId, secretKey } = e as unknown as options;

    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);
      

      for(const path of paths){
        if(!(path as string).startsWith("doge://")){
          throw new CommandError(t("cliche.errors.pathInvalid", { path }));
        }

        const doge = parseDogeURL(path as string);
        const bucket = bucketInit(config, doge.bucket);
        const file = new File(config.getService(), bucket);
        let files: Array<IFile> = [] as Array<IFile>;
        if(!recursive){
          files = (await file.getFiles(doge.path)).files.filter((file) => !file.key.endsWith("/"));
        }else{
          files = await file.getFilesRecurse(doge.path, (key: string) => {
            recurseLog(t("cliche.recurse.walking", { key }));
          });
        }
        files = file.filterFilesRemote(files, include, exclude);
        if(files.length === 0){
          colorLog("warn", t("cliche.errors.noFileFound", { path }));
          continue;
        }
        const body: Array<Array<string> | string> = [] as Array<Array<string> | string>;
        for(const task of files){
          recurseLog(t("cliche.recurse.syncTimeGetting", { key: task.key }));
          const cacheTime: string = await file.getSyncTime(task);
          if(task.time !== cacheTime){
            if(url){
              body.push(await file.getUrl(task));
            }else{
              body.push([
                task.key,
                task.time,
                cacheTime
              ]);
            }
          }
        }
        if(body.length === 0){
          colorLog("done", t("commands.synccheck.logs.noUnsynced", { path: doge.path }));
          continue;
        }else{
          colorLog("done", t("commands.synccheck.logs.hasUnsynced", { path: doge.path }));
        }
        if(url){
          for(const url of body){
            colorLog("done", url as string);
          }
        }else{
          chart([
            t("charts.file.key"),
            t("charts.file.lastModified"),
            t("charts.file.lastCached")
          ], body as Array<Array<string>>, true, body.length).render();
        }
      }
    }catch(e){
      colorLog("error", e.message);
    }
  })