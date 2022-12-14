
import { Command, path, colors, os, tty, ansi, progress } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { bucketInit, configInit, parseDogeURL, progressInit, recurseLog } from "../common/utils.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

const bars = progressInit("Moving files");

interface options{
  exclude: string, 
  include: string,
  recursive: boolean,
  force: boolean,

  configPath: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<source_path> <destination_path> [option]")
  .description("Move objects")
  .example(
    "Move file",
    "./peg mv doge://examplebucket1/example1.txt doge://examplebucket2/example2.txt"
  )
  .example(
    "Move files from a to b",
    "./peg mv doge://examplebucket1/a doge://examplebucket2/b"
  )
  .arguments("[paths...]")


  .option("--exclude <exclude:string>", "Exclude files that meet the specified criteria")
  .option("-f, --force", "Move file overwritely")
  .option("--include <include:string>", "Exclude files that meet the specified criteria")
  .option("-r, --recursive", "Move objects recursively")

  .action(async(e, ...paths) => {
    const { exclude, include, recursive, force, configPath, secretId, secretKey } = e as unknown as options;
    
    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      if(paths.length !== 2 || !paths[0].startsWith("doge://") || !paths[1].startsWith("doge://")){
        throw new Error(`Arg(s) \`${paths}' are invalid.`);
      }

      const source = parseDogeURL((paths[0] as string));
      const destination = parseDogeURL((paths[1] as string));
      const bucket = bucketInit(config, source.bucket);    
      const file = new File(config.getService(), bucket);
      let files: Array<IFile> = [] as Array<IFile>;
      files = (await file.getFiles(source.path)).files;  
    
      if(recursive){
        files = await file.getFilesRecurse(source.path, (key: string) => {
          recurseLog(`Walking ${key}`);
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
      console.log(error("[ERROR]"), e.message);
    }
  })

function moving(file: string, index: number, total: number){
  bars.render([
    { completed: index, total: total, text: file },
  ]);
}