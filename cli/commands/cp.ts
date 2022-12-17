/** 上传下载或拷贝文件 - cp
 * ./coscli cp <source_path> <destination_path> [option]
 * https://cloud.tencent.com/document/product/436/63669
 */
import { Command } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { colorLog, configInit } from "../common/utils.ts";
import download from "./cp/download.ts";
import upload from "./cp/upload.ts";
import copy from "./cp/copy.ts";
import i18n from "../common/i18n.ts";
import { CommandError } from "../exceptions/CommandError.ts";

export interface options{
  exclude: string, 
  include: string, 
  partSize: number, 
  threadNum: number,  
  recursive: boolean,
  signUrl: boolean,
  sync: boolean,
  meta: Array<string>

  configPath: string,
  secretId: string,
  secretKey: string
}
const t = i18n();

export default await new Command()
  .usage("<source_path> <destination_path> [option]")
  .description(t("commands.cp.description"))
  .example(
    t("commands.cp.examples.upload"),
    "./peg cp ~/example.txt doge://examplebucket/example.txt"
  )
  .example(
    t("commands.cp.examples.download"),
    "./peg cp doge://examplebucket/example.txt ~/example.txt"
  )
  .example(
    t("commands.cp.examples.copy"),
    "./peg cp doge://examplebucket1/example1.txt doge://examplebucket2/example2.txt"
  )
  
  .arguments("[paths...]")

  .option("--exclude <exclude:string>", t("cliche.options.exclude"))
  .option("--include <include:string>", t("cliche.options.include"))
  .option("--meta <meta:string>", t("commands.cp.options.meta"), {
    collect: true
  })
  .option("--part-size <partSize:number>", t("commands.cp.options.partSize"), {
    default: 32
  })
  .option("-r, --recursive", t("commands.cp.options.recursive"))
  .option("-s, --sign-url", t("commands.cp.options.signURL"))
  .option("--sync", t("commands.cp.options.sync"))
  .option("--thread-num <threadNum:number>", t("commands.cp.options.threadNum"), {
    default: 5
  })

  .action(async(e, ...paths) => {
    const { configPath, secretId, secretKey } = e as unknown as options;
    
    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      if(paths.length !== 2){
        throw new CommandError(t("cliche.errors.argsInvalid", { paths }), "error");
      }

      if(paths[0].startsWith("doge://") && !paths[1].startsWith("doge://")){
        return await download(config, paths, e as unknown as options);
      }else if(!paths[0].startsWith("doge://") && paths[1].startsWith("doge://")){
        return await upload(config, paths, e as unknown as options);
      }else if(paths[0].startsWith("doge://") && paths[1].startsWith("doge://")){
        return await copy(config, paths, e as unknown as options);
      }else{
        throw new CommandError(t("cliche.errors.argsInvalid", { paths }), "error");
      }
    }catch(e){
      colorLog("error", e.message);
    }
  })