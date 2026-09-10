/**
 * @author Bharathraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-23 3:12:11
 * @desc [description]
 */

 var express = require('express');
 const NewsfeedController = require('../controllers/newsfeed.controller');
 const { Authentication } = require('../utils/authenticate');
 const NewsRouter = express.Router();
 const FileUpload = require('../utils/file');
const passport = require('passport')
 // 
 /* ------------------------------- Create Category Details ------------------------------ */
 NewsRouter.post('/',FileUpload.base64ToImage("img_url", "img_url"), NewsfeedController.create)

//  NewsRouter.post('/',FileUpload.fileUpload.single('img_url'), NewsfeedController.create)
 
 /* -------------------------------- Get Category -------------------------------- */
 NewsRouter.get('/',NewsfeedController.fetch)

 /* -------------------------------- update all  Category -------------------------------- */
 NewsRouter.put('/:id',FileUpload.base64ToImage("img_url", "img_url"), NewsfeedController.update)
 
 /* -------------------------------- delete  Category -------------------------------- */
 NewsRouter.delete('/:id', NewsfeedController.delete)
 
 
 
 
 module.exports = NewsRouter;
 