/** 查看 CDN 缓存文件 - synccheck */
import { Command, path, colors, os, Table, Row, Cell, tty, ansi } from "./common/lib.ts";
import { Config } from "../core/main/Config.ts";
import { File } from "../core/main/File.ts"
import { IFile } from "../core/interfaces/IFile.ts";

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
    let { url, include, exclude, recursive, configPath, secretId, secretKey } = e as unknown as options;

    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }

    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, secretId, secretKey);
      

      for(const path of paths){
        if(!(path as string).startsWith("doge://")){
          throw new Error(`${path} is invalid.`);
        }

        const [dogeBucket, dogePath] = (path as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
        if(!dogeBucket){
          throw new Error(`dogeBucket: \`${dogeBucket}' or dogePath: \`${dogePath}' is invalid.`);
        }
        
        const bucket = config.getBucket(dogeBucket);
        if(!bucket){
          throw new Error(`Bucket \`${dogeBucket}' doesn't exist in config.`);
        }

        const file = new File(config.getService(), bucket);
        let files: Array<IFile> = [] as Array<IFile>;
        if(!recursive){
          files = [...(await file.getFiles(dogePath)).files.filter((file) => !file.key.endsWith("/")), ...files];
        }else{
          files = [...await file.getFilesRecurse(dogePath, (key: string) => {
            tty.eraseLine;
            console.log(`Walking ${key}...${ansi.eraseLineEnd.toString()}`);
            tty.cursorUp(1);
          }), ...files];
        }
        files = file.filterFilesRemote(files, include, exclude);
        if(files.length === 0){
          console.log(warn("[WARN]"), `No file found in \`${dogePath}'!`);
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
              body.push(Row.from([
                task.key,
                task.time,
                cacheTime
              ]).align("right"));
            }
          }
        }
        if(body.length === 0){
          console.log(success("[SUCCESS]"), `No file unsync cached in \`${dogePath}'!${ansi.eraseLineEnd.toString()}`);
          continue;
        }else{
          console.log(success("[SUCCESS]"), `These files unsync cached in \`${dogePath}'!${ansi.eraseLineEnd.toString()}`);
        }
        if(url){
          for(const url of body){
            console.log(url);
          }
        }else{
          Table
          .from([
            ...body as Array<Array<string>>,
            Row.from([new Cell("Total Objects:").colSpan(2).align("right"), new Cell(body.length)]).border(false)
          ])
          .header(Row.from(["Key", "Last Modified", "Last Cached"]).border(false).align("center"))
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
        }
      }
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })