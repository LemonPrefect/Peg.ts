import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import { tty } from "https://deno.land/x/cliffy@v0.25.5/ansi/tty.ts";
import { ansi } from "https://deno.land/x/cliffy@v0.25.5/ansi/ansi.ts";
import * as fs from "https://deno.land/std@0.167.0/node/fs.ts";
import * as progress from "https://deno.land/x/progress@v1.3.4/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";

const bars = new progress.MultiProgressBar({
  title: "Downloading files",
  display: "[:bar] :text :percent :time :completed/:total"
});
const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};


export default async function download(config: Config, paths: Array<string>, options: any){
  const fullpath = path.resolve(paths[1]);
  const [dogeBucket, dogePath] = (paths[0] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
  if(!dogeBucket){
    throw new Error(`dogeBucket: \`${dogeBucket}' or dogePath: \`${dogePath}' is invalid.`);
  }
  const bucket = config.getBucket(dogeBucket);
  if(!bucket){
    throw new Error(`Bucket \`${dogeBucket}' doesn't exist in config.`);
  }

  const file = new File(config.getService(), bucket);
  let files: Array<IFile> = [] as Array<IFile>;

  if(options.recursive){
    files = await file.getFilesRecurse(dogePath, (key: string) => {
      tty.eraseLine;
      console.log(`Walking ${key}...${ansi.eraseLineEnd.toString()}`);
      tty.cursorUp(1);
    });
  }else{
    files = (await file.getFiles(dogePath)).files.filter((file) => !file.key.endsWith("/"));
  }
  const originalFileCount = files.length;
  files = file.filterFilesRemote(files, options.include, options.exclude);

  // Download a directory but the path is used by a file.
  if(files.length > 1 && fs.existsSync(fullpath) && fs.lstatSync(fullpath).isFile()){
    throw new Error(`File ${fullpath} occupied.`);
  }

  let tasks: Array<IFile> = [] as Array<IFile>;
  if(originalFileCount === 1){
    files[0].local = fullpath;
    tasks.push(files[0]);
  }else{
    for(const file of files){
      file.local = path.join(fullpath, file.key.replace(dogePath, ""));
      tasks.push(file);
    }
  }

  if(options.sync){
    tasks = await file.syncFilter(tasks, options.signUrl === true);
  }
  if(options.signUrl){
    console.log(warn("[WARN]"), "This url is CHARGED for CNY0.5/GB/DAY");
  }

  for(const task of tasks){
    let size;
    try{
      size = fs.lstatSync(task.local!).size;
    }catch{
      size = 0;
    }
    if(options.sync){
      size = 0;
    }
    downloading(`${task.key} => ${task.local}`, tasks.indexOf(task), tasks.length, task.size, size);
    await file.downloadFile(task, options.signUrl);
    size = fs.lstatSync(task.local!).size;
    downloading(`${task.key} => ${task.local}`, tasks.indexOf(task) + 1, tasks.length, task.size, size);
  }
}

function downloading(file: string, index: number,  total: number, size: number, complete: number){
  if(complete === 0 && size == 0){ // For empty files not breaking bars.
    complete++;
    size++;
  }
  bars.render([
    { completed: complete, total: size, text: file },
    { completed: index, total: total, text: "Total" }
  ]);
}