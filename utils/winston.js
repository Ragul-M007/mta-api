/**
* @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 12:14:11
 * @desc [description]
 */
require('dotenv').config()

var winston = require('winston');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, prettyPrint } = format;
const { SPLAT } = require('triple-beam');
const { isObject } = require('lodash');


const appPath = process.env.APP_BASE_PATH

const formatObject = (param) => {
    if (isObject(param)) {
      return JSON.stringify(param);
    }
    return param;
  };
  
  // getting if it has multiple params
  const all = format((info) => {
    const splat = info[SPLAT] || [];
    const message = formatObject(info.message);
    const rest = splat.map(formatObject).join(' ');
    info.message = `${message} ${rest}`;
    return info;
  });
  
  const timezoneFormat = () => moment().format('YYYY-MM-DDTHH:mm:ss.SSS');

var logger = new winston.createLogger({
    format: combine(
        label({ label: process.env.APP_NAME }),
        all(),
        timestamp(),
        prettyPrint(),
        printf((info) => `${info.timestamp} ${info.level}: ${formatObject(info.message)}`),
    ),
    transports: [
        new winston.transports.Console(
            {
                level: 'debug',
                handleExceptions: true,
                json: true,
                colorize: true,
            }
        ),
        new winston.transports.File({
            filename: `${appPath}/logs/error.log`, level: 'error', handleExceptions: true,
            json: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            colorize: true,
        }),
        new winston.transports.File({ filename: `${appPath}/logs/combined.log` }),
    ],
    exitOnError: true, //  exit on handled exceptions
});


logger.stream = {
    write: function (message, encoding) {
        logger.info(message);
    },
};




module.exports = logger;