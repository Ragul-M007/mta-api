/**
 * @author Bharathraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-23 3:12:11
 * @desc [description]
 */

 var express = require('express');
 const CategoriesController = require('../controllers/categories.controller');
 const { Authentication } = require('../utils/authenticate');
 const CategoriesRouter = express.Router();
 const FileUpload = require('../utils/file');
const passport = require('passport')
 // 
 /* ------------------------------- Create Category Details ------------------------------ */
 CategoriesRouter.post('/removeCat',passport.authenticate('jwt', { session: false }),Authentication(),CategoriesController.removeCat)

 CategoriesRouter.post('/',passport.authenticate('jwt', { session: false }),Authentication(),CategoriesController.create)
 
 /* -------------------------------- Get Category -------------------------------- */
 CategoriesRouter.get('/', passport.authenticate('jwt', { session: false }),Authentication(),CategoriesController.fetch)
 
 CategoriesRouter.get('/avail_cats', CategoriesController.getCats)

 /* -------------------------------- update all  Category -------------------------------- */
 CategoriesRouter.put('/:category_id', CategoriesController.update)
 
 /* -------------------------------- delete  Category -------------------------------- */
 CategoriesRouter.delete('/:category_id', CategoriesController.delete)

 CategoriesRouter.get('/getCatUsers',passport.authenticate('jwt', { session: false }),Authentication(), CategoriesController.getCatUsers)

 CategoriesRouter.get('/getCatUsersinProj', CategoriesController.getAllCatUsersinProject)

 CategoriesRouter.get('/getCategorybyuser', CategoriesController.getCatgorybyUser)
 
 // Romove user from category
//  CategoriesRouter.delete('/deleteCatUser',CategoriesController.deleteCatUser)
 
 module.exports = CategoriesRouter;
 