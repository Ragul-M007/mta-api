/**
 * @author Bharathraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-23 3:12:11
 * @desc [description]
 */

 var express = require('express');
 const CommentsController = require('../controllers/comments.controller');
 const { Authentication } = require('../utils/authenticate');
 const CommentsRouter = express.Router();
 const FileUpload = require('../utils/file');
const passport = require('passport')
 // 

 
 CommentsRouter.get('/conversations', passport.authenticate('jwt', { session: false }),Authentication(), CommentsController.getConversations)

 CommentsRouter.get('/conversations/:message_id',passport.authenticate('jwt', { session: false }),Authentication(), CommentsController.updateConversationToCompleted)

 
 
 module.exports = CommentsRouter;
 