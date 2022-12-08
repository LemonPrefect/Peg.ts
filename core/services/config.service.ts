import { IConfig } from "../interfaces/IConfig.ts";
import { IBucket } from "../interfaces/IBucket.ts";

export class ConfigService{
  private config: IConfig;
  
  constructor(config: IConfig){
    this.config = config;
  }

  public addBucket(bucket: IBucket): void{
    if(!this.config.buckets.includes(bucket)){
      this.config.buckets.push(bucket);
    }
  }

  public getBucket(name: string): IBucket | undefined{
    for(const bucket of this.config.buckets){
      if(bucket.name === name){
        return bucket;
      }
    }
    return undefined;
  }

  public deleteBucket(name: string): void{
    this.config.buckets = this.config.buckets.filter((_) => _.name !== name);
  }

  public setCredentials(secretId: string, secretKey: string): void{
    this.config.secretId = secretId;
    this.config.secretKey = secretKey;
  }

  public getConfig(): IConfig{
    return this.config;
  }

  public setDogeEndpoint(protocol = "https", endpoint = "api.dogecloud.com"){
    this.config.portal = endpoint;
    this.config.protocol = protocol;
  }
}
