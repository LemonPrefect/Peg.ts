/** deno */
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
export {
	axiod,
	hmac
};

/** deno std */
import * as path from "https://deno.land/std@0.110.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.167.0/node/fs.ts";
import { Buffer } from "https://deno.land/std@0.167.0/node/buffer.ts";
import { iterateReader } from "https://deno.land/std@0.162.0/streams/conversion.ts";
export {
	path,
	fs,
	Buffer,
	iterateReader
};

/** deno base64 */
import * as base64url from "https://denopkg.com/chiefbiiko/base64@master/base64url.ts";
import * as base64 from "https://denopkg.com/chiefbiiko/base64@master/mod.ts";
export {
	base64url,
	base64
};

/** types axiod */
import { IAxiodResponse } from "https://deno.land/x/axiod@0.26.2/interfaces.ts";
export type {
	IAxiodResponse
};

/** npms */
import * as yaml from "npm:yaml@2.1.3";
import COS from "npm:cos-nodejs-sdk-v5@2.11.18/index.js";
import * as crc64 from "npm:crc64-ecma182.js@1.0.0/crc64_ecma182.js";
export {
	yaml,
	COS,
	crc64
};