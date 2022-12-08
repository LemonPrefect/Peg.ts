import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";
import add from "./add.ts";


export default await new Command()
  .usage("[command] [flag]")
  .description("Init or edit config file")
  .command("add", add)
  
