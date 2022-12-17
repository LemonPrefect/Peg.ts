import { Command } from "../../common/lib.ts";
import add from "./add.ts";
import show from "./show.ts";
import set from "./set.ts";
import _delete from "./delete.ts";
import init from "./init.ts";
import i18n from "../../common/i18n.ts";

const t = i18n();

export default await new Command()
  .usage("[command] [option]")
  .description(t("commands.config.description"))
  .command("add", add)
  .command("delete", _delete)
  .command("init", init)
  .command("set", set)
  .command("show", show)
  
