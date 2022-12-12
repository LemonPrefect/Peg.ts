import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
import { IAxiodResponse } from "https://deno.land/x/axiod@0.26.2/interfaces.ts";
import { IConfig } from "../interfaces/IConfig.ts"
import { ConfigService } from "./config.service.ts";

export class DogeService{
  protected readonly configService: ConfigService;
  protected readonly config: IConfig;

  constructor(configService: ConfigService){
    this.configService = configService;
    this.config = this.configService.getConfig();
  }

  private compact(data: Record<string, string | number> | Array<string | number>): string{
    const result: Array<string> = [];
    for (const [k, v] of Object.entries(data)){
      result.push(`${k}=${encodeURIComponent(v.toString())}`);
    }
    return result.join("&");
  }
  
  private sign(path: string, data: Record<string, string | number | unknown> | Array<string | number>, isJson = true): string{
    const body: string = isJson ? JSON.stringify(data) : this.compact(data as Record<string, string | number>);
    return hmac("sha1", this.config.secretKey, `${path}\n${body}`, "utf8", "hex").toString();
  }

  // Unknown will only be use when JSON is the structure.
  protected async query(path: string, params: Record<string, string | number> = {}, data: Record<string, string | number | unknown> | Array<string | number> = {}, isJson = true): Promise<IAxiodResponse>{
    const signPath = Object.keys(params).length === 0 ? `${path}` : `${path}?${this.compact(params)}`;
    return await axiod({
      baseURL: `${this.config.protocol}://${this.config.portal}`,
      method: "POST",
      url: `${path}`,
      params: params,
      headers: {
        "Authorization": `TOKEN ${this.config.secretId}:${this.sign(signPath, data, isJson)}`,
        "Content-Type": isJson ? "application/json" : "application/x-www-form-urlencoded"
      },
      data: isJson ? data : this.compact(data as Record<string, string | number>) // when EMPTY, KEEP as `{}' for POST is actually convinient and no 405 will be present.
    })
  }
}
