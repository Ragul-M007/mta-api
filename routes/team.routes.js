var express = require('express');
const TeamController = require('../controllers/team.controller');
const { Authentication } = require('../utils/authenticate');
const TeamsRouter = express.Router();
const FileUpload = require('../utils/file');
const passport = require('passport')

TeamsRouter.post('/',passport.authenticate('jwt', { session: false }),Authentication(),TeamController.create)
TeamsRouter.get('/',passport.authenticate('jwt', { session: false }),Authentication(),TeamController.getAllteams)
TeamsRouter.get('/:team_id',passport.authenticate('jwt', { session: false }),Authentication(),TeamController.getTeamsById)
TeamsRouter.put('/:team_id',passport.authenticate('jwt', { session: false }),Authentication(),TeamController.updateTeams)
TeamsRouter.delete('/:team_id',passport.authenticate('jwt', { session: false }),Authentication(),TeamController.deleteTeams)
TeamsRouter.post('/addUsersbyTeam',passport.authenticate('jwt',{ session: false}),Authentication(),TeamController.addUserbyTeam)
TeamsRouter.get('/getTeamUsers/:team_id',passport.authenticate('jwt', {session: false}),Authentication(),TeamController.getTeamUsers)
TeamsRouter.post('/deleteUserbyTeam',passport.authenticate('jwt', {session: false}),Authentication(),TeamController.deleteUserbyTeam)
TeamsRouter.post('/deleteProjectbyTeam',passport.authenticate('jwt', {session: false}),Authentication(),TeamController.deleteProjectbyTeam)

module.exports = TeamsRouter;
 