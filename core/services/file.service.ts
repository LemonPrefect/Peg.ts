import { IBucket } from "../interfaces/IBucket.ts";
import { DogeService } from "./doge.service.ts";
import { IFile } from "../interfaces/IFile.ts";
import { ConfigService } from "./config.service.ts";

export class FileService extends DogeService{
  private bucket: IBucket = {} as IBucket; // 形态还待确定
  
  public async getFiles(limit: number, )/**: Promise<Array<IFile>> */{
    const response = await this.query("/oss/file/list.json", {
      "bucket": this.bucket.alias,
      // "limit": 
    });
  }

  public async setBucket(bucket: IBucket): Promise<FileService>{
    this.bucket = bucket;
    return this;
  }
  public async uploadFiles(){}
  public async deleteFiles(){}
  public async filterFiles(){}
  public async moveFile(){}
  public async copyFile(){}
  public async setFileMime(){}
  public async getFileInfo(){}
  public async getFileURL(){}
  public async syncFiles(){} // Check two groups CRC match
}