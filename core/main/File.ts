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

  public async getFilesRecurse(prefix: string, limit = 1000, store: Array<IFile> = [] as Array<IFile>): Promise<Array<IFile>>{
    const result: Array<IFile> = store;
    const {files, continue: string} = await this.getFiles(prefix);
    for(const file of files){
      if(file.key.endsWith("/")){
        result.push(...await this.getFilesRecurse(file.key, limit, []));
      }else{
        result.push(file);
      }
    }
    return result;
  }
  
  public filterFiles(files: Array<IFile>, include = ".*", exclude = "//"): Array<IFile>{
    return files.filter((file) => new RegExp(include, "i").test(file.key) && !new RegExp(exclude, "i").test(file.key));
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