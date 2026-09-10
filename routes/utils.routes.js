/**
 * @author Bharathraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-23 3:12:11
 * @desc [description]
 */

 var express = require('express');
 const UtilsController = require('../controllers/utils.controller');
 const { Authentication } = require('../utils/authenticate');
 const UtilsRouter = express.Router();
 const FileUpload = require('../utils/file');
const passport = require('passport')
 // 
 /* ------------------------------- Create Category Details ------------------------------ */
 UtilsRouter.post('/',passport.authenticate('jwt', { session: false }),Authentication(),UtilsController.create)
 
 /* -------------------------------- Get Category -------------------------------- */
 UtilsRouter.get('/',passport.authenticate('jwt', { session: false }),Authentication(), UtilsController.fetch)

 /* -------------------------------- update all  Category -------------------------------- */
 UtilsRouter.put('/:duration_id', UtilsController.update)
 
 /* -------------------------------- delete  Category -------------------------------- */
 UtilsRouter.delete('/:project_id', UtilsController.delete)

 UtilsRouter.delete('/deletecomment/:comment_id',passport.authenticate('jwt', { session: false }),Authentication(),UtilsController.deletecomment)

 
  UtilsRouter.post('/addNoti',FileUpload.base64ToImage("img_url", "img_url"),UtilsController.notification)
 
  UtilsRouter.get('/getNotification',passport.authenticate('jwt', { session: false }),Authentication(), UtilsController.getNotification)

  UtilsRouter.post('/getAudioUrl',passport.authenticate('jwt',{ session: false }),FileUpload.base64ToImage("audio","audio"),UtilsController.getAudioUrl)

  UtilsRouter.put('/updateNotification/:noti_id',passport.authenticate('jwt',{ session: false}),UtilsController.UpdateNotification)  
//  UtilsRouter.put('/:document_id', UtilsController.update)
 
 module.exports = UtilsRouter;
 