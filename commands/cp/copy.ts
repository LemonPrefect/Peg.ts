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

export default async function copy(config: Config, paths: Array<string>, options: any){

  let [sourceBucket, sourcePath] = (paths[0] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
  let [destinationBucket, destinationPath] = (paths[1] as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
  
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
    file.copyFile(task.key, task.local!, sourceBucket, destinationBucket);
  }
}