const { StatusCodes } = require("http-status-codes")

/**
* @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 12:14:11
 * @desc [description]
 */
class Response {
    constructor(response, status = 200) {
        this.response = response
        this.status = status
    }


    _ErrorMessage(message, error) {
        if (!this.status) {
            this.status = StatusCodes.OK
        }
        this.response.status(this.status).send({
            status: false,
            message: message,
            error: error
        })
    }

    _ErrorMessage1(message, error) {
        if (!this.status) {
            this.status = StatusCodes.OK
        }
        this.response.status(this.status).send({
            status: false,
            message: message,
            data: error
        })
    }

    _LoginResponse(user, token) {
        this.response.status(this.status).send({
            status: true,
            message: "Login success !!",
            data: user,
            auth: token
        })
    }

    _SuccessResponse(message, data, token = undefined) {
        this.response.status(this.status).send({
            status: true,
            message: message,
            data: data,
            token
        })
    }

    _SuccessResponseWithRadius(message, data, radius = undefined) {
        this.response.status(this.status).send({
            status: true,
            message: message,
            data: data,
            radius
        })
    }

    _SuccessAttendanceResponse(message, data, type = undefined) {
        this.response.status(this.status).send({
            status: true,
            message: message,
            data: data,
            type
        })
    }

    _SuccessResponse1(message, data, nextpage = undefined) {
        this.response.status(this.status).send({
            status: true,
            message: message,
            data: data,
            nextpage : nextpage
        })
    }

    _SuccessResponseWithPagination(message, data, total_count = undefined) {
        this.response.status(this.status).send({
            status: true,
            message: message,
            data: data,
            total_count : total_count
        })
    }

}

module.exports = Response