import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.167.0/node/fs.ts";
import { walk } from "https://deno.land/std@0.121.0/fs/walk.ts";
import * as progress from "https://deno.land/x/progress@v1.3.4/mod.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";

const bars = new progress.MultiProgressBar({
  title: "Uploading files",
  display: "[:bar] :text :percent :time :completed/:total"
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
          key: path.posix.join(dogePath, path.posix.normalize(entry.path).replace(path.posix.normalize(fullpath), "").replace("\\", "/")).replace("\\", "/"),
          local: entry.path
        } as IFile);
      }
    }
    files = file.filterFilesLocal(files, options.include, options.exclude);
  }else{
    throw new Error(`${fullpath} rather be a directory or a file to be upload.`);
  }
  return await file.uploadFiles(files, options.partSize, options.threadNum, uploading);
}

function uploading(file: string, index: number, total: number, complete: number){
  bars.render([
    { completed: complete, total: 100, text: file },
    { completed: index, total: total, text: "Total" },
  ]);
}