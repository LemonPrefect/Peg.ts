/** 修改文件元数据 - meta */
import { Command, path, colors, os, Table, Row, Cell, tty, ansi, Input } from "./common/lib.ts";
import { Config } from "../core/main/Config.ts";
import { File } from "../core/main/File.ts"
import { IFile } from "../core/interfaces/IFile.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

interface options{
  meta: Array<string>,
  recursive: boolean,
  include: string,
  exclude: string,

  configPath: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<bucket-uri> [option]")
  .description("Set the control meta of files")
  .example(
    "Set meta and delete meta of files",
    './peg meta doge://bucket/1.txt doge://bucket/1.pptx --meta "-Cache-Control" --meta "Content-Type:text/plain"'
  )
  .example(
    "Set meta and delete meta of files recursively",
    './peg meta doge://bucket/ -r --include .*.otf --meta "-Cache-Control" --meta "Content-Type:text/plain"'
  )
  
  .option("--exclude <exclude:string>", "Exclude files that meet the specified criteria")
  .option("--include <include:string>", "List files that meet the specified criteria")
  .option("--meta <meta:string>", "Set the meta information of the file", {
    collect: true,
    required: true
  })
  .option("-r, --recursive", "Set meta for objects recursively")
  .arguments("[paths...]")

  .action(async(e, ...paths) => {
    let { exclude, include, meta, recursive, configPath, secretId, secretKey } = e as unknown as options;

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
          files = (await file.getFiles(dogePath)).files.filter(file => !file.key.endsWith("/"));
        }else{
          files = await file.getFilesRecurse(dogePath, (key: string) => {
            tty.eraseLine;
            console.log(`Walking ${key}...${ansi.eraseLineEnd.toString()}`);
            tty.cursorUp(1);
          });
        }
        files = file.filterFilesRemote(files, include, exclude);
        files = (await file.getFilesInfo(files.map(file => file.key)));
        if(files.length === 0){
          console.log(warn("[WARN]"), `No file found in \`${dogePath}'!`);
          continue;
        }

        const deleteKeys: Array<string> = [] as Array<string>;
        const addHeaders: Array<{key: string, value: string | number}> = [] as Array<{key: string, value: string | number}>;
        for(const header of meta){
          if(header.startsWith("-")){
            deleteKeys.push(header.slice(1));
          }else{
            const [k, v] = header.split(":");
            if(!k || !v){
              throw new Error(`${header} is invalid.`);
            }
            addHeaders.push({
              key: k,
              value: v
            })
          }
        }
        console.log(info("[INFO]"), "These files will be meta set!");
        let body: Array<Array<string>> = [] as Array<Array<string>>;
        for(const task of files){
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
        console.log(info("[INFO]"), "Metas are as follow: ");
        body = [];
        for(const key of deleteKeys){
          body.push(Row.from([
            key,
            "DELETE"
          ]).align("right"))
        }
        for(const header of addHeaders){
          body.push(Row.from([
            header.key,
            header.value.toString()
          ]).align("right"))
        }
        Table
        .from([
          ...body
        ])
        .header(Row.from(["Meta", "Change"]).border(false).align("center"))
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
          message: `Are you sure to set these meta? Enter \`set' to confirm`,
        });
        if(confirm !== "set"){
          console.log(error("[FAILED]"), `Files meta will NOT be set.`);
          continue;
        }
        for(const task of files){
          console.log(`Setting header for ${task.key}...${ansi.eraseLineEnd.toString()}`);
          tty.cursorUp(1);      
          file.setFileHeaders(task, addHeaders, deleteKeys);
        }
        console.log(success("[SUCCESS]"), `Files meta set for ${files.length} files in \`${dogePath}'${ansi.eraseLineEnd.toString()}`);
      }
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })