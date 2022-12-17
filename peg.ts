import { Command } from "./cli/common/lib.ts";
import ls from "./cli/commands/ls.ts";
import mb from "./cli/commands/mb.ts";
import mv from "./cli/commands/mv.ts";
import rb from "./cli/commands/rb.ts";
import cp from "./cli/commands/cp.ts";
import config from "./cli/commands/config/config.ts";
import signurl from "./cli/commands/signurl.ts";
import hash from "./cli/commands/hash.ts";
import meta from "./cli/commands/meta.ts";
import rm from "./cli/commands/rm.ts";
import synccheck from "./cli/commands/synccheck.ts";
import i18n from "./cli/common/i18n.ts";

const t = i18n();


if(import.meta.main){
  await main()
}

export async function main(){
  return await new Command()
  .name("peg")
  .description(t("welcome"))
  .version("0.22.1217.1")
  .meta("deno", Deno.version.deno)
  .meta("v8", Deno.version.v8)
  .meta("typescript", Deno.version.typescript)
  .usage("[option/command]")
  .group("Global Options")
  .globalOption("-c, --config-path <configPath:string>", t("options.configPath"))
  .globalOption("-i, --secret-id <secretId:string>", t("options.secretId"), {
    depends: ["secret-key"]
  })
  .globalOption("-k, --secret-key <secretKey:string>", t("options.secretKey"), {
    depends: ["secret-id"]
  })
  .command("config", config)
  .command("cp", cp)
  .command("hash", hash)
  .command("ls", ls)
  .command("mb", mb)
  .command("meta", meta)
  .command("mv", mv)
  .command("rb", rb)
  .command("rm", rm)
  .command("signurl", signurl)
  .command("synccheck", synccheck)
  .parse(Deno.args.length === 0 ? ["--help"] : Deno.args);
}
