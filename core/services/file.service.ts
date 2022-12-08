import COS from "npm:cos-nodejs-sdk-v5@2.11.18/index.js";
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
  
  public async getFiles(limit = 1000, next = "", prefix = ""){
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

  public async uploadFiles(files: Array<IFile>){
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
        FilePath: file.local
      }); //callback?
    }
  }
  public async deleteFiles(){}
  public async filterFiles(){}
  public async moveFile(){}
  public async copyFile(){}
  public async setFileMime(){}
  public async getFileInfo(){}
  public async getFileURL(){}
  public async syncFiles(remote: Array<IFile>, local: Array<IFile>)/** : Promise<Array<IFile>> */{} // Check two groups CRC match
}
