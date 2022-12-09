import { IBucket } from "../interfaces/IBucket.ts";

import { BucketService } from "../services/bucket.service.ts"
import { ConfigService } from "../services/config.service.ts";
export class Bucket{
  private service: BucketService;

  constructor(configService: ConfigService){
    this.service = new BucketService(configService);
  }

  public async createBucket(alias: string, region: string, level = "basic"){
    return await this.service.createBucket(alias, region, level);
  }
  public async getBuckets(){
    return await this.service.getBuckets();
  }
}