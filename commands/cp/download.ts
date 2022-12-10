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

export default async function download(config: Config, paths: Array<string>, options: any){
  const fullpath = path.resolve(paths[1]);
  let [dogeBucket, dogePath] = (paths[0] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
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
  if(files.length > 0 && fs.existsSync(fullpath) && fs.lstatSync(fullpath).isFile()){
    throw new Error(`File ${fullpath} occupied.`);
  }

  const tasks: Array<IFile> = [] as Array<IFile>;
  if(originalFileCount === 1){
    files[0].local = fullpath;
    tasks.push(files[0]);
  }else{
    for(const file of files){
      file.local = path.join(fullpath, file.key.replace(dogePath, ""));
      tasks.push(file);
    }
  }

  for(const task of tasks){
    await file.downloadFile(task); ///!!! sign
  }
}