import { FileService } from "../services/file.service.ts"
import { ConfigService } from "../services/config.service.ts";
import { IBucket } from "../interfaces/IBucket.ts";
import { IFile } from "../interfaces/IFile.ts";

export class File{
  private service: FileService;

  constructor(configService: ConfigService, bucket: IBucket){
    this.service = new FileService(configService, bucket);
  }

  public async getFiles(prefix: string, limit = 1000){
    return await this.service.getFiles(limit, prefix);
  }

  public async getFilesRecurse(prefix: string, callback: Function, limit = 1000, store: Array<IFile> = [] as Array<IFile>): Promise<Array<IFile>>{
    const result: Array<IFile> = store;
    const {files, continue: string} = await this.getFiles(prefix);
    for(const file of files){
      if(file.key.endsWith("/")){
        callback(file.key);
        result.push(...await this.getFilesRecurse(file.key,callback, limit, []));
      }else{
        result.push(file);
      }
    }
    return result;
  }
  
  public async uploadFiles(files: Array<IFile>, chunkSize = 32, threadLimit = 5, callback: Function | undefined = undefined){
    await this.service.uploadFiles(files, chunkSize, threadLimit, callback);
  }

  public async downloadFile(file: IFile, sign = false){
    await this.service.downloadFile(file, sign)
  }

  // public async moveFile(){}

  public async copyFile(src: string, dest: string, fromBucket: string, toBucket: string, isForce = false){
    return await this.service.copyFile(src, dest, fromBucket, toBucket, isForce)
  }

  public filterFilesRemote(files: Array<IFile>, include = ".*", exclude = "//"): Array<IFile>{
    return files.filter((file) => new RegExp(include, "i").test(file.key) && !new RegExp(exclude, "i").test(file.key));
  }

  public filterFilesLocal(files: Array<IFile>, include = ".*", exclude = "//"): Array<IFile>{
    return files.filter((file) => new RegExp(include, "i").test(file.local!) && !new RegExp(exclude, "i").test(file.local!));
  }

  public async getUrl(file: IFile, sign = false){
    return sign ? (await this.service.getSignUrl(file)).url : this.service.getUrl(file);
  }

  public static formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }
}