interface LogModel {
    logError(message: string, params? : any): void;
    logWarning(message: string, params? : any): void;
    logInfo(message: string, params? : any): void;
    logVerbose(message: string, params? : any): void;
}