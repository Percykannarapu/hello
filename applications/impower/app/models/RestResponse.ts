export interface RestResponse<T = any> {
    payload: T;
    exception: string;
    returnCode: number;
}
