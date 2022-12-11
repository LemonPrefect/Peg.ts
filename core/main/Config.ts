import * as fs from "https://deno.land/std@0.167.0/node/fs.ts";
import * as yaml from "npm:yaml@2.1.3";
import { IBucket } from "../interfaces/IBucket.ts";
import { BucketService } from "../services/bucket.service.ts"
import { ConfigService } from "../services/config.service.ts";
import { IConfig } from "../interfaces/IConfig.ts";

export class Config{
  private service: ConfigService;

  constructor(file: string){
    if(!fs.existsSync(file)){
      throw Error("file not exist");
    }
    this.service = new ConfigService(file);
  }

  public async addBucket(alias: string): Promise<boolean>{
    const bucketService = new BucketService(this.service);
    const buckets: Array<IBucket> = await bucketService.getBuckets();
    for(const bucket of buckets){
      if(bucket.alias === alias){
        this.service.addBucket(bucket);
        this.service.saveConfig();
        return true;
      }
    }
    return false;
  }

  public getConfig = () => this.service.getConfig()
  
  public getService = () => this.service

  public getBucket = (alias: string) => this.service.getBucket(alias)

  public deleteBucket(alias: string){
    this.service.deleteBucket(alias);
    this.service.saveConfig();
  }

  public setCredentials(secretId: string, secretKey: string){
    this.service.setCredentials(secretId, secretKey);
    this.service.saveConfig();
  }

  public static init(path: string){
    fs.writeFileSync(path, yaml.stringify({
      protocol: "",
      portal: "",
      secretId: "",
      secretKey: "",
      sessionToken: "",
      buckets: []
    } as IConfig));
  }

  public setDogeEndpoint = (protocol = "https", endpoint = "api.dogecloud.com") => this.service.setDogeEndpoint(protocol, endpoint)

  public static globalOverwrites(config:Config, endpoint: string | undefined, secretId: string | undefined, secretKey: string | undefined){
    if(endpoint){
      config.setDogeEndpoint(config.getConfig().protocol, endpoint);
    }
    if(secretId && secretKey){
      config.setCredentials(secretId, secretKey);
    }
    return config;
  }

}