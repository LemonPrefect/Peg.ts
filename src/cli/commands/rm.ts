/** 删除文件 - rm
 * ./coscli rm cos://<bucketAlias>[/prefix/] [cos://<bucket-name>[/prefix/]...] [flag]
 * https://www.tencentcloud.com/zh/document/product/436/43258
 */
import { Command, Input } from "../common/lib.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { Config } from "../../core/main/Config.ts";
import { bucketInit, chart, colorLog, configInit, parseDogeURL, recurseLog } from "../common/utils.ts";
import i18n from "../common/i18n.ts";
import { CommandError } from "../exceptions/CommandError.ts";

interface options{
  exclude: string, 
  include: string,
  force: boolean,
  recursive: boolean,

  configPath: string,
  secretId: string,
  secretKey: string
}
const t = i18n();

export default await new Command()
  .usage("<bucket-uri> [option]")
  .description(t("commands.rm.description"))
  .example(
    t("commands.rm.examples.deleteAllFile"),
    "./peg rm doge://example/test/ -r"
  )
  
  .arguments("[paths...]")

  .option("--exclude <exclude:string>", t("cliche.options.exclude"))
  .option("--include <include:string>", t("cliche.options.include"))
  .option("-r, --recursive", t("commands.rm.options.recursive"))

  .action(async(e, ...paths) => {
    const { exclude, include, recursive, configPath, secretId, secretKey } = e as unknown as options;
    
    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      for(const dogeurl of paths){ ///dogeurl???
        const doge = parseDogeURL(dogeurl as string);
        const bucket = bucketInit(config, doge.bucket);
        const file = new File(config.getService(), bucket);
        let tasks: Array<IFile> = [] as Array<IFile>;

        if(doge.path.endsWith("/") && !recursive){
          throw new CommandError(t("commands.rm.errors.refersToDir", { location: dogeurl}), "error");
        }

        if(recursive){
          tasks = await file.getFilesRecurse(doge.path, (key: string) => {
            recurseLog(t("cliche.recurse.walking", { key }));
          });
        }else{
          tasks = (await file.getFiles(doge.path)).files.filter((file) => !file.key.endsWith("/"));
        }
        tasks = file.filterFilesRemote(tasks, include, exclude);
        if(tasks.length === 0){
          throw new CommandError(t("cliche.errors.noFileFound", { path: doge.path }), "error");
        }
        colorLog("warn", t("commands.rm.logs.deletePre"));
        const body: Array<Array<string>> = [] as Array<Array<string>>;
        for(const task of tasks){
          body.push([
            task.key,
            task.key.endsWith("/") ? "dir" : "standard",
            task.time,
            File.formatBytes(task.size)
          ])
        }
        chart([
          t("charts.file.key"),
          t("charts.file.type"),
          t("charts.file.lastModified"),
          t("charts.file.size")  
        ], body, true, tasks.length).render();
        const confirm: string = await Input.prompt({
          message: t("commands.rm.logs.deleteConfirm"),
        });
        if(confirm !== "delete"){
          colorLog("error", t("commands.rm.errors.checkFailed"));
          return;
        }
        await file.deleteFiles(tasks);
        colorLog("done", t("commands.rm.logs.deleted"));
      }
    }catch(e){
      colorLog("error", e.message);
    }
  })