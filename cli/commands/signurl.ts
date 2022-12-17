/** 获取预签名 URL - signurl
 * ./coscli signurl cos://<bucketAlias>/<key> [flag]
 * https://tencentcloud.com/zh/document/product/436/43263
 */
import { Command } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";
import { bucketInit, colorLog, configInit, parseDogeURL } from "../common/utils.ts";
import { CommandError } from "../exceptions/CommandError.ts";
import i18n from "../common/i18n.ts";

interface options{
  configPath: string,
  secretId: string,
  secretKey: string
}
const t = i18n();

export default await new Command()
  .usage("<bucket-uri> [option]")
  .description(t("commands.signurl.description"))
  .example(
    t("commands.signurl.examples.signurl"),
    "./peg signurl doge://example/test/example.file"
  )
  
  .arguments("<location:string>")

  .action(async(e, location) => {
    const { configPath, secretId, secretKey } = e as unknown as options;
    
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
        throw new CommandError(t("cliche.errors.noFileFound", { path: doge.path }), "error");
      }
      colorLog("done", await file.getUrl(files[0], true));
      colorLog("warn", t("cliche.chargeTip"));

    }catch(e){
      colorLog("error", e.message);
    }
  })