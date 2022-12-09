/** 打印指定配置文件中的信息 - config show
 * ./coscli config show [-c <config-file-path>]
 * https://cloud.tencent.com/document/product/436/63679
 */
import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.5/ansi/colors.ts";
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v0.25.5/table/mod.ts";
import { Config } from "../../core/main/Config.ts";

const {error, warn, info, success} = {error: colors.bold.red, warn: colors.bold.yellow, info: colors.bold.blue, success: colors.bold.green};

export default await new Command()
  .usage("[flags]")
  .description("Prints information from a specified configuration file")
  .example("Format", "./peg config show [-c <config-file-path>]")
  .example("Show all info", "./peg config show")

  .action((e) => {
    let { configPath } = e as unknown as { configPath: string };
    if(!configPath){
      configPath = path.join(os.homeDir() ?? "./", ".peg.config.yaml");
    }
    try{
      const config = new Config(configPath);
      console.log(`Configuration file path: ${configPath}`);
      console.log("Basic Configuration Information: ");
      new Table()
      .body([
        ["Secret ID", config.getConfig().secretId],
        ["Secret Key", config.getConfig().secretKey],
      ])
      .border(true)
      .render();
      console.log("Buckets: ");
      const body: Array<Array<string>> = [];
      for(const bucket of config.getConfig().buckets){
        body.push([bucket.name, bucket.alias, bucket.region, bucket.endpoint])
      }
      new Table()
      .header(["Name", "Alias", "Region", "Endpoint"])
      .body(body)
      .border(true)
      .render();
    }catch(e){
      console.log(error("[ERROR]"), e.message);
    }
  })
