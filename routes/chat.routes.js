/**
 * @author Ramesh sankar S
 * @email rameshsankar.s@skeintech.com
 * @create date 2023-11-01
 * @desc [description]
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const FileUpload = require('../utils/file');
const chatFileUpload = require('../utils/chat');
const passport = require('passport')
const { Authentication } = require('../utils/authenticate');


// Create group routes
router.post('/createGroup',passport.authenticate('jwt', { session: false }), Authentication(), FileUpload.base64ToImage("group_image", "group_image"), chatController.createGroup);

router.get('/getGroups', chatController.getGroups);

router.delete('/deleteGroup', passport.authenticate('jwt', { session: false }), Authentication(), chatController.deleteGroup);

router.put('/updateGroup', FileUpload.base64ToImage("group_image", "group_image"), chatController.updateGroup);

router.get('/getGroupDetailsByGroupId', chatController.getGroupDetailsByGroupId);

router.get('/unlinkedUsersInGroup', chatController.getUnlinkedUsersInGroup);

router.post('/addUsersIntoGroup', chatController.addUsersInGroup);

router.post('/removeUserInGroup', chatController.removeUsersInGroup);

router.get('/getUsersByGroupId', chatController.getUsersByGroupId);

router.post('/createMessage', chatFileUpload.fileUpload.array('groupFile'), chatController.createMessage);

router.get('/getMessagesByGroupId', chatController.messagesByGroupId);

router.get('/getMessageReadedUsers', passport.authenticate('jwt', { session: false }), Authentication(), chatController.messagereadedUsers);

router.delete('/deleteMessage', chatController.deleteMessage);

router.post('/groupCreateAccess', chatController.groupCreateAccess);

router.get('/groupCreateAccessUserList', chatController.groupCreateAccessUserList);

router.put('/updateFileDownloadStatus', passport.authenticate('jwt', { session: false }), Authentication(), chatController.updateFileDownloadStatus);

router.get('/getGroupFiles', passport.authenticate('jwt', { session: false }), Authentication(), chatController.getGroupFiles);

router.get('/groupCreateAccessDetails', passport.authenticate('jwt', { session: false }), Authentication(), chatController.groupCreateAccessDetails);

router.get('/getureadMessageDetails', passport.authenticate('jwt', { session: false }), Authentication(), chatController.getunreadMessageDetail);

router.post('/forwardMessage', chatController.forwardmessage)

router.post('/getGroupDetails', passport.authenticate('jwt', { session: false }), Authentication(), chatController.getgroupdetails)

router.get('/getTeamProjectUsers', passport.authenticate('jwt', { session: false }), Authentication(), chatController.getTeamprojectUsers)

router.get('/checkGroupExists/:group_name', passport.authenticate('jwt', { session: false }), Authentication(), chatController.checkGroupexists)










module.exports = router;
