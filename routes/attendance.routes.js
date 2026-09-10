/**
 * @author Bharathraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-23 3:12:11
 * @desc [description]
 */

 var express = require('express');
 const AttendanceController = require('../controllers/attendance.controller');
 const { Authentication } = require('../utils/authenticate');
 const AttendanceRouter = express.Router();
 const FileUpload = require('../utils/file');
const passport = require('passport')
 // 
 /* ------------------------------- Create Category Details ------------------------------ */
 AttendanceRouter.post('/',passport.authenticate('jwt', { session: false }),Authentication(),AttendanceController.create)
 
 /* -------------------------------- Get Category -------------------------------- */
 AttendanceRouter.get('/',passport.authenticate('jwt', { session: false }),Authentication(), AttendanceController.fetch)
 AttendanceRouter.get('/attendancecounts', AttendanceController.attendanceCounts)
 AttendanceRouter.get('/updateattendancecounts', AttendanceController.updateAttendanceCounts)
 /* -------------------------------- update all  Category -------------------------------- */
 AttendanceRouter.put('/:project_id', AttendanceController.update)
 
 /* -------------------------------- delete  Category -------------------------------- */
 AttendanceRouter.delete('/:project_id', AttendanceController.delete)

 /* -------------------------------- delete  Category -------------------------------- */
 AttendanceRouter.post('/attendanceReport',AttendanceController.attendanceReport)
 
 
 
 
 module.exports = AttendanceRouter;
 