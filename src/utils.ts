import * as winston from 'winston';
import { format } from 'logform';

/**
 * @function delay basic delay function (async)
 * @param ms delay in miliseconds
 */
export function delay(ms: number){
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @function mapToJson serializes map to a JSON object
 * @param map a serializable Map (with string or number keys)
 */
export function mapToJson(map: Map<string | number, any>){
    let obj = Array.from(map).reduce((obj, [key, value]) => (
        Object.assign(obj, { [key]: value })
      ), {});
    return JSON.stringify(obj);
}

/**
 * @function _queryPrepare initially cleans up query string
 * @param query Valid SQL query.
 */
export function queryPrepare(query: string): string{
    let cleanQuery: string = query.replace(/--.*/g, "")   // remove comments
                                  .replace(/  +/g, "")    // mush into single line
                                  .replace(/\n/g, " ")    // mush into single line
    return cleanQuery;
}

/**
 * @function escapeSingleQuotes escapes single quotes in a SQL query
 * @param str SQL query that can possibly contain unescaped single quotes
 */
export function escapeSingleQuotes(str: string | undefined | null){
    if (typeof str === 'string'){
        return str.replace(/'/g, `''`)
    }
    else return null;
}

/**
 * @constant logger is a Winston Logger used for debugging
 */
export const logger = winston.createLogger({
    level: process.env.LOG_SEVERITY || 'error',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json(),
    ),
    defaultMeta: { service: 'refinery_back' },
    transports: [
        // Write all logs with level `error` and below to `error.log`
        // Write all logs with level `silly` and below to `combined.log`
        new winston.transports.File({ filename: './debug/error.log', level: 'error' }),
        new winston.transports.File({ filename: './debug/combined.log', level: 'silly' })
    ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new winston.transports.Console({
//     format: winston.format.simple()
//   }));
// }