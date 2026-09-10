/**
 * @author Bharathraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 3:12:11
 * @desc [description]
 */

 var express = require('express');
 const ProjectsController = require('../controllers/projects.controller');
 const { Authentication } = require('../utils/authenticate');
 const ProjectsRouter = express.Router();
 const FileUpload = require('../utils/file');
const passport = require('passport')
 // 
 /* ------------------------------- Create pawn Details ------------------------------ */
 ProjectsRouter.post('/',passport.authenticate('jwt', { session: false }),Authentication(),FileUpload.base64ToImage("project_img", "project_img"), ProjectsController.create)
 
 /* -------------------------------- Get pawn -------------------------------- */
 ProjectsRouter.get('/',passport.authenticate('jwt', { session: false }),Authentication(), ProjectsController.fetch)

  /* -------------------------------- Get pawn -------------------------------- */
  ProjectsRouter.get('/getUnMappedProjects',passport.authenticate('jwt', { session: false }),Authentication(), ProjectsController.unMappedProjects)
 
 /* -------------------------------- update all  pawn -------------------------------- */
 ProjectsRouter.put('/:project_id',passport.authenticate('jwt', { session: false }),Authentication(),FileUpload.base64ToImage("project_img", "project_img"), ProjectsController.update)
 
 /* -------------------------------- delete  pawn -------------------------------- */
 ProjectsRouter.delete('/:project_id', ProjectsController.delete)
 
 ProjectsRouter.post('/mapCategory',passport.authenticate('jwt', { session: false }),Authentication(), ProjectsController.mapCategory)

 ProjectsRouter.post('/syncSpecialCategoriesForProject',passport.authenticate('jwt', { session: false }),Authentication(), ProjectsController.syncSpecialCategoriesForProject)

 ProjectsRouter.put('/putCategory/:user_id',passport.authenticate('jwt', { session: false }),Authentication(), ProjectsController.putCategory)
 
 ProjectsRouter.post('/mapUsers',passport.authenticate('jwt', { session: false }),Authentication(), ProjectsController.mapUsers)
 
 ProjectsRouter.post('/addDocument',passport.authenticate('jwt', { session: false }),Authentication(),FileUpload.fileUpload.single('file'),ProjectsController.addDocument)

 ProjectsRouter.put('/editDocument/:document_id',passport.authenticate('jwt', { session: false }),Authentication(),FileUpload.base64ToImage("file", "file"),  ProjectsController.editDocument)

 ProjectsRouter.get('/getDocuments',passport.authenticate('jwt', { session: false }),Authentication(),  ProjectsController.getDocuments)

 ProjectsRouter.delete('/document/:project_id',passport.authenticate('jwt', { session: false }),Authentication(),  ProjectsController.deleteDocuments)

 ProjectsRouter.get('/getmappedUser',passport.authenticate('jwt', { session: false }),Authentication(),  ProjectsController.getmappedUser)
 
 ProjectsRouter.get('/getmappedUserRights',passport.authenticate('jwt', { session: false }),Authentication(),  ProjectsController.getmappedUserRights)
 
 ProjectsRouter.delete('/mappedUser/:userid/:projectid',passport.authenticate('jwt', { session: false }),Authentication(),  ProjectsController.deleteMapuser)

 ProjectsRouter.delete('/deleteCategoryMapUser/:user_id/:project_id/:category_id',passport.authenticate('jwt', { session: false }),Authentication(),  ProjectsController.deleteCategoryMapUser)
 
 ProjectsRouter.get('/getProject/:project_id',passport.authenticate('jwt',{ session: false }), ProjectsController.getProject)

 ProjectsRouter.post('/addProjectsinTeams',passport.authenticate('jwt',{ session: false }), ProjectsController.projectsAddInTeam)

 ProjectsRouter.get('/getProjectsByTeam/:teams_id',passport.authenticate('jwt',{ session: false }), ProjectsController.getProjectByTeam)

 ProjectsRouter.get('/documentUploadtoS3',ProjectsController.projectDocumentsByProjectId)

 ProjectsRouter.post('/deleteCategoryDocuments',ProjectsController.deleteCategoryDocuments);

 ProjectsRouter.post('/currentProject',ProjectsController.currentProject)

 module.exports = ProjectsRouter;
 