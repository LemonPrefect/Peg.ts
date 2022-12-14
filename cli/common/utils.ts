import { path, os, colors, ansi } from "./lib.ts";
import { Config } from "../../core/main/Config.ts";
const paints: Record<string, any> = {
  "error": colors.bold.red, 
  "warn": colors.bold.yellow, 
  "info": colors.bold.blue, 
  "success": colors.bold.green
};

function chart(){}

function chartList(){}

function colorLog(level: string, message: string, eraseEnd = true){
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