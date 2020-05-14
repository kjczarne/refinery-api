import * as winston from 'winston';
import { format } from 'logform';

export function delay(ms: number){
    return new Promise(resolve => setTimeout(resolve, ms));
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