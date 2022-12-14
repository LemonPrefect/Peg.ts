import { tty, path, ansi, progress, colors, fs } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";
import { File } from "../../../core/main/File.ts"
import { IFile } from "../../../core/interfaces/IFile.ts";
import { bucketInit, parseDogeURL, progressInit } from "../../common/utils.ts";

const bars = progressInit("Downloading files");
const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};


export default async function download(config: Config, paths: Array<string>, options: any){
  const fullpath = path.resolve(paths[1]);
  const source = parseDogeURL((paths[0] as string));
  const bucket = bucketInit(config, source.bucket);
  const file = new File(config.getService(), bucket);
  let files: Array<IFile> = [] as Array<IFile>;

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

  // Download a directory but the path is used by a file.
  if(files.length > 1 && fs.existsSync(fullpath) && fs.lstatSync(fullpath).isFile()){
    throw new Error(`File ${fullpath} occupied.`);
  }

  let tasks: Array<IFile> = [] as Array<IFile>;
  if(originalFileCount === 1 && !source.path.endsWith("/")){
    files[0].local = fullpath;
    tasks.push(files[0]);
  }else{
    for(const file of files){
      file.local = path.join(fullpath, file.key.replace(source.path, ""));
      tasks.push(file);
    }
  }

  if(options.sync){
    console.log(`Sync Hashing...${ansi.eraseLineEnd.toString()}`);
    tty.cursorUp(1);
    tasks = await file.syncFilter(tasks, options.signUrl === true, (file: IFile) => {
      tty.eraseLine;
      console.log(`Hashing ${file.key}...${ansi.eraseLineEnd.toString()}`);
      tty.cursorUp(1);
    });
  }
  if(files.length === 0){
    throw new Error("No file found.");
  }
  if(options.signUrl){
    console.log(warn("[WARN]"), "This url is CHARGED for CNY0.5/GB/DAY");
  }
  for(const task of tasks){
    await file.downloadFile(task, options.signUrl, (e: number, c: number) => {
      downloading(`${task.key} => ${task.local}`, tasks.indexOf(task) + c, tasks.length, task.size, e);
    }); // qps limit!
  }
}

function downloading(file: string, index: number,  total: number, size: number, complete: number){
  if(complete === 0 && size == 0){ // For empty files not breaking bars.
    complete++;
    size++;
  }
  if(complete === size){ // For the progress don't `end'.
    complete--;
  }
  bars.render([
    { completed: complete, total: size, text: file },
    { completed: index, total: total, text: "Total" }
  ]);
}