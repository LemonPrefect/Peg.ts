/** 获取文件哈希值 - hash
 * ./coscli hash <file-path> [--type <hash-type>]
 * https://www.tencentcloud.com/zh/document/product/436/43259
 */
import { Command, path, colors, os } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";
import { File } from "../../core/main/File.ts"
import { IFile } from "../../core/interfaces/IFile.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

interface options{
  signUrl: boolean,

  configPath: string,
  secretId: string,
  secretKey: string
}

export default await new Command()
  .usage("<path> [option]")
  .description("Calculate local file's hash-code or show cos file's hash-code")
  .example(
    "hash for `example.file' in test/ of bucket `example'",
    "./peg hash doge://example/test/example.file"
  )
  .option("-s, --sign-url", "Generate hash with OSS signed URL, CHARGED")
  .arguments("<location:string>")

  .action(async(e, location) => {
    let { signUrl, configPath, secretId, secretKey } = e as unknown as options;
    
    try{
      if(!(location as string).startsWith("doge://")){
        console.log(success("[SUCCESS]"), await File.getHashLocal({local: path.resolve(location as string)} as IFile));
        return;
      }
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }

    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }

    try{
      const config = new Config(configPath);
      Config.globalOverwrites(config, secretId, secretKey);

      const [dogeBucket, dogePath] = (location as string).match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
      if(dogePath.endsWith("/")){
        throw new Error(`${location} refers to a directory.`);
      }
      if(!dogeBucket){
        throw new Error(`dogeBucket: \`${dogeBucket}' or dogePath: \`${dogePath}' is invalid.`);
      }

      const bucket = config.getBucket(dogeBucket);
      if(!bucket){
        throw new Error(`Bucket \`${dogeBucket}' doesn't exist in config.`);
      }

      const file = new File(config.getService(), bucket);
      const files: Array<IFile> = (await file.getFiles(dogePath, 1)).files;
      if(files.length !== 1){
        throw new Error("No file found!");
      }
      console.log(success("[SUCCESS]"), await file.getHashRemote(files[0], signUrl));
      
      if(signUrl){
        console.log(warn("[WARN]"), "This hash is using sign-url which CHARGED for CNY0.5/GB/DAY");
      }
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })