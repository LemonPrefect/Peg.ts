import * as fs from "https://deno.land/std@0.167.0/node/fs.ts";
import * as yaml from "npm:yaml@2.1.3";
import { IConfig } from "../interfaces/IConfig.ts";
import { IBucket } from "../interfaces/IBucket.ts";

export class ConfigService{
  private config: IConfig;
  private path: string;

  constructor(path: string){
    this.path = path;
    this.config = this.parseConfig(this.readConfig(path));
  }

  private readConfig(path: string): string{
    return fs.readFileSync(path).toString();
  }

  private parseConfig(config: string): IConfig{
    const data = yaml.parse(config) as IConfig;
    if(!data){
      throw Error("Parse Error.");
    }
    return data;
  }

  public getConfig(): IConfig{
    return this.config;
  }
  
  public saveConfig(): void{
    return fs.writeFileSync(this.path, yaml.stringify(this.config));
  }

  public addBucket(bucket: IBucket): void{
    for(const _ of this.config.buckets){
      if(_.alias === bucket.alias){
        return
      }
    }
    this.config.buckets.push(bucket);
  }

  public getBucket(alias: string): IBucket | undefined{
    for(const bucket of this.config.buckets){
      if(bucket.alias === alias){
        return bucket;
      }
    }
    return undefined;
  }

  public deleteBucket(alias: string): void{
    this.config.buckets = this.config.buckets.filter((_) => _.alias !== alias);
  }

  public setCredentials(secretId: string, secretKey: string): void{
    this.config.secretId = secretId;
    this.config.secretKey = secretKey;
  }

  public setDogeEndpoint(protocol = "https", endpoint = "api.dogecloud.com"){
    this.config.portal = endpoint;
    this.config.protocol = protocol;
  }
}
