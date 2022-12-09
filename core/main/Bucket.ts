import { IBucket } from "../interfaces/IBucket.ts";

import { BucketService } from "../services/bucket.service.ts"
import { ConfigService } from "../services/config.service.ts";
export class Bucket{
  private bucketService: BucketService;

  constructor(configService: ConfigService){
    this.bucketService = new BucketService(configService);
  }

  
}