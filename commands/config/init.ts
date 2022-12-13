/** 交互式地生成配置文件 - config init
 * ./coscli config init
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command, colors, path, os, Table, Input } from "../common/lib.ts";
import { Config } from "../../core/main/Config.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export default await new Command()
  .usage("[option]")
  .description("Used to interactively generate the configuration file")
  .example("Format", "./peg config init [-c <config-file-path>]")
  .example("Init a config file in ./1.yaml", "./peg config init -c ./1.yaml")
  
  .action(async(e) => {
    let {configPath} = e as unknown as {configPath: string};
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
      const _: string = await Input.prompt({
        message: `Specify the path of the configuration file: (now:${configPath})`,
      }) ?? configPath;
      configPath = _ ? _ : configPath;
    }else{
      console.log(`Configuration file path: ${configPath}`);
    }
    const accessId: string = await Input.prompt({
      message: "Input Your Secret ID:",
    });
    const accessKey: string = await Input.prompt({
      message: "Input Your Secret Key:",
    });
    const alias: string = await Input.prompt({
      message: `Input Bucket's Alias:`,
    });
    try{
      Config.init(configPath);
      const config = new Config(configPath);
      config.setCredentials(accessId, accessKey);
      config.setDogeEndpoint("https", "api.dogecloud.com");
      console.log(`Configuration file path: ${configPath}`);
      console.log("Basic Configuration Information: ");
      new Table()
      .body([
        ["Secret ID", config.getConfig().secretId],
        ["Secret Key", config.getConfig().secretKey],
      ])
      .border(true)
      .render();
      if(await config.addBucket(alias)){
        const bucket = config.getBucket(alias);
        if(!bucket){
          console.log(warn("[WARN]"), `Bucket \`${alias}' add FAILED.`);
        }else{
          console.log(success("[SUCCESS]"), `Bucket \`${alias}' added, config filename ${configPath}`);
        }
        new Table()
          .header(["Name", "Alias", "Region", "Endpoint"])
          .body([
            [config.getBucket(alias)!.name, config.getBucket(alias)!.alias, config.getBucket(alias)!.region, config.getBucket(alias)!.endpoint],
          ])
          .border(true)
          .render();
      }else{
        console.log(warn("[WARN]"), `Bucket \`${alias}' FAILED to add as it's not exist in endpoint.`);
      }
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })
