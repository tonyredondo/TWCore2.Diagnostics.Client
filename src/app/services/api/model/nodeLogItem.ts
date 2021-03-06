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
import { SerializableException } from './serializableException';


export interface NodeLogItem {
    logId?: string;
    assembly?: string;
    type?: string;
    group?: string;
    code?: string;
    level?: NodeLogItem.LevelEnum;
    message?: string;
    exception?: SerializableException;
    timestamp?: Date;
    instanceId?: string;
    id?: string;
    environment?: string;
    machine?: string;
    application?: string;
}
export namespace NodeLogItem {
    export type LevelEnum = 'Error' | 'Warning' | 'InfoBasic' | 'InfoMedium' | 'InfoDetail' | 'Debug' | 'Verbose' | 'Stats' | 'LibDebug' | 'LibVerbose';
    export const LevelEnum = {
        Error: 'Error' as LevelEnum,
        Warning: 'Warning' as LevelEnum,
        InfoBasic: 'InfoBasic' as LevelEnum,
        InfoMedium: 'InfoMedium' as LevelEnum,
        InfoDetail: 'InfoDetail' as LevelEnum,
        Debug: 'Debug' as LevelEnum,
        Verbose: 'Verbose' as LevelEnum,
        Stats: 'Stats' as LevelEnum,
        LibDebug: 'LibDebug' as LevelEnum,
        LibVerbose: 'LibVerbose' as LevelEnum
    };
}
