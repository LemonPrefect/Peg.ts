import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { Config } from "../../core/main/Config.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import { Table, Row, Cell } from "https://deno.land/x/cliffy@v0.25.5/table/mod.ts";
import { tty } from "https://deno.land/x/cliffy@v0.25.5/ansi/tty.ts";
import { ansi } from "https://deno.land/x/cliffy@v0.25.5/ansi/ansi.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import * as fs from "https://deno.land/std@0.167.0/node/fs.ts";
import { walk } from "https://deno.land/std@0.121.0/fs/walk.ts";
import { FileService } from "../../core/services/file.service.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export default async function upload(config: Config, paths: Array<string>, options: any){
  const fullpath = path.resolve(paths[0]);
  let [dogeBucket, dogePath] = (paths[1] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
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
          key: entry.name,
          local: entry.path
        } as IFile);
      }
    }
    files = file.filterFilesLocal(files, options.include, options.exclude);
  }else{
    throw new Error(`${fullpath} rather be a directory or a file to be upload.`);
  }
  return await file.uploadFiles(files);
}