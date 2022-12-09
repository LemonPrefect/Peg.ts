import COS from "npm:cos-nodejs-sdk-v5@2.11.18/index.js";
import * as base64url from "https://denopkg.com/chiefbiiko/base64/base64url.ts";
import { IBucket } from "../interfaces/IBucket.ts";
import { DogeService } from "./doge.service.ts";
import { IFile } from "../interfaces/IFile.ts";
import { ConfigService } from "./config.service.ts";
import { requestErrorHandler } from "../exception/request.exceptions.ts";

export class FileService extends DogeService{
  private bucket: IBucket;
  constructor(configService: ConfigService, bucket: IBucket){
    super(configService);
    this.bucket = bucket;
  }

  public async setBucket(bucket: IBucket): Promise<FileService>{
    this.bucket = bucket;
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

  public async uploadFiles(files: Array<IFile>, callback: Function | undefined = undefined){
    const response = requestErrorHandler(await this.query("/oss/upload/auth.json", {}, {
      "scope": `${this.bucket.name}:*`,
      "deadline": Math.round(new Date().getTime() / 1000) + 3600
    }));
    const {sessionToken, accessKeyId, secretKey, _} = response.data.data.uploadToken.split(":");
    const cos = new COS({
      SecretId: accessKeyId,
      SecurityToken: sessionToken,
      SecretKey: secretKey
    });
    for(const file of files){
      cos.sliceUploadFile({
        Bucket: this.bucket.name,
        Region: this.bucket.name,
        Key: file.key,
        FilePath: file.local!, /** TODO: valid check */
        onTaskStart: (taskInfo: COS.Task) => {return},
        onProgress: (params: COS.ProgressInfo) => {return}
      }, (err: COS.CosError, data: COS.SliceUploadFileResult) => {return});
    }
  }

  public async deleteFiles(files: Array<IFile>): Promise<void>{
    const keys: Array<string> = [] as Array<string>;
    for(const file of files){
      keys.push(file.key);
    }
    requestErrorHandler(await this.query("/oss/upload/auth.json", {
      "bucket": this.bucket.alias
    }, keys));
  }
  
  public async filterFiles(){}
  
  /** SAME AREA LIMITED */
  public async moveFile(src: string, dest: string, fromBucket: string = this.bucket.alias, toBucket: string = this.bucket.alias, isForce = false): Promise<void>{
    requestErrorHandler(await this.query("/oss/file/move.json", {}, {
      "src": base64url.fromUint8Array(new TextEncoder().encode(`${fromBucket}:${src}`)),
      "dest": base64url.fromUint8Array(new TextEncoder().encode(`${toBucket}:${dest}`)),
      "force": isForce ? 1 : 0
    }, false));
  }

  /** SAME AREA LIMITED */
  public async copyFile(src: string, dest: string, fromBucket: string = this.bucket.alias, toBucket: string = this.bucket.alias, isForce = false): Promise<void>{
    requestErrorHandler(await this.query("/oss/file/copy.json", {}, {
      "src": base64url.fromUint8Array(new TextEncoder().encode(`${fromBucket}:${src}`)),
      "dest": base64url.fromUint8Array(new TextEncoder().encode(`${toBucket}:${dest}`)),
      "force": isForce ? 1 : 0
    }, false));
  }

  public async setFileMime(files: Array<IFile>, mime: string){
    const keys: Array<string> = [] as Array<string>;
    for(const file of files){
      keys.push(file.key);
    }
    requestErrorHandler(await this.query("/oss/file/mime.json", {
      "bucket": this.bucket.alias,
      "mime": base64url.fromUint8Array(new TextEncoder().encode(mime))
    }, keys));
  }

  public async getFileInfo(keys: Array<string>): Promise<Array<IFile>>{
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
        time: file.time
      } as IFile);
    }
    return files;
  }

  public async getFileURL(file: IFile){
    
  }
  public async syncFiles(remote: Array<IFile>, local: Array<IFile>)/** : Promise<Array<IFile>> */{} // Check two groups CRC match
}
