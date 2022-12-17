import { IBucket } from "./IBucket.ts";

export interface IConfig{
    protocol: string;
    portal: string;
    secretId: string;
    secretKey: string;
    sessionToken: string;
    buckets: Array<IBucket>
}