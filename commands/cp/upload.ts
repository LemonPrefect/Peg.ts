import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.167.0/node/fs.ts";
import { walk } from "https://deno.land/std@0.121.0/fs/walk.ts";
import { tty } from "https://deno.land/x/cliffy@v0.25.5/ansi/tty.ts";
import { ansi } from "https://deno.land/x/cliffy@v0.25.5/ansi/ansi.ts";
import * as progress from "https://deno.land/x/progress@v1.3.4/mod.ts";
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

  return await file.uploadFiles(files, options.partSize, options.threadNum, uploading);
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