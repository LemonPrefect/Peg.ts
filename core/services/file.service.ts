import { COS, base64url, base64, path, fs, axiod, crc64, Buffer, iterateReader } from "../common/lib.ts";
import { IBucket } from "../interfaces/IBucket.ts";
import { DogeService } from "./doge.service.ts";
import { IFile } from "../interfaces/IFile.ts";
import { ConfigService } from "./config.service.ts";
import { BucketService } from "./bucket.service.ts";
import { requestErrorHandler } from "../exception/request.exceptions.ts";

export class FileService extends DogeService{
  private bucket!: IBucket;
  private bucketDomain!: string;
  private bucketService: BucketService;

  constructor(configService: ConfigService, bucket: IBucket){
    super(configService);
    this.bucketService = new BucketService(configService);
    this.bucket = bucket;
    this.setBucket(bucket);
  }

  public async setBucket(bucket: IBucket): Promise<FileService>{
    this.bucket = bucket;
    try{
      this.bucketDomain = await this.bucketService.getBucketDomain(bucket);
    // deno-lint-ignore no-empty
    }catch(_e){}
    return this;
  }
  
  public async getFiles(limit = 1000, prefix = "", next = ""){
    const response = requestErrorHandler(await this.query("/oss/file/list.json", {
      "bucket": this.bucket.alias,
      "limit": limit,
      "continue": next,
      "prefix": prefix
    }));
    const files: Array<IFile> = [] as Array<IFile>;
    for(const file of response.data.data.files){
      files.push({
        key: file.key,
        hash: file.hash,
        size: file.fsize,
        mime: file.mimeType,
        time: file.time
      } as IFile);
    }
    return {files: files, continue: response.data.data.continue ?? undefined}
  }

  // deno-lint-ignore ban-types
  public async uploadFiles(files: Array<IFile>, chunkSize = 32, threadLimit = 5, metas = {}, callback: Function | undefined = undefined){
    const response = requestErrorHandler(await this.query("/oss/upload/auth.json", {}, {
      "scope": `${this.bucket.alias}:*`,
      "deadline": Math.round(new Date().getTime() / 1000) + 3600
    }));
    const [sessionToken, accessKeyId, secretKey, info] = response.data.data.uploadToken.split(":");
    const cos = new COS({
      SecretId: accessKeyId,
      SecurityToken: sessionToken,
      SecretKey: secretKey,
      ChunkParallelLimit: threadLimit
    });
    const preprefix: string = JSON.parse(new TextDecoder().decode(base64.toUint8Array(info))).preprefix;
    
    for(const file of files){
      cos.sliceUploadFile({
        ChunkSize: chunkSize,
        Bucket: this.bucket.name,
        Region: this.bucket.region,
        Key: `${preprefix}${file.key}`,
        FilePath: file.local!,
        ...metas,
        onTaskStart: (_taskInfo: COS.Task) => {
          if(callback){
            callback(`${file.local}=>${preprefix}${file.key}`, files.indexOf(file), files.length, 0);
          }
        },
        onProgress: (params: COS.ProgressInfo) => {
          if(callback){
            callback(`${file.local}=>${preprefix}${file.key}`, files.indexOf(file) + 1, files.length, Math.round(params.percent * 100));
          }
        }
      }, (err: COS.CosError, _data: COS.SliceUploadFileResult) => {
        if(err){
          throw err;
        }
        if(callback){
          callback(`${file.local} => ${preprefix}${file.key}`, files.indexOf(file), files.length, 100);
        }
      });
    }
  }

  public async deleteFiles(files: Array<IFile>): Promise<void>{
    const keys: Array<string> = [] as Array<string>;
    for(const file of files){
      keys.push(file.key);
    }
    requestErrorHandler(await this.query("/oss/file/delete.json", {
      "bucket": this.bucket.alias
    }, keys));
  }
    
  public async moveFile(src: string, dest: string, fromBucket: string = this.bucket.alias, toBucket: string = this.bucket.alias, isForce = false): Promise<void>{
    requestErrorHandler(await this.query("/oss/file/move.json", {}, {
      "src": base64url.fromUint8Array(new TextEncoder().encode(`${fromBucket}:${src}`)),
      "dest": base64url.fromUint8Array(new TextEncoder().encode(`${toBucket}:${dest}`)),
      "force": isForce ? 1 : 0
    }, false));
  }

  public async copyFile(src: string, dest: string, fromBucket: string, toBucket: string, isForce = false): Promise<void>{
    requestErrorHandler(await this.query("/oss/file/copy.json", {}, {
      "src": base64url.fromUint8Array(new TextEncoder().encode(`${fromBucket}:${src}`)),
      "dest": base64url.fromUint8Array(new TextEncoder().encode(`${toBucket}:${dest}`)),
      "force": isForce ? 1 : 0
    }, false));
  }

