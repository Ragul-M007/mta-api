/**
 * @author Padmanaban
 * @email padmanaban.r@skeintech.com
 * @create date 2021-01-11 12:57:12
 * @modify date 2021-02-22 15:56:21
 * @desc [description]
 */
var express = require('express');
const LocationController = require('../controllers/location.controller');
const locationRouter = express.Router();



/* ------------------------- get countries ------------------------- */
locationRouter.get('/countries', LocationController.getCountries)

/* ------------------------- get state ------------------------- */
locationRouter.get('/states', LocationController.getStates)

/* ------------------------- get state ------------------------- */
locationRouter.get('/cities', LocationController.getCities)


module.exports = locationRouter;
