
import { Command, path } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { bucketInit, colorLog, configInit, parseDogeURL, progressInit, recurseLog } from "../common/utils.ts";
import { CommandError } from "../exceptions/CommandError.ts";
import i18n from "../common/i18n.ts";

interface options{
  exclude: string, 
  include: string,
  recursive: boolean,
  force: boolean,

  configPath: string,
  secretId: string,
  secretKey: string
}
const t = i18n();
const bars = progressInit(t("cliche.bars.move"));

export default await new Command()
  .usage("<source_path> <destination_path> [option]")
  .description(t("commands.mv.description"))
  .example(
    t("commands.mv.examples.moveFile"),
    "./peg mv doge://examplebucket1/example1.txt doge://examplebucket2/example2.txt"
  )
  .example(
    t("commands.mv.examples.moveFiles"),
    "./peg mv doge://examplebucket1/a doge://examplebucket2/b"
  )
  .arguments("[paths...]")


  .option("--exclude <exclude:string>", t("cliche.options.exclude"))
  .option("-f, --force", t("commands.mv.options.force"))
  .option("--include <include:string>", t("cliche.options.include"))
  .option("-r, --recursive", t("commands.mv.options.recursive"))

  .action(async(e, ...paths) => {
    const { exclude, include, recursive, force, configPath, secretId, secretKey } = e as unknown as options;
    
    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      if(paths.length !== 2 || !paths[0].startsWith("doge://") || !paths[1].startsWith("doge://")){
        throw new CommandError(t("cliche.errors.argsInvalid", { paths }), "error");
      }

      const source = parseDogeURL((paths[0] as string));
      const destination = parseDogeURL((paths[1] as string));
      const bucket = bucketInit(config, source.bucket);    
      const file = new File(config.getService(), bucket);
      let files: Array<IFile> = [] as Array<IFile>;
      files = (await file.getFiles(source.path)).files;  
    
      if(recursive){
        files = await file.getFilesRecurse(source.path, (key: string) => {
          recurseLog(t("cliche.recurse.walking", { key }));
        });
      }else{
        files = (await file.getFiles(source.path)).files.filter((file) => !file.key.endsWith("/"));
      }
      const originalFileCount = files.length;
      files = file.filterFilesRemote(files, include, exclude);
    
      const tasks: Array<IFile> = [] as Array<IFile>;
      if(originalFileCount === 1){
        files[0].local = destination.path;
        tasks.push(files[0]);
      }else{
        for(const file of files){
          file.local = path.posix.join(destination.path, file.key.replace(source.path, ""));
          tasks.push(file);
        }
      }
      for(const task of tasks){
        moving(`${source.bucket}/${task.key} => ${destination.bucket}/${task.local}`, tasks.indexOf(task), tasks.length)
        await file.moveFile(task.key, task.local!, source.bucket, destination.bucket, force);
        moving(`${source.bucket}/${task.key} => ${destination.bucket}/${task.local}`, tasks.indexOf(task) + 1, tasks.length)
      }    
    }catch(e){
      colorLog("error", e.message);
    }
  })

function moving(file: string, index: number, total: number){
  bars.render([
    { completed: index, total: total, text: file },
  ]);
}