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


export interface ApplicationsLevels {
    application?: string;
    levels?: Array<ApplicationsLevels.LevelsEnum>;
}
export namespace ApplicationsLevels {
    export type LevelsEnum = 'Error' | 'Warning' | 'InfoBasic' | 'InfoMedium' | 'InfoDetail' | 'Debug' | 'Verbose' | 'Stats' | 'LibDebug' | 'LibVerbose';
    export const LevelsEnum = {
        Error: 'Error' as LevelsEnum,
        Warning: 'Warning' as LevelsEnum,
        InfoBasic: 'InfoBasic' as LevelsEnum,
        InfoMedium: 'InfoMedium' as LevelsEnum,
        InfoDetail: 'InfoDetail' as LevelsEnum,
        Debug: 'Debug' as LevelsEnum,
        Verbose: 'Verbose' as LevelsEnum,
        Stats: 'Stats' as LevelsEnum,
        LibDebug: 'LibDebug' as LevelsEnum,
        LibVerbose: 'LibVerbose' as LevelsEnum
    };
}