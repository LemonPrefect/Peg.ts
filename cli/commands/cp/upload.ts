import { tty, path, walk, fs } from "../../common/lib.ts";
import { Config } from "../../../core/main/Config.ts";
import { File } from "../../../core/main/File.ts"
import { IFile } from "../../../core/interfaces/IFile.ts";
import { bucketInit, colorLog, parseDogeURL, progressInit, recurseLog } from "../../common/utils.ts";
import i18n from "../../common/i18n.ts";
import { CommandError } from "../../exceptions/CommandError.ts";

const t = i18n();
const bars = progressInit(t("cliche.bars.upload"));

export default async function upload(config: Config, paths: Array<string>, options: any){
  const fullpath = path.resolve(paths[0]);
  const destination = parseDogeURL((paths[1] as string));
  const bucket = bucketInit(config, destination.bucket);
  const file = new File(config.getService(), bucket);
  let files: Array<IFile> = [] as Array<IFile>;

  if(fs.lstatSync(fullpath).isFile()){
    if(!destination.path || destination.path.endsWith("/")){
      throw new CommandError(t("commands.cp.errors.urlShouldBeFile"), "error");
    }
    files.push({
      key: destination.path,
      local: fullpath
    } as IFile);
  }else if(fs.lstatSync(fullpath).isDirectory()){
    if(!destination.path || !destination.path.endsWith("/")){
      throw new CommandError(t("commands.cp.errors.urlShouldBeDir"), "error");
    }
    
    for await (const entry of walk(fullpath, { maxDepth: options.recursive ? Infinity : 1 })){
      recurseLog(t("cliche.recurse.walking", { key: entry.path }));
      if(entry.isFile){
        files.push({
          key: path.posix.normalize(path.join(destination.path, path.posix.normalize(entry.path).replace(path.posix.normalize(fullpath), ""))).replaceAll("\\", "/"),
          local: entry.path
        } as IFile);
      }
    }
    
    files = file.filterFilesLocal(files, options.include, options.exclude);
  }else{
    throw new CommandError(t("commands.cp.errors.pathInvalid", { fullpath }), "error");
  }
  if(options.sync){
    colorLog("info", t("commands.cp.logs.syncHashing"));
    tty.cursorUp(1);
    files = await file.syncFilter(files, options.signUrl === true, (file: IFile) => {
      recurseLog(t("cliche.recurse.hashing", { key: file.local }));
    });
  }

  const metas: Record<string, string> = {} as Record<string, string>;
  if(options.meta){
    const raw = ["Cache-Control", "Content-Disposition", "Content-Encoding", "Content-Type", "Expires", "Expect"];  
    for(const meta of options.meta){
      const [k, v] = meta.split(":");
      if(!k || !v){
        throw new CommandError(t("commands.cp.errors.metaInvalid", { meta }), "error");
      }
      if(raw.includes(k)){
        metas[k.replace("-", "")] = v;
      }else{
        metas[`x-cos-meta-${k}`] = v;
      }
    }
  }
  return await file.uploadFiles(files, options.partSize, options.threadNum, metas, uploading);
}

function uploading(file: string, index: number, total: number, complete: number){
  if(complete === 100){
    complete -= 0.0001; // For the progress don't `end'.
  }
  bars.render([
    { completed: complete, total: 100, text: file },
    { completed: index, total: total, text: "Total" },
  ]);
}