/** 修改文件元数据 - meta */
import { Command, tty, Input } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { bucketInit, chart, colorLog, configInit, parseDogeURL, recurseLog } from "../common/utils.ts";
import i18n from "../common/i18n.ts";
import { CommandError } from "../exceptions/CommandError.ts";

interface options{
  meta: Array<string>,
  recursive: boolean,
  include: string,
  exclude: string,

  configPath: string,
  secretId: string,
  secretKey: string
}
const t = i18n();

export default await new Command()
  .usage("<bucket-uri> [option]")
  .description(t("commands.meta.description"))
  .example(
    t("commands.meta.examples.metaSetSome"),
    './peg meta doge://bucket/1.txt doge://bucket/1.pptx --meta "-Cache-Control" --meta "Content-Type:text/plain"'
  )
  .example(
    t("commands.meta.examples.metaSetRecurse"),
    './peg meta doge://bucket/ -r --include .*.otf --meta "-Cache-Control" --meta "Content-Type:text/plain"'
  )
  
  .option("--exclude <exclude:string>", t("cliche.options.exclude"))
  .option("--include <include:string>", t("cliche.options.include"))
  .option("--meta <meta:string>", t("commands.meta.options.meta"), {
    collect: true,
    required: true
  })
  .option("-r, --recursive", t("commands.meta.options.recursive"))
  .arguments("[paths...]")

  .action(async(e, ...paths) => {
    const { exclude, include, meta, recursive, configPath, secretId, secretKey } = e as unknown as options;

    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      for(const path of paths){
        if(!(path as string).startsWith("doge://")){
          throw new CommandError(t("cliche.errors.pathInvalid", { path }), "error");
        }
        
        const doge = parseDogeURL(path as string);
        const bucket = bucketInit(config, doge.bucket);
        const file = new File(config.getService(), bucket);
        let files: Array<IFile> = [] as Array<IFile>;
        if(!recursive){
          files = (await file.getFiles(doge.path)).files.filter(file => !file.key.endsWith("/"));
        }else{
          files = await file.getFilesRecurse(doge.path, (key: string) => {
            recurseLog(t("cliche.recurse.walking", { key }));
          });
        }
        files = file.filterFilesRemote(files, include, exclude);
        files = (await file.getFilesInfo(files.map(file => file.key)));
        if(files.length === 0){
          colorLog("warn", t("cliche.errors.noFileFound", { path: doge.path }));
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
              throw new CommandError(t("commands.meta.errors.headerInvalid", { header }), "error");
            }
            addHeaders.push({
              key: k,
              value: v
            })
          }
        }
        colorLog("info", t("commands.meta.logs.metaSetPre"));
        let body: Array<Array<string>> = [] as Array<Array<string>>;
        for(const task of files){
          body.push([
            task.key,
            task.key.endsWith("/") ? "dir" : "standard",
            task.time,
            File.formatBytes(task.size),
          ])
        }
        chart([
          t("charts.bucket.name"), 
          t("charts.bucket.alias"), 
          t("charts.bucket.region"), 
          t("charts.bucket.endpoint")  
        ], body, true, files.length).render();
        colorLog("info", t("commands.meta.logs.metaIndicator"));
        body = [];
        for(const key of deleteKeys){
          body.push([
            key,
            "-"
          ]);
        }
        for(const header of addHeaders){
          body.push([
            header.key,
            header.value.toString()
          ]);
        }
        chart([
          t("charts.meta.meta"), 
          t("charts.meta.change"), 
        ], body, true, -1).render();

        const confirm: string = await Input.prompt({
          message: t("commands.meta.logs.metaSetQuestion"),
        });
        if(confirm !== "set"){
          colorLog("error", t("commands.meta.errors.checkFailed"));
          continue;
        }
        for(const task of files){///
          colorLog("info", t("commands.meta.logs.metaSeting", { key: task.key }));
          tty.cursorUp(1);      
          file.setFileHeaders(task, addHeaders, deleteKeys);
        }
        colorLog("done", t("commands.meta.logs.metaSet", { length: files.length, path: doge.path }));
      }
    }catch(e){
      colorLog("error", e.message);
    }
  })