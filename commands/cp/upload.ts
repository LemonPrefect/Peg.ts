import { tty, path, ansi, progress, walk, fs } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";

const bars = new progress.MultiProgressBar({
  title: "Uploading files",
  display: `[:bar] :text :percent :time :completed/:total${ansi.eraseLineEnd.toString()}`
});

export default async function upload(config: Config, paths: Array<string>, options: any){
  const fullpath = path.resolve(paths[0]);
  const [dogeBucket, dogePath] = (paths[1] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
  if(!dogeBucket){
    throw new Error(`dogeBucket: \`${dogeBucket}' or dogePath: \`${dogePath}' is invalid.`);
  }
  const bucket = config.getBucket(dogeBucket);
  if(!bucket){
    throw new Error(`Bucket \`${dogeBucket}' doesn't exist in config.`);
  }

  const file = new File(config.getService(), bucket);
  let files: Array<IFile> = [] as Array<IFile>;

  if(fs.lstatSync(fullpath).isFile()){
    if(!dogePath || dogePath.endsWith("/")){
      throw new Error("dogeurl should be a file.");
    }
    files.push({
      key: dogePath,
      local: fullpath
    } as IFile);
  }else if(fs.lstatSync(fullpath).isDirectory()){
    if(!dogePath || !dogePath.endsWith("/")){
      throw new Error("dogeurl should be a directory.");
    }
    
    for await (const entry of walk(fullpath, { maxDepth: options.recursive ? Infinity : 1 })){
      if(entry.isFile){
        files.push({
          key: path.posix.normalize(path.join(dogePath, path.posix.normalize(entry.path).replace(path.posix.normalize(fullpath), ""))).replaceAll("\\", "/"),
          local: entry.path
        } as IFile);
      }
    }
    
    files = file.filterFilesLocal(files, options.include, options.exclude);
  }else{
    throw new Error(`${fullpath} rather be a directory or a file to be upload.`);
  }
  if(options.sync){
    console.log(`Sync Hashing...${ansi.eraseLineEnd.toString()}`);
    tty.cursorUp(1);
    files = await file.syncFilter(files, options.signUrl === true, (file: IFile) => {
      tty.eraseLine;
      console.log(`Hashing ${file.local}...${ansi.eraseLineEnd.toString()}`);
      tty.cursorUp(1);
    });
  }

  let metas: Record<string, string> = {} as Record<string, string>;
  if(options.meta){
    let raw = ["Cache-Control", "Content-Disposition", "Content-Encoding", "Content-Type", "Expires", "Expect"];  
    for(const meta of options.meta){
      const [k, v] = meta.split(":");
      if(!k || !v){
        throw new Error(`Meta ${meta} is invalid.`);
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