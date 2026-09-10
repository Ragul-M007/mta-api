/**
* @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 12:14:11
 * @desc [description]
 */
const { TooManyRequests, HttpError } = require("http-errors");
// const database = require("./database");
const { Message } = require("./messages");
// const logger = require("./winston");

const { StatusCodes } = require('http-status-codes');
const Response = require("./response");
const logger = require("./winston");


/**  Global error handlers */
class AppErrorHandler {

    /**
     * 
     * @param {*} response // response instance
     * @param {*} error // Error type
     */
    constructor(response, error = null) {


        logger.info(error)

        let mysql_server_error_codes = [
            "ECONNREFUSED",
            "ER_BAD_DB_ERROR",
            "PROTOCOL_CONNECTION_LOST",
            "ER_PARSE_ERROR",
            "ER_NO_SUCH_TABLE",
        ]


        let mysql_reference_error_codes = [
            "ER_NO_REFERENCED_ROW_2",
        ]

        let mysql_duplication_error_codes = [
            "ER_DUP_ENTRY",
            "SequelizeUniqueConstraintError"
        ]


        let unauthorized = [
            "Invalid token",
        ]



        // if error already defined it
        // logger.info(error)
        if (typeof error == 'string') {

            // setting status as a bad request and sending error message
            new Response(response, StatusCodes.BAD_REQUEST)._ErrorMessage(error)
        }


        // if error is an instance of Js Error instance
        else if (error instanceof Error) {


            // if (error.sqlState && error.code) {
            // Database error instance if connection lost or protocol error
            if (
                mysql_server_error_codes.includes(error.code)
            ) {
                new Response(response, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)

            }

            // If child reference row not found
            else if (
                mysql_reference_error_codes.includes(error.code)
            ) {
                new Response(response, StatusCodes.NOT_FOUND)._ErrorMessage(Message.Common.FailureMessage.InvalidRef)
            }

            // If data already exists
            else if (
                mysql_duplication_error_codes.includes(error.code) || mysql_duplication_error_codes.includes(error.name)
            ) {
                new Response(response, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.DataAlreadyExists)

            }
            else if (
                unauthorized.includes(error.code) || mysql_duplication_error_codes.includes(error.name)
            ) {
                new Response(response, StatusCodes.UNAUTHORIZED)._ErrorMessage(Message.Common.FailureMessage.DataAlreadyExists)

            }
            else if (
                error.message && !error.name
            ) {
                new Response(response, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.DataAlreadyExists)

            }
            // }

            // else if (error.message) {
            //     new Response(response, StatusCodes.BAD_REQUEST)._ErrorMessage(error.message)
            // }
            // If invalid error found sending native message
            else {
                // logger.info({
                //     message: error.message,
                // })
                new Response(response, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
            }

        }

        else if (error instanceof ReferenceError) {
            new Response(response, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }

        else {
            // If invalid error found sending native message

            // logger.info({
            //     message: error.message,

            // })
            new Response(response, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    }


}


module.exports = AppErrorHandler