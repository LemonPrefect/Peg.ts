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
  
  public async uploadFiles(files: Array<IFile>, chunkSize = 32, threadLimit = 5, metas = {}, callback: Function | undefined = undefined){
    await this.service.uploadFiles(files, chunkSize, threadLimit, metas, callback);
  }

  public async downloadFile(file: IFile, sign = false, callback: Function | undefined = undefined){
    await this.service.downloadFile(file, sign, callback);
  }

  public async moveFile(src: string, dest: string, fromBucket: string, toBucket: string, isForce = false){
    return await this.service.moveFile(src, dest, fromBucket, toBucket, isForce);
  }

  public async deleteFiles(files: Array<IFile>){
    await this.service.deleteFiles(files);
  }

  public async copyFile(src: string, dest: string, fromBucket: string, toBucket: string, isForce = false){
    return await this.service.copyFile(src, dest, fromBucket, toBucket, isForce);
  }

  public filterFilesRemote(files: Array<IFile>, include = ".*", exclude = "//"): Array<IFile>{
    return files.filter((file) => new RegExp(include, "i").test(file.key) && !new RegExp(exclude, "i").test(file.key));
  }

  public filterFilesLocal(files: Array<IFile>, include = ".*", exclude = "//"): Array<IFile>{
    return files.filter((file) => new RegExp(include, "i").test(file.local!) && !new RegExp(exclude, "i").test(file.local!));
  }

  public async getUrl(file: IFile, sign = false){
    return sign ? (await this.service.getSignUrl(file)).url : await this.service.getUrl(file);
  }

  public async getHashRemote(file: IFile, sign = false){
    return sign ? await this.service.getSignHash(file) : this.service.getHash(file);
  }

  public static async getHashLocal(file: IFile){
    return FileService.calculateHash(file);
  }

  public async syncFilter(files: Array<IFile>, sign = false, callback: Function | undefined = undefined){
    const result: Array<IFile> = [] as Array<IFile>;
    for(const file of files){
      if(callback){
        callback(file);
      }  
      let localHash = "";
      try{
        localHash = await File.getHashLocal(file);
      }catch(e){}
      let remoteHash = "";
      try{
        remoteHash = await this.getHashRemote(file, sign);
      }catch(e){}
      if((localHash !== remoteHash && localHash !== "0") || (localHash === "" && remoteHash === "")){
        result.push(file);
      }
    }
    return result;
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