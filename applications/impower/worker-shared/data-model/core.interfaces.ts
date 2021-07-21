import { isString } from '@val/common';

export interface RestPayload<T> {
  page: number;
  pageSize: number;
  records: number;
  rows: T[];
  total: number;
}

export interface RestResponse<T> {
  payload: T;
  exception: string;
  returnCode: number;
}

export class ServiceError<T> {
  serviceUrl: string;
  payload?: T;
  response?: RestResponse<any>;
  message: string;
  originalError: Error;
  constructor(err: Error, serviceUrl: string, payload?: T, response?: RestResponse<any>);
  constructor(message: string, serviceUrl: string, payload?: T, response?: RestResponse<any>)
  constructor(p1: string | Error, serviceUrl: string, payload?: T, response?: RestResponse<any>) {
    if (isString(p1)) {
      this.message = p1;
    } else {
      this.message = p1.message;
      this.originalError = p1;
    }
    this.serviceUrl = serviceUrl;
    this.payload = payload;
    this.response = response;
  }
}
