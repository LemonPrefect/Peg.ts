import { tty, path, ansi, progress } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";
import { File } from "../../../core/main/File.ts"
import { IFile } from "../../../core/interfaces/IFile.ts";
import { bucketInit, parseDogeURL, progressInit } from "../../common/utils.ts";

const bars = progressInit("Copying files");

export default async function copy(config: Config, paths: Array<string>, options: any){
  const source = parseDogeURL((paths[0] as string));
  const destination = parseDogeURL((paths[1] as string));
  const bucket = bucketInit(config, source.bucket);
  const file = new File(config.getService(), bucket);
  let files: Array<IFile> = [] as Array<IFile>;
  files = (await file.getFiles(source.path)).files;  

  if(options.recursive){
    files = await file.getFilesRecurse(source.path, (key: string) => {
      tty.eraseLine;
      console.log(`Walking ${key}...${ansi.eraseLineEnd.toString()}`);
      tty.cursorUp(1);
    });
  }else{
    files = (await file.getFiles(source.path)).files.filter((file) => !file.key.endsWith("/"));
  }
  const originalFileCount = files.length;
  files = file.filterFilesRemote(files, options.include, options.exclude);

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
    copying(`${source.bucket}/${task.key} => ${destination.bucket}/${task.local}`, tasks.indexOf(task), tasks.length)
    await file.copyFile(task.key, task.local!, source.bucket, destination.bucket);
    copying(`${source.bucket}/${task.key} => ${destination.bucket}/${task.local}`, tasks.indexOf(task) + 1, tasks.length)
  }
}

function copying(file: string, index: number, total: number){
  bars.render([
    { completed: index, total: total, text: file },
  ]);
}