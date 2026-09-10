/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 12:01:11
 * @desc [description]
 */

var express = require('express');
const UserController = require('../controllers/users.controller');
const router = express.Router();
const { Authentication } = require('../utils/authenticate');
const FileUpload = require('../utils/file');
const passport = require('passport')


/* ------------------------------- Create Customer Details ------------------------------ */
router.post('/',passport.authenticate('jwt', { session: false }),Authentication(),FileUpload.base64ToImage("user_img", "user_img"), UserController.create)

/* -------------------------------- Get Customer -------------------------------- */
router.get('/',passport.authenticate('jwt', { session: false }),Authentication(), UserController.fetch)

/* -------------------------------- Get User -------------------------------- */
router.get('/getUsersWithPagination',passport.authenticate('jwt', { session: false }),Authentication(), UserController.getAllUsersWithPagination)

/* -------------------------------- update all  Customers -------------------------------- */
router.put('/:user_id',passport.authenticate('jwt', { session: false }),Authentication(),FileUpload.base64ToImage("user_img", "user_img"), UserController.update)

/* -------------------------------- delete  Customers -------------------------------- */
router.delete('/:user_id', passport.authenticate('jwt', { session: false }),Authentication(),UserController.delete)

router.post('/login', UserController.login)
router.post('/publicusersignup',UserController.publicUserSignUp)
router.post('/forgotPassword',UserController.forgotPassword)
router.post('/validate_otp',UserController.validateOTP)
router.post('/changePassword',UserController.changePassword)
router.post('/changePin',UserController.changePin)
router.get('/profile/:user_id',passport.authenticate('jwt', { session: false }),Authentication(),UserController.profile)
router.get('/user_roles', UserController.userroles)
router.get('/usercounts',passport.authenticate('jwt', { session: false }),Authentication(), UserController.userCounts)
router.get('/updateusercounts',passport.authenticate('jwt', { session: false }),Authentication(), UserController.updateUserCounts)
router.post('/handshake', UserController.handshake)
router.delete('/removeImage/:user_id', UserController.deleteImage)
router.delete('/deleteDeviceId/:user_id', UserController.deleteDeviceId);
router.get('/getUserList',passport.authenticate('jwt', { session: false }),Authentication(),UserController.getUserList)
router.get('/getUserLoginHours', UserController.getUserLoginHours)
router.get('/backlink', UserController.getBackLink)



module.exports = router;
