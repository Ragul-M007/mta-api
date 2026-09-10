const { Message } = require("../utils/messages");
const Response = require("../utils/response");
const AppErrorHandler = require("../utils/error-handler");
const TeamModal = require("../models/team.model");
const ProjectModel = require("../models/projects.model.js");
const { StatusCodes } = require("http-status-codes");
const jwt = require('jsonwebtoken');
const moment = require('moment')
const chatModel = require('../models/chat.model');

const TeamController = {

    async create(req,res){
        let {team_name, description} = req.body
        let {created_by} = req.user
        
        try{
            let [AlreadyExists] = await TeamModal.checkTeam(team_name);
            if(AlreadyExists.length == 0){
                let [team] = await TeamModal.create({
                    team_name, description, created_by
                })
                if(team.affectedRows == 1){
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Creation("Team"))
                }
                else{
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Creation("Team"))
                }
            }else{
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Team"))
            }
        }
        catch(err){
            console.log(err)
            /**
             * ANCHOR user creation and machine creation error handler
             */
            new AppErrorHandler(res, err)
        }
    },

    async getAllteams(req,res){
        // let {category_name, description,role_id} = req.body
        const {created_by,user_id,role} = req.user;
        try{
            let teams
            if(role === "ADMIN"){
                teams = await TeamModal.getAllteams(created_by)
            }else{
                teams = await TeamModal.getAllteams(created_by,user_id)
            }
            if(teams[0].length > 0){
                // for (let i = 0; i < teams[0].length; i++) {
                //     const {team_id} = teams[0][i];
                //     console.log('teamsDetails-->',team_id)
                //     const group_type = 'team';
                //     const groupData = {
                //         user_id,
                //         group_type,
                //         team_id
                //     }
                //     const [getTotalUnReadMessageCount]=await chatModel.getTotalUnReadMessageCount(groupData);
                //     const count = getTotalUnReadMessageCount[0].totalUnReadMessageCount == null 
                //     || getTotalUnReadMessageCount[0].totalUnReadMessageCount == 0 ? 0 : getTotalUnReadMessageCount[0].totalUnReadMessageCount;
                //     console.log('count-->',count)
                //     teams[0][i].totalUnReadMessageCount = parseInt(count);
                // }
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("teams"),
                    teams[0]
                )
            }else{
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("teams"),
                )
            }

        }
        catch(err){
            console.log(err)
            /**
             * ANCHOR user creation and machine creation error handler
             */
            new AppErrorHandler(res, err)
        }
    },

    async getTeamsById(req,res){
        // let {category_name, description,role_id} = req.body
        const {created_by} = req.user;
        const {team_id} = req.params;
        try{
            let [teams] = await TeamModal.getTeamsById(team_id,created_by)
            if(teams.length > 0){
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("teams"),
                    teams
                )
            }else{
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("teams"),
                )
            }

        }
        catch(err){
            console.log(err)
            /**
             * ANCHOR user creation and machine creation error handler
             */
            new AppErrorHandler(res, err)
        }
    },

    async updateTeams(req,res){
       try{
        const {team_name, description} = req.body
        const {team_id} =  req.params;
        const teamData = {
            team_id,
            team_name
        }
        let [AlreadyExists] = await TeamModal.checkTeamDuplication(teamData);
        if(AlreadyExists.length > 0){
            let [users] = await TeamModal.UpdateTeams(team_id,req.body)
            if(users.affectedRows === 1){
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Team"))
            }
            else{
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Team"))
            }
        }else{
        let [AlreadyExists1] = await TeamModal.checkTeamDuplication1(teamData);
            if(AlreadyExists1.length == 0){
                let [users] = await TeamModal.UpdateTeams(team_id,req.body)
                if(users.affectedRows === 1){
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Team"))
                }
                else{
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Team"))
                }

            }else{
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Team"))
            }
        }
       }catch(err){
        console.log(err)
       }
    },

    async deleteTeams(req,res){
        const {team_id} = req.params
 
        try{
            let [teamusers] = await TeamModal.teamUsers(team_id);
            let [teamprojects] = await TeamModal.teamProjects(team_id);
            if(teamusers.length == 0 && teamprojects.length == 0){
                let [users] = await TeamModal.deleteTeams(team_id);
                let [deleteTeamProject] = await TeamModal.deleteTeamLinkProject(team_id);
                if(users.affectedRows === 1){
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Team"))
                }
                else{
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Team"))
                }
            }else{
                new Response(res, StatusCodes.OK)._ErrorMessage("The team cannot be deleted because projects and users are mapped to this team.")
            }
        }catch(err){
         console.log(err)
        }
     },

     async addUserbyTeam(req,res){
        const {users_id,team_id} = req.body
 
        try{
        if(users_id.length > 0){
            let [checkUsers] = await TeamModal.getTeamsUsersByUserId(users_id,team_id);
            if(checkUsers.length === 0){
            users_id.map(async(i,j)=>{
                var user_id = i
            let [updateUsers] = await TeamModal.addUsersinTeams({user_id,team_id})
            if(users_id.length === j+1){
            if(updateUsers.affectedRows){
                let [getProjects] = await TeamModal.getProjectsByTeamId(team_id)
                 for(i=0;   i < getProjects.length; i++){
                    users_id.map(async(i)=> {
                       getProjects.map(async(j)=>{
                        let DataLoad = {
                            project_id:j.project_id,
                            user_id:i
                        }
                    let response = await ProjectModel.mapUsers(DataLoad);

                // Project Users Rights Assigning 
                let project_id = DataLoad.project_id
                let getUser_Id = DataLoad.user_id

                var putData = {"project_id": project_id, "user_id":getUser_Id};
                let users_id = user_id
                let getViewRights = await ProjectModel.getDocuments({project_id,users_id});
                let vw_rights_docs = []
                getViewRights[0].map((i)=>{
                    vw_rights_docs.push(i.document_id)
                })
                vw_rights = vw_rights_docs;
                Object.assign(putData,({'vw_rights': vw_rights}));
                let [mapped] = await ProjectModel.putCategory(putData); 
                })
                })
                }

            new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Creation("Team Users"))
            }
            else{
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Creation("Team"))
            }
            }
            })
            }else{
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Users in Teams"))
            }
        }
 
        }catch(err){
         console.log(err)
        }
     },

     async getTeamUsers(req,res){
        const { team_id } = req.params 
        try{
            let [teams] = await TeamModal.getTeamUsers(team_id)
            if(teams.length > 0){
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Teams users"),
                    teams
                )
            }else{
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Teams users"),
                )
            }

        }
        catch(err){
            console.log(err)
            /**
             * ANCHOR user creation and machine creation error handler
             */
            new AppErrorHandler(res, err)
        }
     },

     async deleteUserbyTeam(req,res){
        const { user_id,team_id } = req.body
        const { created_by } = req.user;
        let [getProject] = await ProjectModel.find({user_id,created_by})
        getProject.map(async(i)=>{
            let projectid = i.project_id
            let userid = user_id
             let [deleteUsers] = await ProjectModel.deleteMapUser({ userid, projectid })
        })
        let [getUsers] = await TeamModal.deleteTeamUsersbyTeamId(team_id,user_id);
         
            if(getUsers.affectedRows > 0){
                // Other team project mapped to this user
                let addedUser = await TeamController.userAddedIntoTeam(user_id);
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Team"))
            }
            else{
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Team"))
            }
     },

     async userAddedIntoTeam(user_id){
        if(user_id){
            let [getTeams] = await TeamModal.getTeamsByUserId(user_id);
            console.log('getTeams-->',getTeams)
            if(getTeams.length > 0){
                let userId = [user_id]
                for (let index = 0; index < getTeams.length; index++) {
                    const teamId = getTeams[index].team_id;
                    let [getProjects] = await TeamModal.getProjectsByTeamId(teamId)
                    for(i=0;   i < getProjects.length; i++){
                        userId.map(async(i)=> {
                          getProjects.map(async(j)=>{
                           let DataLoad = {
                               project_id:j.project_id,
                               user_id:i
                           }
                       let response = await ProjectModel.mapUsers(DataLoad);
        
                   // Project Users Rights Assigning 
                   let project_id = DataLoad.project_id
                   let getUser_Id = DataLoad.user_id
                   var putData = {"project_id": project_id, "user_id":getUser_Id};
                   let users_id = userId
                   let getViewRights = await ProjectModel.getDocuments({project_id,users_id});
                   let vw_rights_docs = []
                   getViewRights[0].map((i)=>{
                       vw_rights_docs.push(i.document_id)
                   })
                   vw_rights = vw_rights_docs;
                   Object.assign(putData,({'vw_rights': vw_rights}));
                   let [mapped] = await ProjectModel.putCategory(putData); 
                   })
                   })
                   }
                    
                }
            }
        }else{
            console.log("UserId---->",user_id);
        }
     },
     
    //  async deleteProjectbyTeam(req,res){
    //     const { project_id,team_id } = req.body
    //     let [getUsers] = await TeamModal.deleteTeamProjectbyTeamId(team_id,project_id)
    //     let [deleteTeamProjects] = await TeamModal.deleteTeamProjects(team_id,project_id)
    //     let [teamUsers] = await TeamModal.getTeamUsers(team_id);
    //        if(teamUsers.length > 0){
    //         teamUsers.map(async(i)=>{
    //             let user_id = i.user_id
    //             let projectid = project_id
    //          let [deleteUsers] = await ProjectModel.deleteMapUser({ userid, projectid })
    //         })
    //        }
    //         if(getUsers.affectedRows > 0){
    //             new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Team"))
    //         }
    //         else{
    //             new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Team"))
    //         }
    //  }

    async deleteProjectbyTeam(req, res) {
        const { project_id, team_id } = req.body;

        try {
            let [getUsers] = await TeamModal.deleteTeamProjectbyTeamId(team_id, project_id);

            let [deleteTeamProjects] = await TeamModal.deleteTeamProjects(team_id, project_id);

            let [teamUsers] = await TeamModal.getTeamUsers(team_id);

            // ✅ Proper async handling
            if (teamUsers.length > 0) {
            for (const i of teamUsers) {
                let userid = i.user_id;
                let projectid = project_id;

                await ProjectModel.deleteMapUser({
                userid,   // ✅ fixed key
                projectid
                });
            }
            }

            // ✅ Response
            if (getUsers.affectedRows > 0) {
            new Response(res)._SuccessResponse(
                Message.Common.SuccessMessage.Deletion("Team")
            );
            } else {
            new Response(res, StatusCodes.OK)._ErrorMessage(
                Message.Common.FailureMessage.Deletion("Team")
            );
            }

        } catch (err) {
            new AppErrorHandler(res, err);
        }
    }

}

module.exports = TeamController