import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import add from "./add.ts";
import show from "./show.ts";
import set from "./set.ts";
import _delete from "./delete.ts";
import init from "./init.ts";


export default await new Command()
  .usage("[command] [option]")
  .description("Init or edit config file")
  .command("add", add)
  .command("delete", _delete)
  .command("init", init)
  .command("set", set)
  .command("show", show)
  
