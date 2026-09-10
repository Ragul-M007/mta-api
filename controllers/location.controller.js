const SpErrorHandler = require("../utils/error-handler")
const Response = require("../utils/response")
const { Message } = require('../utils/messages')
const csc = require('country-state-city').default
const LocationController = {

    /**
     * ANCHOR Get countries
     * @param {*} req 
     * @param {*} res 
     */
    getCountries(req, res) {
        try {
            let countries = csc.getAllCountries()


            countries = countries.map(({ name, flag, isoCode }) => {
                return {
                    name,
                    flag,
                    code: isoCode
                }
            })

            new Response(
                res
            )._SuccessResponse(
                Message.Common.SuccessMessage.Fetch("countries"),
                countries
            )
        }
        catch (err) {
            new SpErrorHandler(res, err)
        }
    },

    /**
    * ANCHOR Get states
    * @param {*} req 
    * @param {*} res 
    */
    getStates(req, res) {
        try {

            let { country_code } = req.query
            let states = csc.getStatesOfCountry(
                country_code
            )

console.log(country_code);
            states = states.map(({ name, flag, isoCode, countryCode }) => {
                return {
                    name,
                    code: isoCode,
                    country_code: countryCode
                }
            })
            new Response(
                res
            )._SuccessResponse(
                Message.Common.SuccessMessage.Fetch("states"),
                states
            )
        }
        catch (err) {
            new SpErrorHandler(res, err)
        }
    },


    /**
* ANCHOR Get states
* @param {*} req 
* @param {*} res 
*/
    getCities(req, res) {
        try {

            let { state_code, country_code } = req.query
            let cities = csc.getCitiesOfState(
                country_code,
                state_code
            )


            /*   cities = states.map(({ name, flag, isoCode, countryCode }) => {
                   return {
                       name,
                       code: isoCode,
                       country_code: countryCode
                   }
               })*/
            new Response(
                res
            )._SuccessResponse(
                Message.Common.SuccessMessage.Fetch("cities"),
                cities
            )
        }
        catch (err) {
            new SpErrorHandler(res, err)
        }
    }
}
module.exports = LocationController