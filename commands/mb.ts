import { Command } from "https://deno.land/x/cliffy@v0.25.5/command/mod.ts";


export default await new Command()
  .usage("<bucket-uri> [flags]")
  .description("Create bucket")
  .example(
    "List file recursively",
    "./peg ls doge://examplebucket/test/ -r"
  )
  .option("-r, --recursive", "List objects recursively")
  .option("--exclude <exclude:string>", "Exclude files that meet the specified criteria")
  .option("--include <include:string>", "List files that meet the specified criteria")
  .option("--limit <limit:integer>", "Limit the number of objects listed(0~1000)")
