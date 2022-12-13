import { IAxiodResponse } from "../common/lib.ts";

class RequestError extends Error{}

export function requestErrorHandler(response: IAxiodResponse): IAxiodResponse{
  if(!(response.status === 200)){
    throw new RequestError(response.status.toString());
  }
  if(!(response.data.code === 200)){
    throw new RequestError(response.data.msg);
  }
  return response;
}