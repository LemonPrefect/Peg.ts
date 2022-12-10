import { IBucket } from "../interfaces/IBucket.ts"
import { DogeService } from "./doge.service.ts";
import { requestErrorHandler } from "../exception/request.exceptions.ts";

export class BucketService extends DogeService{
  
  public async getBuckets(): Promise<Array<IBucket>>{
    const response = requestErrorHandler(await this.query("/oss/bucket/list.json"));
    const buckets: Array<IBucket> = [] as Array<IBucket>;
    for(const bucket of response.data.data.buckets){
      buckets.push({
        name: bucket.s3Bucket,
        alias: bucket.name,
        region: ["ap-shanghai", "ap-beijing", "ap-guangzhou", "ap-chengdu"][bucket.region],
        endpoint: bucket.s3Endpoint
      } as IBucket);
    }
    return buckets;
  }

  public async createBucket(alias: string, region: string, level = "basic"): Promise<void>{
    requestErrorHandler(await this.query("/oss/bucket/create.json", {
      "name": alias,
      "region": {"ap-shanghai": 0, "ap-beijing": 1, "ap-guangzhou": 2, "ap-chengdu": 3}[region]!,
      "level": level
    }));
  }

  public async deleteBucket(alias: string): Promise<void>{
    requestErrorHandler(await this.query("/oss/bucket/delete.json", {
      "name": alias
    }));
  }

  public async getBucketDomain(bucket: IBucket): Promise<string>{
    const response = requestErrorHandler(await this.query("/oss/bucket/info.json", {}, {
      "name": bucket.alias
    }, false));
    return response.data.data.default_domain;
  }

}