  // deno-lint-ignore ban-types
  public async downloadFile(file: IFile, sign = false, callback: Function | undefined = undefined){
    if(!file.local){
      throw new Error(`File \`${file.key}' local path MISSING.`);
    }
    const location: path.ParsedPath = path.parse(file.local);
    const fullpath: string = path.resolve(file.local);
    if(!fs.existsSync(location.dir)){
      fs.mkdirSync(location.dir, {
        recursive: true
      });
    }
    if(fs.existsSync(fullpath)){
      Deno.removeSync(fullpath);
    }
    const res = await fetch(sign ? (await this.getSignUrl(file)).url : await this.getUrl(file));
    const pipe = await Deno.open(fullpath, { create: true, write: true });
    if(!res.body){
      throw new Error(`File ${file.key} returns ${res.status} with no body.`);
    }
    let size = 0;
    for await (const chunk of res.body!){
      pipe.writeSync(chunk);
      size += chunk.length;
      if(callback && size % 1000 === 0){
        callback(size, 0);
      }
    }
    if(callback){
      callback(size, 1);
    }
    Deno.close(pipe.rid);
  }

  public async setFilesMime(files: Array<IFile>, mime: string){
    const keys: Array<string> = [] as Array<string>;
    for(const file of files){
      keys.push(file.key);
    }
    requestErrorHandler(await this.query("/oss/file/mime.json", {
      "bucket": this.bucket.alias,
      "mime": base64url.fromUint8Array(new TextEncoder().encode(mime))
    }, keys));
  }

  public async setFileHeaders(file: IFile, headers: Array<{key: string, value: string | number}>){
    requestErrorHandler(await this.query("/oss/file/config.json", {
      "bucket": this.bucket.alias,
      "key": base64url.fromUint8Array(new TextEncoder().encode(file.key))
    }, {"storageClass": 0, "headers": headers}));
  }

  public async getFilesInfo(keys: Array<string>): Promise<Array<IFile>>{
    const response = requestErrorHandler(await this.query("/oss/file/info.json", {
      "bucket": this.bucket.alias
    }, keys));
    const files: Array<IFile> = [] as Array<IFile>;
    for(const file of response.data.data){
      files.push({
        key: file.key,
        hash: file.hash,
        size: file.fsize,
        mime: file.mimeType,
        time: file.time,
        headers: file.headers
      } as IFile);
    }
    return files;
  }

  public async getUrl(file: IFile, protocol = "http"): Promise<string>{
    if(!this.bucketDomain){
      await this.setBucket(this.bucket);
    }
    return `${protocol}://${this.bucketDomain}/${encodeURIComponent(file.key)}`;
  }

  public async getSignUrl(file: IFile): Promise<{url: string, tip: string}>{
    const response = requestErrorHandler(await this.query("/oss/file/sign.json", {
      "bucket": this.bucket.alias,
      "key": base64.fromUint8Array(new TextEncoder().encode(file.key))
    }, {}));
    return {url: response.data.data.url, tip: response.data.data.tips ?? ""}
  }

  public async getSignHash(file: IFile): Promise<string | undefined>{
    const url = (await this.getSignUrl(file)).url;
    const headers: Headers = (await axiod.get(url, {
      headers: {
        "Range": "bytes=0-0"
      }
    })).headers;
    return headers.get("x-cos-hash-crc64ecma") ?? undefined;
  }

  public async getHash(file: IFile): Promise<string | undefined>{
    const url = await this.getUrl(file);
    const headers: Headers = (await axiod.get(url, {
      headers: {
        "Range": "bytes=0-0"
      }
    })).headers;
    return headers.get("x-cos-hash-crc64ecma") ?? undefined;
  }

  public static async calculateHash(file: IFile){
    if(!file.local){
      throw new Error(`File \`${file.key}' local path MISSING.`);
    }

    let hash = 0;
    const pipe = await Deno.open(file.local);
    for await (const chunk of iterateReader(pipe)) {
      hash = crc64.crc64(Buffer.from(chunk), hash); 
    }
    Deno.close(pipe.rid);
    return hash.toString();
  }

  public async getSyncTime(file: IFile): Promise<string | undefined>{
    const url = await this.getUrl(file);
    const headers: Headers = (await axiod.get(url, {
      headers: {
        "Range": "bytes=0-0"
      }
    })).headers;
    const time = headers.get("last-modified") ?? "";
    if(time !== ""){
      const date = new Date(time);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
    }
    return undefined;
  }
}