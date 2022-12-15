import { path, os, colors, ansi, Table, Row, Cell, progress, tty } from "./lib.ts";
import i18n from "../common/i18n.ts";
import { Config } from "../../core/main/Config.ts";
import { CommandError } from "../exceptions/CommandError.ts";
const t = i18n();

const paints: Record<string, any> = {
  "error": colors.bold.red, 
  "warn": colors.bold.yellow, 
  "info": colors.bold.blue, 
  "done": colors.bold.green
};

export function chart(header: Array<string>, body: Array<Array<string>>, list = false, objectCount = 0){
  if(list){
    const lines: Array<Row> = [] as Array<Row>;
    for(const line of body){
      lines.push(Row.from(line).align("right"))
    }
    if(objectCount !== -1){
      lines.push(Row.from([new Cell(t("utils.chart.total")).colSpan(header.length - 1).align("right"), new Cell(objectCount)]).border(false));
    }
    return Table
    .from(lines)
    .header(Row.from(header).border(false).align("center"))
    .border(true)
    .chars({
      "top": "-",
      "topMid": "+",
      "topLeft": "",
      "topRight": "",
      "bottom": "-",
      "bottomMid": "+",
      "bottomLeft": "",
      "bottomRight": "",
      "left": "",
      "leftMid": "",
      "mid": "",
      "midMid": "",
      "right": "",
      "rightMid": "",
      "middle": "│"
    })
  }else{
    if(header.length > 0){
      return new Table()
      .header(header)
      .body(body)
      .border(true)  
    }else{
      return new Table()
      .body(body)
      .border(true)
    }
  }
}

export function colorLog(level: string, message: string, eraseEnd = true){
  const color = (paints)[level] ?? colors.white;
  console.log(color(`[${level.toUpperCase()}]`),`${message}${eraseEnd ? ansi.eraseLineEnd.toString() : ""}`, )
}

export function progressInit(title: string){
  return new progress.MultiProgressBar({
    title: title,
    display: `[:bar] :text :percent :time :completed/:total${ansi.eraseLineEnd.toString()}`
  });
}

export function bucketInit(config: Config, bucketAlias: string){
  const bucket = config.getBucket(bucketAlias);
  if(!bucket){
    throw new CommandError(t("utils.bucket.notExist", { bucketAlias }));
  }
  return bucket;
}

export function configInit(configPath: string | undefined){
  configPath = configPath == undefined ? path.join(os.homeDir() ?? "./", ".peg.config.yaml") : configPath;
  try{
    const config = new Config(configPath);
    return config;      
  }catch(_e){
    throw new CommandError(t("utils.config.initFailed", {
      path: configPath
    }));
  }
}

export function parseDogeURL(url: string){
  const [bucket, path] = url.match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
  if(!bucket){
    throw new CommandError(t("utils.url.invalid", { bucket, path }));
  }
  return {
    bucket, path
  }
}

export function recurseLog(message: string){
  tty.eraseLine;
  console.log(`${message}...${ansi.eraseLineEnd.toString()}`);
  tty.cursorUp(1);
}
