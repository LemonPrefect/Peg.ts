/** 查看 CDN 缓存文件 - synccheck */
import { Command, path, colors, os, tty, ansi } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { bucketInit, chart, configInit, parseDogeURL, recurseLog } from "../common/utils.ts";


const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

interface options{
  url: boolean,
  include: string,
  exclude: string,
  recursive: boolean,

  configPath: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<bucket-uri> [option]")
  .description("Check the unsync cache of CDN")
  .example(
    "Check files",
    "./peg synccheck doge://bucket/fonts/ -r --include .*.otf doge://bucket/fonts2/"
  )
  .option("--exclude <exclude:string>", "Exclude files that meet the specified criteria")
  .option("--include <include:string>", "List files that meet the specified criteria")
  .option("-r, --recursive", "Set meta for objects recursively")
  .option("--url", "Print url only of files needed update cache")
  .arguments("[paths...]")

  .action(async(e, ...paths) => {
    const { url, include, exclude, recursive, configPath, secretId, secretKey } = e as unknown as options;

    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);
      

      for(const path of paths){
        if(!(path as string).startsWith("doge://")){
          throw new Error(`${path} is invalid.`);
        }

        const doge = parseDogeURL(path as string);
        const bucket = bucketInit(config, doge.bucket);
        const file = new File(config.getService(), bucket);
        let files: Array<IFile> = [] as Array<IFile>;
        if(!recursive){
          files = (await file.getFiles(doge.path)).files.filter((file) => !file.key.endsWith("/"));
        }else{
          files = await file.getFilesRecurse(doge.path, (key: string) => {
            recurseLog(`Walking ${key}`);
          });
        }
        files = file.filterFilesRemote(files, include, exclude);
        if(files.length === 0){
          console.log(warn("[WARN]"), `No file found in \`${doge.path}'!`);
          continue;
        }
        let body: Array<Array<string> | string> = [] as Array<Array<string> | string>;
        for(const task of files){
          tty.eraseLine;
          console.log(`Getting Sync Time of ${task.key}...${ansi.eraseLineEnd.toString()}`);
          tty.cursorUp(1);
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
          console.log(success("[SUCCESS]"), `No file unsync cached in \`${doge.path}'!${ansi.eraseLineEnd.toString()}`);
          continue;
        }else{
          console.log(success("[SUCCESS]"), `These files unsync cached in \`${doge.path}'!${ansi.eraseLineEnd.toString()}`);
        }
        if(url){
          for(const url of body){
            console.log(url);
          }
        }else{
          chart(["Key", "Last Modified", "Last Cached"], body as Array<Array<string>>, true, body.length).render();
        }
      }
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })