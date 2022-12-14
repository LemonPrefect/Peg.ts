import { tty, path, ansi, progress } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";
import { File } from "../../../core/main/File.ts"
import { IFile } from "../../../core/interfaces/IFile.ts";

const bars = new progress.MultiProgressBar({
  title: "Copying files",
  display: "[:bar] :text :percent :time :completed/:total"
});

export default async function copy(config: Config, paths: Array<string>, options: any){

  const [sourceBucket, sourcePath] = (paths[0] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
  const [destinationBucket, destinationPath] = (paths[1] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
  
  if(!sourceBucket){
    throw new Error(`sourceBucket: \`${sourceBucket}' or sourcePath: \`${sourcePath}' is invalid.`);
  }
  if(!destinationBucket){
    throw new Error(`destinationBucket: \`${destinationBucket}' or sourcePath: \`${destinationPath}' is invalid.`);
  }
  
  const bucket = config.getBucket(sourceBucket);
  if(!bucket){
    throw new Error(`Bucket \`${sourceBucket}' doesn't exist in config.`);
  }

  const file = new File(config.getService(), bucket);
  let files: Array<IFile> = [] as Array<IFile>;
  files = (await file.getFiles(sourcePath)).files;  

  if(options.recursive){
    files = await file.getFilesRecurse(sourcePath, (key: string) => {
      tty.eraseLine;
      console.log(`Walking ${key}...${ansi.eraseLineEnd.toString()}`);
      tty.cursorUp(1);
    });
  }else{
    files = (await file.getFiles(sourcePath)).files.filter((file) => !file.key.endsWith("/"));
  }
  const originalFileCount = files.length;
  files = file.filterFilesRemote(files, options.include, options.exclude);

  const tasks: Array<IFile> = [] as Array<IFile>;
  if(originalFileCount === 1){
    files[0].local = destinationPath;
    tasks.push(files[0]);
  }else{
    for(const file of files){
      file.local = path.posix.join(destinationPath, file.key.replace(sourcePath, ""));
      tasks.push(file);
    }
  }
  for(const task of tasks){
    copying(`${sourceBucket}/${task.key} => ${destinationBucket}/${task.local}`, tasks.indexOf(task), tasks.length)
    await file.copyFile(task.key, task.local!, sourceBucket, destinationBucket);
    copying(`${sourceBucket}/${task.key} => ${destinationBucket}/${task.local}`, tasks.indexOf(task) + 1, tasks.length)
  }
}

function copying(file: string, index: number, total: number){
  bars.render([
    { completed: index, total: total, text: file },
  ]);
}