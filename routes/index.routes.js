/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 1:07:11
 * @desc [description]
 */
var express = require('express');

// router instance
var router = express.Router();

// User Details router instance
var userRouter = require('./users.routes');
router.use('/users', userRouter)
// Project
var ProjectsRouter = require('./projects.routes');
router.use('/projects', ProjectsRouter)

// Categories
var CategoriesRouter = require('./categories.routes');
router.use('/categories', CategoriesRouter)

// Attendance
var AttendanceRouter = require('./attendance.routes');
router.use('/attendance', AttendanceRouter)

// Utilities
var UtilsRouter = require('./utils.routes');
router.use('/utils', UtilsRouter)

//Location
var LocationRouter = require('./location.route');
router.use('/location', LocationRouter)

//Newsfeed
var NewsfeedRouter = require('./newsfeed.routes');
router.use('/newsfeed', NewsfeedRouter)

//Teams
var TeamRouter = require('./team.routes');
router.use('/teams', TeamRouter)

//Chat
var ChatRouter = require('./chat.routes');
router.use('/chat', ChatRouter)

//Meeting
var MeetingRouter = require('./meeting.routes');
router.use('/meeting', MeetingRouter)



module.exports = router