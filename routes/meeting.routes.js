/**
 * @author Sameena Begum S
 * @email sameenabegum.s@skeintech.com
 * @create date 2024-08-21
 * @desc [description]
 */

const express = require('express');
const router = express.Router();
const MeetingController = require('../controllers/meeting.controller');
const passport = require('passport')
const { Authentication } = require('../utils/authenticate');


// Create group routes
router.post('/createmeeting', passport.authenticate('jwt', { session: false }), Authentication(), MeetingController.createMeeting);

//update group routes

router.put('/updatemeeting', passport.authenticate('jwt', { session: false }), Authentication(), MeetingController.updateMeeting);

//get meeting by meeting id 
router.get('/getmeeting/:meeting_id', MeetingController.fetchMeeting);

//get upcoming meeting details 
router.get('/getupcomingmeeting', passport.authenticate('jwt', { session: false }), Authentication(), MeetingController.upcomingMeeting)

//delete meeting
router.delete('/deletemeeting', passport.authenticate('jwt', { session: false }), Authentication(), MeetingController.deleteMeeting)

router.get('/getCalendar', MeetingController.getCalendarDetails);

//access details
router.get('/accessdetails/:user_id', passport.authenticate('jwt', { session: false }), Authentication(), MeetingController.acessDetails)

//fetch teams
router.get('/allteams', passport.authenticate('jwt', { session: false }), Authentication(), MeetingController.fetchAllTeams)

//fetch projects
router.get('/allprojects',passport.authenticate('jwt', { session: false }), Authentication(),MeetingController.fetchAllProjects)

//fetch Imeetify integration
router.get('/imeetifyIntegrationList',passport.authenticate('jwt', { session: false }), Authentication(),MeetingController.fetchImeetifyIntegration)


















module.exports = router;
