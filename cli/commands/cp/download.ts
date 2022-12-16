import { tty, path, fs } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";
import { File } from "../../../core/main/File.ts"
import { IFile } from "../../../core/interfaces/IFile.ts";
import { bucketInit, colorLog, parseDogeURL, progressInit, recurseLog } from "../../common/utils.ts";
import i18n from "../../common/i18n.ts";
import { CommandError } from "../../exceptions/CommandError.ts";
import { options } from "../cp.ts";

const t = i18n();
const bars = progressInit(t("cliche.bars.download"));

export default async function download(config: Config, paths: Array<string>, options: options){
  const fullpath = path.resolve(paths[1]);
  const source = parseDogeURL((paths[0] as string));
  const bucket = bucketInit(config, source.bucket);
  const file = new File(config.getService(), bucket);
  let files: Array<IFile> = [] as Array<IFile>;

  if(options.recursive){
    files = await file.getFilesRecurse(source.path, (key: string) => {
      recurseLog(t("cliche.recurse.walking", { key }));
    });
  }else{
    files = (await file.getFiles(source.path)).files.filter((file) => !file.key.endsWith("/"));
  }
  const originalFileCount = files.length;
  files = file.filterFilesRemote(files, options.include as string, options.exclude as string);

  // Download a directory but the path is used by a file.
  if(files.length > 1 && fs.existsSync(fullpath) && fs.lstatSync(fullpath).isFile()){ ///fix fs => to service?
    throw new CommandError(t("command.cp.errors.fileOccupied"), "error");
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
    colorLog("info", t("command.cp.logs.syncHashing"));
    tty.cursorUp(1);
    tasks = await file.syncFilter(tasks, options.signUrl === true, (file: IFile) => {
      recurseLog(t("cliche.recurse.hashing", { key: file.key }));
    });
  }
  if(files.length === 0){
    throw new CommandError(t("command.cp.errors.noFileToDownload"), "error");
  }
  if(options.signUrl){
    colorLog("warn", t("cliche.chargeTip"));
  }
  for(const task of tasks){
    await file.downloadFile(task, options.signUrl as boolean, (e: number, c: number) => {
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