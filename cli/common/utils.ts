import { path, os, colors, ansi, Table, Row, Cell } from "./lib.ts";
import i18n from "../common/i18n.ts";
import { Config } from "../../core/main/Config.ts";
const t = i18n();

const paints: Record<string, any> = {
  "error": colors.bold.red, 
  "warn": colors.bold.yellow, 
  "info": colors.bold.blue, 
  "success": colors.bold.green
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

function progressInit(){}

function configInit(configPath: string | undefined, secretId: string | undefined, secretKey: string | undefined){
  configPath = configPath == undefined ? path.join(os.homeDir() ?? "./", ".peg.config.yaml") : configPath;
  try{
    const config = new Config(configPath);
    Config.globalOverwrites(config, secretId, secretKey);
    return config;      
  }catch(e){
    // throw new CommandError()
  }
}

function parseDogeURL(url: string, dir = false){
  const [bucket, path] = url.match(new RegExp("doge://([A-z0-9\-]*)/?(.*)", "im"))!.slice(1);
  if(path.endsWith("/")){
    throw new Error(`${location} refers to a directory.`);
  }
  // if(!dogeBucket){
  //   throw new Error(`dogeBucket: \`${dogeBucket}' or dogePath: \`${dogePath}' is invalid.`);
  // }
}

function recurseLog(){}

// color CommandError //