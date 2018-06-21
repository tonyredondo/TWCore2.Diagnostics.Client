/**
 * TWCore Diagnostics Api
 * TWCore diagnostics api
 *
 * OpenAPI spec version: v1
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { KeyValueStringString } from './keyValueStringString';


export interface SerializableException {
    exceptionType?: string;
    message?: string;
    helpLink?: string;
    hResult?: number;
    source?: string;
    stackTrace?: string;
    data?: Array<KeyValueStringString>;
    innerException?: SerializableException;
}