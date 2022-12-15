/** 获取文件哈希值 - hash
 * ./coscli hash <file-path> [--type <hash-type>]
 * https://www.tencentcloud.com/zh/document/product/436/43259
 */
import { Command, path } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { bucketInit, colorLog, configInit, parseDogeURL } from "../common/utils.ts";
import i18n from "../common/i18n.ts";
import { CommandError } from "../exceptions/CommandError.ts";

interface options{
  signUrl: boolean,

  configPath: string,
  secretId: string,
  secretKey: string
}
const t = i18n();

export default await new Command()
  .usage("<path> [option]")
  .description(t("commands.hash.description"))
  .example(
    t("commands.hash.description"),
    "./peg hash doge://example/test/example.file"
  )
  .option("-s, --sign-url", t("commands.hash.options.signURL"))
  .arguments("<location:string>")

  .action(async(e, location) => {
    let { signUrl, configPath, secretId, secretKey } = e as unknown as options;
    
    try{
      if(!(location as string).startsWith("doge://")){
        colorLog("done", await File.getHashLocal({local: path.resolve(location as string)} as IFile));
        return;
      }
    }catch(e){
      colorLog("error", e.message);
    }

    try{
      const config = configInit(configPath);
      Config.globalOverwrites(config, secretId, secretKey);
      const doge = parseDogeURL(location as string);
      if(doge.path.endsWith("/")){
        throw new CommandError(t("cliche.errors.refersToDir", { location }), "error");
      }
      const bucket = bucketInit(config, doge.bucket);
      const file = new File(config.getService(), bucket);
      const files: Array<IFile> = (await file.getFiles(doge.path, 1)).files;
      if(files.length !== 1){
        throw new CommandError(t("commands.hash.errors.noFileFound", { location }), "error");
      }
      colorLog("done", await file.getHashRemote(files[0], signUrl) ?? t("commands.hash.logs.noHash"));
      
      if(signUrl){
        colorLog("warn", t("cliche.chargeTip"));
      }
    }catch(e){
      colorLog("error", e.message);
    }
  })