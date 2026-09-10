/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 12:01:11
 * @desc [description]
 */

/* --------------------------------- Imports starts here -------------------------------- */


const { Message } = require("../utils/messages");
const Response = require("../utils/response");
const AppErrorHandler = require("../utils/error-handler");
const ProjectModel = require("../models/projects.model.js");
const UtilsController = require('../controllers/utils.controller');
const categoriesModel = require("../models/categories.model");
const TeamModal = require("../models/team.model");
const UserModel = require('../models/user.model')
const { StatusCodes } = require("http-status-codes");
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { isNull } = require("underscore");
const {diacriticsMap} = require("../utils/dicretics");
const PushNoti = require("../utils/push-notification");
const logger = require('../utils/winston')
const fs = require('fs');
const AWS = require('aws-sdk');
const shortid = require('shortid');
const path = require('path');
const { toLower, reject } = require("lodash");
require('dotenv').config();
const {Category, Group_type,AWS_file_type,getCategoryBucketName,getCategoryFolderType} = require('../utils/chat');
const chatModel = require('../models/chat.model');
const { log } = require("console");
const {
  AWS_KEY_ID, AWS_SECRET_KEY, AWS_REGION, AWS_BUCKET_NAME,APP_BASE_PATH,GFC_BUCKET,PROJECT_COMPLETED_BUCKET
} = process.env;

const getSpecialCategoryNames = () => {
    if (Array.isArray(Category.special_category_names) && Category.special_category_names.length > 0) {
        return Category.special_category_names;
    }
    return [Category.category_name].filter(Boolean);
}

const isSpecialCategory = (categoryName) => {
    if (!categoryName) {
        return false;
    }
    return getSpecialCategoryNames().includes(categoryName);
}

/* --------------------------------- Imports ends here -------------------------------- */



/* ----------------------- Customer controller starts here ---------------------- */

const ProjectsController = {




    /**
     * ANCHOR user creation 
     * @param {*} req 
     * @param {*} res 
     */
    async create(req, res) {

        // getting request from body
        let {project_name, description, state, city,address, status,project_img, start_date,end_date,latitude,longitude} = req.body
        let {
            user_id,created_by
        } = req.user

        let [project_name_duplicate] = await ProjectModel.find({
            project_name
        })
        
        if(project_name_duplicate.length == 1){
            new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Project"))
        }
        if(project_name_duplicate.length == 0){  
            
        if(project_img == null){
            project_img=""
        }

            function removeDicretics(str) {
                return str.replace(/[^\u0000-\u007E]/g, function (weirdo) {
                    return diacriticsMap[weirdo] || weirdo;
                });
              }

              var cleanStr = removeDicretics(req.body.city); // bullshit  
              city = cleanStr;


            try {

            let [project] = await ProjectModel.create({
                project_name, description, state, city,address, status,project_img, start_date,end_date,latitude,longitude,created_by
            })

            

            if (project.insertId) {
     
                let [GetAdmins] = await UserModel.GetAllAdmin(created_by)
                console.log("Admin default add in Project",GetAdmins)
               
                 var pro = GetAdmins.map(item =>{
                    return{
                        'user_id':item.user_id,
                        'project_id':project.insertId
                    }
                })
                
                var [UserProj] = await ProjectModel.mapUsers(pro);

                // Special categories (CAD-GFC and OFFER & CONTACT DETAILS) are auto-linked to new projects.
                const [categoryDetails] = await categoriesModel.getCategoryDetailsByNames(getSpecialCategoryNames());
                let isCategoryMappingSuccess = true;
                if (categoryDetails.length > 0) {
                    for (let i = 0; i < categoryDetails.length; i++) {
                        const dataLoad = {
                            project_id: project.insertId,
                            category_id: categoryDetails[i].category_id
                        }
                        let [mapped] = await ProjectModel.mapCategory(dataLoad);
                        if (mapped.affectedRows <= 0) {
                            isCategoryMappingSuccess = false;
                        }
                    }
                }

                if (UserProj.affectedRows > 0 && isCategoryMappingSuccess) {
                    res.send(
                        {
                        status:true,
                        Message:"Project Created successfully",
                        data:project}
                    );
                } else {
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Creation("Project"))
                }
            } else {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Project"))
            }

        }
        catch (err) {

            console.log(err)
            /**
             * ANCHOR user creation and machine creation error handler
             */
            new AppErrorHandler(res, err)
        }
    }
    },



    /* ---------------------------- Get Customer Details ---------------------------- */
    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
    async fetch(req, res) {
        try {
            let {
                created_by,
                role
            } = req.user
            let {
                user_id
            } = req.query
            let [user] = await ProjectModel.find({
                user_id,role,created_by
            })
            if (user.length) {
                // for (let i = 0; i < user.length; i++) {
                //     const {project_id} = user[i];
                //     const group_type = 'project';
                //     const groupData = {
                //         user_id,
                //         group_type,
                //         project_id
                //     }
                //     console.log('groupData-->',groupData)
                //     const [getTotalUnReadMessageCount]=await chatModel.getTotalUnReadMessageCount(groupData);
                //     const count = getTotalUnReadMessageCount[0].totalUnReadMessageCount == null 
                //     || getTotalUnReadMessageCount[0].totalUnReadMessageCount == 0 ? 0 : getTotalUnReadMessageCount[0].totalUnReadMessageCount;
                //     console.log('count-->',count)
                //     user[i].totalUnReadMessageCount = parseInt(count);   
                // }
                let currentProjectDetails = {
                    "project_id": null,
                    "project_name": null,
                    "project_img": null,
                    "city": null,
                    "state": null,
                    "latitude": null,
                    "longitude": null,
                    "address": null,
                    "status": null,
                    "start_date": null,
                    "end_date": null,
                    "description": null
                }
                const [getProject] = await ProjectModel.getcurrentProject(user_id);
                if(getProject.length > 0){
                    currentProjectDetails = getProject[0]
                }
                // if users found
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Project"),
                    user,
                    currentProjectDetails
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Project"),
                )
            }
        }
        catch (err) {


            console.log(err)
            // if something went wrong
            new AppErrorHandler(
                res,
                err
            )
        }
    },

    async unMappedProjects(req,res){
        // let {category_name, description,role_id} = req.body
        const {created_by} = req.user;
        console.log('created_by-->',created_by)
        try{
            let [projects] = await ProjectModel.getUnmappedProjectData(created_by);
            if(projects.length > 0){
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Projects"),
                    projects
                )
            }else{
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Projects"),
                )
            }

        }
        catch(err){
            console.log(err)
            /**
             * ANCHOR user creation and machine creation error handler
             */
            new Response(res,StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError); 
        }
    },

    /* --------------------------- Get Customer Details ends here -------------------------- */





    // update
    /**
           * 
           * @param {*} req 
           * @param {*} res 
           */
    async update(req, res) {

        // getting request from body
        // let { status } = req.body;
        let {project_name, description, state, city,address, status,project_img, start_date,end_date,latitude,longitude} = req.body
        let { project_id } = req.params
        try {
            // if (customer_image) {
            //     let [customer] = await ProjectModel.find({
            //         customer_id
            //     })
            //     if (customer.length && customer[0].customer_image) {
            //         customer.forEach(async item => {
            //             let path = `${process.env.APP_BASE_PATH}public/uploads/${item.customer_image}`
            //             try {
            //                 await fs.unlink(path)
            //                 logger.info(`DELETED ${path}`)
            //             }
            //             catch (err) {
            //                 logger.info(err)
            //             }
            //         })
            //     }
            // }
            // else {
            //     customer_image = null
            // }
            const projectData = {
                project_id,
                project_name
            }
            let [project_name_duplicate] = await ProjectModel.checkProjectDuplication(projectData)
            if(project_name_duplicate.length > 0){
                function removeDicretics(str) {
                    return str.replace(/[^\u0000-\u007E]/g, function (weirdo) {
                        return diacriticsMap[weirdo] || weirdo;
                    });
                }
                var cleanStr = removeDicretics(req.body.city); // bullshit  
                city = cleanStr;
                let [projectdetails] = await ProjectModel.findByIdAndUpdate(project_id, {project_name, description, state, city,address, status,project_img, start_date,end_date,latitude,longitude})
                // CustomerDetails updatedted successfully
                if (projectdetails.affectedRows) {
                    // sending success response to client
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Project"))
                }
                else {
                    // failed response
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Project"))
                }
            }else{
                let [project_name_duplicate] = await ProjectModel.checkProjectValidation(project_name);
                if(project_name_duplicate.length == 0){
                    function removeDicretics(str) {
                        return str.replace(/[^\u0000-\u007E]/g, function (weirdo) {
                            return diacriticsMap[weirdo] || weirdo;
                        });
                    }
                    var cleanStr = removeDicretics(req.body.city); // bullshit  
                    city = cleanStr;
                    let [projectdetails] = await ProjectModel.findByIdAndUpdate(project_id, {project_name, description, state, city,address, status,project_img, start_date,end_date,latitude,longitude})
                    // CustomerDetails updatedted successfully
                    if (projectdetails.affectedRows) {
                        // sending success response to client
                        new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Project"))
                    }
                    else {
                        // failed response
                        new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Project"))
                    }
                }else{
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Project"))
                }
                // new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Project"))
            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },
    // delete
    /**
       * 
       * @param {*} req 
       * @param {*} res 
       */
    async delete(req, res) {

        // getting request from query params
        let { project_id } = req.params
        try {
            let [deletecustomer] = await ProjectModel.findByIdAndDelete(project_id)
            if (deletecustomer.affectedRows) {
                
                let [getTeamsProjects] = await ProjectModel.getProjectsbyTeams(project_id)
                if(getTeamsProjects.length > 0){
                    let [deleteasigning] = await ProjectModel.deleteProjectInTeams(project_id)
                    let [deleteTeamProjects] = await TeamModal.deleteProjectTeamUser(project_id)
                    let [deleteNotification] = await ProjectModel.deleteNotification(project_id)
                }

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Project"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Project"))

            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },

    async mapCategory(req,res){
        let {project_id,category_id} = req.body;
        try {

            category_id.map(async(item, index)=>{
                const dataLoad = {
                    project_id:project_id,
                    category_id : item
                }
                let [mapped] = await ProjectModel.mapCategory(dataLoad);
                
                if(index === category_id.length -1){
                    if (mapped.affectedRows) {
                        // sending success response to client
                        new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Categories"))
                    }
                    else {
                        // failed response
                        new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Categories"))
                    }
                }
            })

        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },

    async syncSpecialCategoriesForProject(req, res) {
        let { project_id } = req.body;

        if (!project_id) {
            new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Project"))
            return;
        }

        project_id = Number(project_id);
        if (Number.isNaN(project_id) || project_id <= 0) {
            new Response(res, StatusCodes.OK)._ErrorMessage("Invalid project_id")
            return;
        }

        try {
            const [categoryDetails] = await categoriesModel.getCategoryDetailsByNames(getSpecialCategoryNames());

            if (categoryDetails.length === 0) {
                new Response(res, StatusCodes.OK)._ErrorMessage("Special categories not found in available categories")
                return;
            }

            const targetCategoryIds = categoryDetails.map((item) => item.category_id);
            const [mappedCategories] = await ProjectModel.getMappedProjectCategoryIds(project_id, targetCategoryIds);
            const mappedCategoryIdSet = new Set(mappedCategories.map((item) => item.category_id));

            const missingCategories = categoryDetails.filter((item) => !mappedCategoryIdSet.has(item.category_id));

            let addedCount = 0;
            for (const category of missingCategories) {
                const dataLoad = {
                    project_id,
                    category_id: category.category_id
                }
                const [mapped] = await ProjectModel.mapCategory(dataLoad);
                if (mapped.affectedRows > 0) {
                    addedCount += 1;
                }
            }

            new Response(res, StatusCodes.OK)._SuccessResponse(
                "Project categories synchronized successfully",
                {
                    project_id,
                    requested_category_names: getSpecialCategoryNames(),
                    already_mapped_count: mappedCategories.length,
                    added_count: addedCount,
                    total_target_count: categoryDetails.length
                }
            )
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },
    
    async putCategory(req,res){
        
        let {user_id,product_id,document,vw_rights} = req.body;
        try {

            var putData = req.body;

            let getViewRights = await ProjectModel.getVwRights(putData);
            let vw_rights_docs = getViewRights[0][0].vw_rights
            if(vw_rights_docs ==  null){
                vw_rights = document;
                delete putData.vw_rights;
                Object.assign(putData,({'vw_rights': vw_rights}));
                console.log("UPDATE7",putData)
                let [mapped] = await ProjectModel.putCategory(putData);  

                if (mapped.affectedRows) {

                    // sending success response to client
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("User Rights"))
    
                }
                else {
                    // failed response
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("User Rights"))
    
                }
            }
            else{
                if(vw_rights == 0){
                    var doc = document.toString();
                    var doc1= doc+",";
                    var doc2= ","+doc;
                    var rmdoc = vw_rights_docs.replace(doc1,"").replace(doc2,"").replace(doc,"");
                    vw_rights_docs = rmdoc;
                    delete putData.vw_rights;
                    Object.assign(putData,({'vw_rights':vw_rights_docs}));
                    console.log("UPDATE6",putData)
                    let [mapped] = await ProjectModel.putCategory(putData);

                if (mapped.affectedRows) {

                    // sending success response to client
                   new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Users Rights"))
                    // new Response(res)._ErrorMessage(Message.Common.SuccessMessage.Deletion("Categories"))
                }
                else {
                    // failed response
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("User Rights"))
    
                }
                }
                else{
                vw_rights = vw_rights_docs+","+document;
                delete putData.vw_rights;
                Object.assign(putData,({'vw_rights':vw_rights}));
                console.log("------>",putData)
                console.log("UPDATE5",putData)
                let [mapped] = await ProjectModel.putCategory(putData);

                if (mapped.affectedRows) {

                    // sending success response to client
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("User Rights"))
    
                }
                else {
                    // failed response
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("User Rights"))
    
                }
            }
            }
          
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },

    async mapUsers(req,res){
        let {project_id,category_id,user_id,project_role} = req.body;
        try {
            user_id=JSON.parse(user_id);

            const ref = user_id.map(item=>{
                return {
                    project_id:project_id,
                    category_id : category_id,
                    user_id:item,
                    project_role:project_role
                }
            })
            let [mapped] = await ProjectModel.mapUsers(ref);
            if (mapped.affectedRows) {

            // assigning teams
            console.log("111--->",project_id);
            console.log("222--->",user_id);

                let [getTeamsProjects] = await ProjectModel.getProjectsbyTeams(project_id);
                // let team_id = getTeamsProjects[0].team_id;
                // console.log("TEAMS ADDED--->",user_id,team_id,project_id);
                getTeamsProjects.map(async(i)=>{
                    let team_id = i.team_id
                    let [updateUsers] = await TeamModal.addUsersinTeams({user_id,team_id,project_id})
                })
            // Rights Assigning Function Start
            if(category_id){
                
                // Category Users Rights Assigning 
                var putData = {"project_id": ref[0].project_id, "user_id":ref[0].user_id,"category_id":category_id};
                let users_id = user_id
                let getViewRights = await ProjectModel.getDocuments({project_id,users_id,category_id});
                let getGlobalDocuments = await ProjectModel.getDocuments({project_id,users_id});
                let vw_rights_docs = []

                // handle rights with category documents
                getViewRights[0].map((i)=>{
                        vw_rights_docs.push(i.document_id)
                    })
                    if(getGlobalDocuments[0].length > 0){
                        getGlobalDocuments[0].map((j)=>{
                            if(j.category_id === null){
                            vw_rights_docs.push(...[j.document_id])
                            }
                        })
                    }
                    vw_rights = vw_rights_docs;
                    Object.assign(putData,({'vw_rights': vw_rights}));
                    console.log("2####",putData)
                   let [mapped] = await ProjectModel.putCategory(putData);  
    
            }
            else{
                console.log("####",ref) 
                // Project Users Rights Assigning 
                var putData = {"project_id": ref[0].project_id};
                let users_id = user_id
                let getViewRights = await ProjectModel.getDocuments({project_id,users_id});
                
                let vw_rights_docs = []
                getViewRights[0].map((i)=>{
                    vw_rights_docs.push(i.document_id)
                })
                vw_rights = vw_rights_docs;
                ref.map(async(j)=>{   
                    Object.assign(putData,({'vw_rights': JSON.stringify(vw_rights_docs), "user_id":j.user_id}));
                    console.log("ZZZZZ",putData)
                    let [mapped] = await ProjectModel.putCategory(putData);  
                })
                
            }
            // Rights Assigning Function End

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Users"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Users"))

            }
// }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    
    },
    
    async addDocument(req,res){
        var {project_id,category_id,file,file_name,user_id,description} = req.body;
        let {
            created_by,
            role
        } = req.user
        console.log('RequestUser--->',created_by)
        console.log("PAYLOAD",req.body)
        try{
            const [getDocumentDetail] = await ProjectModel.getDocumentByProjectId(project_id);
            console.log('Document--->',getDocumentDetail)
            const fileName =toLower(file_name.replaceAll(' ',''));
            console.log('file_name-->',fileName)
            const allDocumentName = await getDocumentDetail.map((item)=>{
                return toLower(item.file_name.replaceAll(' ',''));
            });
            if(!allDocumentName.includes(fileName)){
                console.log('New');
                    let ref = {
                            "project_id":project_id,
                            "category_id":category_id,
                            "file" : file,
                            "file_name":file_name,
                            "user_id":user_id,
                            "description":description
                        }
                        let [mapped] = await ProjectModel.addDocument(ref);
            
                if (mapped.affectedRows) {
                    console.log('category_name-->',req.body.category_name)
                    // Only special category files backup to the AWS S3 bucket.
                    if(isSpecialCategory(req.body.category_name)){
                        var [projectDetails] =  await ProjectModel.getProject(project_id);
                        const bucketId = 'MTA';
                        let projectName = toLower(`${projectDetails[0].project_name}`.replace(/[^\w\s]|_/gi, '-'));
                        projectName = projectName.replaceAll(' ','-')
                        await ProjectsController.documentUploadtoS3(projectName,project_id,mapped.insertId,req.body.category_name);
                    }
                    var document_id=mapped.insertId;
                    let util= UtilsController.setDeleteTime(document_id);
                    if(req.user.role === 'ADMIN'){
                        var key ={
                            "project_id":project_id
                        }
                        // Category Added Check for Category ID
                        //console.log("category_id",category_id)
                        if(category_id){
                        logger.info('Category Notification');
                        var [GetCategoryUsers] = await categoriesModel.getCategoryUsersinProject(category_id,project_id)

                        if(GetCategoryUsers.length > 0){
                            // DOCUMENTS ADD IN CATEGORY
                            //console.log("tested1")

                            let [GetAllCategory] = await categoriesModel.find({project_id})

                            //console.log("ALLCATEGORY",GetAllCategory);
                            var GetAllCategoryId = []
                            GetAllCategory.map((i)=>{
                            GetAllCategoryId.push(i.category_id)
                            })
                            // Get All Category Users
                            var [GetAllCategoryUsers] = await categoriesModel.getCategoryUsersinProject(JSON.stringify(GetAllCategoryId).replace(/[[\]]/g,''),project_id)

                            //Get All Project Users
                            var [GetAllProjectUsers] = await ProjectModel.getmappedUsers({project_id})

                            // remove to category user in all Project Users
                            var filterUsers = GetAllProjectUsers.filter(({user_id:id1}) => !GetAllCategoryUsers.some(({user_id:id2}) => id2 === id1))
                            
                            GetCategoryUsers.map((i)=>{
                                filterUsers.push(i)
                            })
                            
                            filterUsers.map(async(i,inx)=>{
                                // Document Rights Adding Function Start
                                var putData = {
                                    "user_id":i.user_id,
                                    "project_id":project_id,
                                    "document":document_id
                                    }

                                    var user_id = user_id;
                                    var document = document_id;
                                    var vw_rights = user_id;
                                    let getViewRights = await ProjectModel.getVwRights(putData);
                                
                                    let vw_rights_docs = getViewRights[0][0].vw_rights
                                    
                                            if(vw_rights_docs ==  null){
                                            vw_rights = document;
                                            delete putData.vw_rights;
                                            Object.assign(putData,({'vw_rights': vw_rights}));
                                            //console.log("putData1--->",putData)
                                            let putAcc = await ProjectModel.putCategory(putData);
                                
                                            }
                                            else{
                                                if(vw_rights == 0){
                                                    var doc = document.toString();
                                                    var doc1= doc+",";
                                                    var doc2= ","+doc;
                                                    var rmdoc = vw_rights_docs.replace(doc1,"").replace(doc2,"").replace(doc,"");
                                                    vw_rights_docs = rmdoc;
                                                    delete putData.vw_rights;
                                                    Object.assign(putData,({'vw_rights':vw_rights_docs}));
                                                //return putData
                                                //console.log("putData2--->",putData)
                                                    let putAcc = await ProjectModel.putCategory(putData);
                                                
                                                }
                                
                                                else{
                                                vw_rights = vw_rights_docs+","+document;
                                                delete putData.vw_rights;
                                                Object.assign(putData,({'vw_rights':vw_rights}));
                                                //console.log("putData3---1>",putData,inx)
                                                let putAcc = await ProjectModel.putCategory(putData);
                                                if(!isSpecialCategory(req.body.category_name)){
                                                    console.log('Other Notification');
                                                    let noti = await PushNoti.DocumentsNotification(putData)
                                                }
                                                logger.info('Category Notification---1');
                                                if(inx == filterUsers.length -1){
                                                    logger.info('Category Notification---12');
                                                    if(isSpecialCategory(req.body.category_name)){
                                                        console.log('GFC Notification');
                                                        let noti12 = await PushNoti.DocumentsNotificationForGFCAccessUser(putData, created_by)
                                                    }else{
                                                        console.log('Admin Notification');
                                                        let notificationForAdmin = await PushNoti.DocumentsNotificationForAdmin(putData,created_by)
                                                    }
                                                }
                                                    }
                                            }
                                // Document Rights Adding Function End
                        })
                        
                        }
                        else{
                            // DOCUMENTS ADD IN CATEGORY WITH OUT USERS
                            //console.log("tested2")
                            //Get All Project Users
                            var [GetAllProjectUsers] = await ProjectModel.getmappedUsers({project_id})
                            let isGfcNotificationSent = false;
                            GetAllProjectUsers.map(async(i,inx)=>{
                                    // Document Rights Adding Function Start
                                    //console.log("Listed--->",i)
                                        if(i.category_id === null){
                                            //console.log("Listed BY CAT--->",i)
                                    var putData = {
                                        "user_id":i.user_id,
                                        "project_id":project_id,
                                        "document":document_id
                                        }
    
                                        var user_id = user_id;
                                        var document = document_id;
                                        var vw_rights = user_id;
                                        let getViewRights = await ProjectModel.getVwRights(putData);
                                    
                                        let vw_rights_docs = getViewRights[0][0].vw_rights
                                        
                                                if(vw_rights_docs ==  null){
                                                vw_rights = document;
                                                delete putData.vw_rights;
                                                Object.assign(putData,({'vw_rights': vw_rights}));
                                                //console.log("putData1--->",putData)
                                                let putAcc = await ProjectModel.putCategory(putData);
                                    
                                                }
                                                else{
                                                    if(vw_rights == 0){
                                                        var doc = document.toString();
                                                        var doc1= doc+",";
                                                        var doc2= ","+doc;
                                                        var rmdoc = vw_rights_docs.replace(doc1,"").replace(doc2,"").replace(doc,"");
                                                        vw_rights_docs = rmdoc;
                                                        delete putData.vw_rights;
                                                        Object.assign(putData,({'vw_rights':vw_rights_docs}));
                                                    //return putData
                                                    //console.log("putData2--->",putData)
                                                        let putAcc = await ProjectModel.putCategory(putData);
                                                    
                                                    }
                                    
                                                    else{
                                                    vw_rights = vw_rights_docs+","+document;
                                                    delete putData.vw_rights;
                                                    Object.assign(putData,({'vw_rights':vw_rights}));
                                                    //console.log("putData3---2>",putData,inx)
                                                    let putAcc = await ProjectModel.putCategory(putData);
                                                    if(isSpecialCategory(req.body.category_name)){
                                                        if(!isGfcNotificationSent){
                                                            isGfcNotificationSent = true;
                                                            let noti12 = await PushNoti.DocumentsNotificationForGFCAccessUser(putData, created_by)
                                                        }
                                                    }else{
                                                        let noti = await PushNoti.DocumentsNotification(putData)
                                                    }
                                                    logger.info('Category Notification---2');
                                                    if(inx == GetAllProjectUsers.length -1){
                                                        logger.info('Category Notification---22');
                                                        if(!isSpecialCategory(req.body.category_name)){
                                                            let notificationForAdmin = await PushNoti.DocumentsNotificationForAdmin(putData,created_by)
                                                        }
                                                    }
                                                    }
                                                }
                                    // Document Rights Adding Function End
                                            }
                            })
                        }

                        }
                        else{
                            // DOCUMENTS ADD IN PROJECTS
                            //console.log("tested3",project_id)
                            //Get All Project Users
                            var [GetAllProjectUsers] = await ProjectModel.getmappedUsers({project_id})
                            let notification_users = []
                            GetAllProjectUsers.map(async(i,inx)=>{

                                // Document Rights Adding Function Start
                                var putData = {
                                    "user_id":i.user_id,
                                    "project_id":project_id,
                                    "document":document_id
                                    }

                                    var user_id = user_id;
                                    var document = document_id;
                                    var vw_rights = user_id;
                                    let getViewRights = await ProjectModel.getVwRights(putData);
                                
                                    let vw_rights_docs = getViewRights[0][0].vw_rights
                                    
                                            if(vw_rights_docs ==  null){
                                            vw_rights = document;
                                            delete putData.vw_rights;
                                            Object.assign(putData,({'vw_rights': vw_rights}));
                                            //console.log("putData1--->",putData)
                                            let putAcc = await ProjectModel.putCategory(putData);
                                
                                            }
                                            else{
                                                if(vw_rights == 0){
                                                    var doc = document.toString();
                                                    var doc1= doc+",";
                                                    var doc2= ","+doc;
                                                    var rmdoc = vw_rights_docs.replace(doc1,"").replace(doc2,"").replace(doc,"");
                                                    vw_rights_docs = rmdoc;
                                                    delete putData.vw_rights;
                                                    Object.assign(putData,({'vw_rights':vw_rights_docs}));
                                                //return putData
                                                //console.log("putData2--->",putData)
                                                    let putAcc = await ProjectModel.putCategory(putData);
                                                
                                                }
                                
                                                else{
                                                vw_rights = vw_rights_docs+","+document;
                                                delete putData.vw_rights;
                                                Object.assign(putData,({'vw_rights':vw_rights}));
                                                //console.log("putData3---3>",putData,inx)
                                                let putAcc = await ProjectModel.putCategory(putData);
                                                
                                                //console.log("RRR",notification_users)
                                                //console.log("QQQ",putData.user_id)
                                                //console.log("EEE",!notification_users.includes(putData.user_id))
                                                    if(!notification_users.includes(putData.user_id)){
                                                        //console.log("WWW",putData.user_id)
                                                        notification_users.push(putData.user_id)    
                                                    }
                                                    //console.log("TTT",notification_users)
                                                    if(inx === GetAllProjectUsers.length-1){
                                                        //console.log("DDD",notification_users)
                                                        delete putData.user_id;
                                                        Object.assign(putData,({'user_id':notification_users}))
                                                        console.log("notificationre");
                                                        let noti = await PushNoti.DocumentsNotification(putData)
                                                        console.log("notificationres2",noti);   
                                                        let notificationForAdmin = await PushNoti.DocumentsNotificationForAdmin(putData,created_by)

                                                    }
                                                    } //new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Document"));
                                            }
                                // Document Rights Adding Function End
                            })
                        }
                    }
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Document"))
                }
                else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Document"))
                }
            }else{
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Document title"))
                console.log('Already Exists');
            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },

    async documentUploadtoS3(projectName,project_id,document_id,categoryName){

        const folderData = {
            project_id,
            "type" : getCategoryFolderType(categoryName),
            "fallbackType" : "category"
        }
        // Set the bucketName 
        const bucketName = getCategoryBucketName(categoryName);
        const [folderDetails] = await ProjectModel.getS3FolderData(folderData);
        projectName = projectName.replace(/^-+|-+$/g, '');
        if(folderDetails.length > 0){
            const [getDocumentData] = await ProjectModel.getDocumentData(document_id);
            if(getDocumentData.length > 0){
                console.log('Document Data --->',getDocumentData[0].file_name)
                const folderName = folderDetails[0].folder_name;
                const filePath = `${APP_BASE_PATH}public/uploads/${getDocumentData[0].file}`; // Update with your file path
                const fileExtension = path.extname(filePath);
                // const fileUniqueId = 'MTA';
                let file_name = toLower(`${getDocumentData[0].file_name}`.replace(/[^\w\s]|_/gi, '-'));
                file_name = file_name.replaceAll(' ','-')
                const fileDetails = await awsUpload(filePath,fileExtension,file_name,folderName,bucketName);
                console.log('fileDetails-->',fileDetails)
                if(fileDetails.key != ''){
                    const {Location,key} = fileDetails; 
                    const data = {
                        project_id,
                        type : AWS_file_type.Type_2,
                        document_id,
                        s3_key : key,
                        bucket_name : bucketName
                    }
                    const [folderDetails] = await ProjectModel.createS3UploadedFileDetails(data);
                } 
            }
        }else{
            const createS3Folder = await projectS3FolderCreation(projectName,bucketName);
            if(createS3Folder){
                console.log('createS3Bucket111--->',createS3Folder);
                const s3folderData = {
                    "folder_name" : createS3Folder.Key,
                    "project_id" : project_id,
                    "type" : folderData.type
                }
                const [createS3FolderInDB] = await ProjectModel.createS3FolderDetails(s3folderData);
                console.log(`Bucket created successfully`);
                const [getDocumentData] = await ProjectModel.getDocumentData(document_id);
                if(getDocumentData.length > 0){
                    console.log('Document Data --->',getDocumentData[0].file_name)
                    const folderName = createS3Folder.Key;
                    const filePath = `${APP_BASE_PATH}public/uploads/${getDocumentData[0].file}`; // Update with your file path
                    const fileExtension = path.extname(filePath);
                    // const fileUniqueId = 'MTA';
                    let file_name = toLower(`${getDocumentData[0].file_name}`.replace(/[^\w\s]|_/gi, '-'));
                    file_name = file_name.replaceAll(' ','-')
                    const fileDetails = await awsUpload(filePath,fileExtension,file_name,folderName,bucketName);
                    console.log('fileDetails-->',fileDetails)
                    if(fileDetails.key != ''){
                        const {Location,key} = fileDetails; 
                        const data = {
                            project_id,
                            type : AWS_file_type.Type_2,
                            document_id,
                            s3_key : key,
                            bucket_name : bucketName
                        }
                        const [folderDetails] = await ProjectModel.createS3UploadedFileDetails(data);
                    } 
                }
            }

        }

    },







    // async addDocument(req,res){
    //     let {project_id,category_id,file,file_name,user_id,description} = req.body;
    //     try {
            

    //         let ref =   {
    //             "project_id":project_id,
    //             "category_id":category_id,
    //             "file" : file,
    //             "file_name":file_name,
    //             "user_id":user_id,
    //             "description":description
    //         }
    //         let [mapped] = await ProjectModel.addDocument(ref);



    //         if (mapped.affectedRows) {
    //             let document_id=mapped.insertId;
    //             let util= UtilsController.setDeleteTime(document_id);
    //             if(req.user.role === 'ADMIN'){
                    
    //                 var key ={
    //                             "project_id":project_id
    //                         }
    //                 let usrinproj = await ProjectModel.getmappedUsers(key)
                    
    //                 // Category Added Check
    //                 console.log("category_id",category_id)
    //                 if(category_id){
                          
    //                     let [category] = await categoriesModel.getCatUsers({
    //                         project_id,category_id
    //                     })

    //                                                             if(category.length == 0){
    //                                                                 // Category Not Selectd For all users add in documents

    //                                                                 var [CatUsrinProj] = await categoriesModel.getAllCatUsersinProject(project_id);
    //                                                                 console.log("???",CatUsrinProj);

    //                                                                 var usradd = CatUsrinProj.map(async(item)=>{
                                                    
    //                                                                     var putData = {
    //                                                                     "user_id":item.user_id,
    //                                                                     "project_id":project_id,
    //                                                                     "document":document_id
    //                                                                     }
                                                                        
    //                                                                     var user_id = user_id;
    //                                                                     var document = document_id;
    //                                                                     var vw_rights = user_id
    //                                                                 let getViewRights = await ProjectModel.getVwRights(putData);
                                                                
    //                                                                 let vw_rights_docs = getViewRights[0][0].vw_rights
    //                                                                 if(vw_rights_docs ==  null){
    //                                                                 vw_rights = document;
    //                                                                 delete putData.vw_rights;
    //                                                                 Object.assign(putData,({'vw_rights': vw_rights}));
    //                                                                 console.log("UPDATE10",putData)
    //                                                                 let putAcc = await ProjectModel.putCategory(putData);  
    //                                                                 }
    //                                                                 else{
    //                                                                 if(vw_rights == 0){
    //                                                                     var doc = document.toString();
    //                                                                     var doc1= doc+",";
    //                                                                     var doc2= ","+doc;
    //                                                                     var rmdoc = vw_rights_docs.replace(doc1,"").replace(doc2,"").replace(doc,"");
    //                                                                     vw_rights_docs = rmdoc;
    //                                                                     delete putData.vw_rights;
    //                                                                     Object.assign(putData,({'vw_rights':vw_rights_docs}));
    //                                                                 //return putData
    //                                                                 console.log("UPDATE9",putData)
    //                                                                     let putAcc = await ProjectModel.putCategory(putData);
                                                                    
    //                                                                 }
                                                    
    //                                                                 else{
    //                                                                 vw_rights = vw_rights_docs+","+document;
    //                                                                 delete putData.vw_rights;
    //                                                                 Object.assign(putData,({'vw_rights':vw_rights}));
    //                                                                 console.log("UPDATE8",putData)
    //                                                                 let putAcc = await ProjectModel.putCategory(putData);
                                                                    
    //                                                                     }
    //                                                                     }  
    //                                                                 })
    //                                                             }

    //                     var catusradd = category.map(async(item)=>{
    //                         var putData = {
    //                             "user_id":item.user_id,
    //                             "project_id":project_id,
    //                             "document":document_id
    //                             }
    //                             var user_id = user_id;
    //                             var document = document_id;
    //                             var vw_rights = user_id
            
    //                     let getViewRights = await ProjectModel.getVwRights(putData);
    //                     let vw_rights_docs = getViewRights[0][0].vw_rights
    //                     console.log("following0",vw_rights_docs)
    //                     if(vw_rights_docs ==  null){
    //                         vw_rights = document;
    //                         delete putData.vw_rights;
    //                         Object.assign(putData,({'vw_rights': vw_rights}));
    //                         console.log("UPDATE4",putData)
    //                         let putAcc = await ProjectModel.putCategory(putData);  
                            
    //                     }
    //                     else{

                            
    //                         // // if(vw_rights.toString().length == 0 ){
    //                         //     var doc = document.toString();
    //                         //     var doc1= doc+",";
    //                         //     var doc2= ","+doc;
    //                         //     var rmdoc = vw_rights_docs.replace(doc1,"").replace(doc2,"").replace(doc,"");
    //                         //     vw_rights_docs = rmdoc;
    //                         //     var [categoryUser] = await categoriesModel.getCatUsers({
    //                         //         project_id,category_id
    //                         //     })
    //                         //     console.log("following001",categoryUser)
    //                         //     console.log("following002",vw_rights_docs)
    //                         //    // categoryUser.map(async(e)=>{
    //                         //    // delete putData.user_id
    //                         //     delete putData.vw_rights;
    //                         //     Object.assign(putData,({'vw_rights':vw_rights_docs}));
    //                         //    // Object.assign(putData,({'user_id':e.user_id}));
    //                         // //return putData
    //                         // console.log("UPDATE3",putData);
    //                         //     let putAcc = await ProjectModel.putCategory(putData);
    //                         // //})
    //                         // //}
            
    //                         // else{
    //                             var [categoryUser] = await categoriesModel.getCatUsers({
    //                                         project_id,category_id
    //                                     })

    //                             console.log("LOG1--->",categoryUser);
    //                             var [CatUsrinProj] = await categoriesModel.getAllCatUsersinProject(project_id);
    //                             console.log("LOG2--->",CatUsrinProj);
                                
    //                             let [categoryInProj] = await categoriesModel.find({project_id})
    //                             var GetCategoryId = []
    //                             categoryInProj.map((i)=>{
    //                                 GetCategoryId.push(i.category_id)
    //                             })
    //                             console.log("LOGGG",JSON.stringify(GetCategoryId).replace(/[[\]]/g,''));
    //                             var [usrCatData] = await categoriesModel.getCategoryUsersinProject(JSON.stringify(GetCategoryId).replace(/[[\]]/g,''),project_id)
    //                             console.log("LOG3--->",usrCatData)
    //                             var fill = CatUsrinProj.filter(val => val.category_id !== null)
                                
    //                             console.log("following001",fill)
    //                             console.log("following002",usrCatData)
    //                             var catgoryfill = fill.filter(({user_id:id1}) => !usrCatData.some(({user_id:id2}) => id2 === id1))
    //                             console.log("following003",catgoryfill)

    //                             categoryUser.map((i)=>{
    //                                 catgoryfill.push(i)
    //                             })
    //                             console.log("following004",catgoryfill)
    //                             // Dominic Dominic Dominic
  
    //                         vw_rights = vw_rights_docs+","+document;
    //                         delete putData.vw_rights;
    //                         Object.assign(putData,({'vw_rights':vw_rights}));
    //                         // console.log("----putdata-->",putData)
    //                         catgoryfill.map(async(i)=>{
    //                             delete putData.user_id;
    //                             Object.assign(putData,({'user_id':i.user_id}));
    //                             let putAcc = await ProjectModel.putCategory(putData);
    //                         })
    //                        // let putAcc = await ProjectModel.putCategory(putData);
            
    //                         //     }
                        
    //                             }

    //                     })


    //                     let [catProj] = await categoriesModel.find({project_id})

    //                     var rrr = catProj.map(async(item)=>{
    //                     if(category_id != item.category_id){
    //                         console.log("cats---------------->",item)
    //                     let project_id = item.project_id
    //                     let category_id = item.category_id
    //                     console.log("inside cat -----------------------------?",category_id)
    //                     var [categoryUser] = await categoriesModel.getCatUsers({
    //                     project_id,category_id
    //                 })
    //                 //console.log("cat user id ============================>",categoryUser[0])
    //                 return categoryUser;
    //                     }   
    //                 })

    //                 Promise.all(rrr).then((response)=>{

    //                     var usrpro = usrinproj[0]
                        
    //                             //console.log("A============================>",response)
    //                             // console.log("ABCD+++++++++++++++++++++++",usrinproj[0])
    //                             // usrpro.splice(0,1)
                                
    //                             // response.map((i)=>{
    //                             //     var num = 0;
    //                             //     usrpro.map((j)=>{
    //                             //         console.log(i[0].user_id)
    //                             //         console.log(j.user_id)
    //                             //         if(i[0].user_id===j.user_id){
                                        
    //                             //             console.log("INside condition")
    //                             //             usrpro.splice(num,1)

    //                             //         }
    //                             //         num++;

    //                             //     })
    //                             // })

    //                             var getCatUsr = []
    //                             response.map((i)=>{
    //                             if(i != undefined){
    //                                 i.map((j)=>{
    //                                     getCatUsr.push(j);   
    //                                 })
    //                             }
    //                             })
    //                             var getFilUsr = []
    //                             var FilUsr = usrinproj[0].map((o)=>{
    //                                 getCatUsr.map((a)=>{
    //                                     if(o.user_id != a.user_id){
    //                                         //console.log('filter->>>>>>>>>>>>>>>',o)
    //                                         getFilUsr.push(o) 
    //                                     }
    //                                 })
    //                             })

                                
    //                             var usradd = getFilUsr.map(async(item)=>{
    //                                 //console.log("filter----------------------->",item)
    //                                 var putData = {
    //                                 "user_id":item.user_id,
    //                                 "project_id":project_id,
    //                                 "document":document_id
    //                                 }
                                    
    //                                 var user_id = user_id;
    //                                 var document = document_id;
    //                                 var vw_rights = user_id
                
    //                         let getViewRights = await ProjectModel.getVwRights(putData);
    //                         let vw_rights_docs = getViewRights[0][0].vw_rights
                
    //                         if(vw_rights_docs ==  null){
    //                             vw_rights = document;
    //                             delete putData.vw_rights;
    //                             Object.assign(putData,({'vw_rights': vw_rights}));
    //                             console.log("UPDATE1",putData)
    //                             let putAcc = await ProjectModel.putCategory(putData);  
                
                                
    //                         }
    //                         else{
                                
    //                             if(vw_rights == 0){
    //                                 var doc = document.toString();
    //                                 var doc1= doc+",";
    //                                 var doc2= ","+doc;
    //                                 var rmdoc = vw_rights_docs.replace(doc1,"").replace(doc2,"").replace(doc,"");
    //                                 vw_rights_docs = rmdoc;
    //                                 delete putData.vw_rights;
    //                                 Object.assign(putData,({'vw_rights':vw_rights_docs}));
    //                             //return putData
    //                             console.log("UPDATE12",putData)
    //                                 let putAcc = await ProjectModel.putCategory(putData);
                                
    //                             }
                
    //                             else{
    //                             vw_rights = vw_rights_docs+","+document;
    //                             delete putData.vw_rights;
    //                             Object.assign(putData,({'vw_rights':vw_rights}));
                                
    //                             console.log("UPDATE11",putData)
    //                             var [usrCatData] = await categoriesModel.getAllCatUsersinProject(project_id)
    //                             var fill = usrCatData.filter(val => val.category_id !== null)
    //                             var catgoryfill = fill.filter(val => val.category_id !== category_id)  
    //                             var filterData = catgoryfill.filter(val => val.user_id === putData.user_id)
    //                                     if(filterData.length === 0){
    //                                         console.log("Following")
    //                                         let putAcc = await ProjectModel.putCategory(putData);
    //                                         console.log("Following111")
    //                                     }
    //                                     console.log("Following222")
    //                                 }
    //                             }
    //                         })                        
    //                         })
    //             }
    //             else{

    //             var [CatUsrinProj] = await categoriesModel.getAllCatUsersinProject(project_id);
    //             console.log("<++++++++++++++++++++",CatUsrinProj);
                
                
    //             var usradd = CatUsrinProj.map(async(item)=>{
       
    //                 var putData = {
    //                 "user_id":item.user_id,
    //                 "project_id":project_id,
    //                 "document":document_id
    //                 }
                    
    //                 var user_id = user_id;
    //                 var document = document_id;
    //                 var vw_rights = user_id
    //         let getViewRights = await ProjectModel.getVwRights(putData);
    //         console.log("following0",getViewRights)
    //         let vw_rights_docs = getViewRights[0][0].vw_rights
    //         if(vw_rights_docs ==  null){
    //             vw_rights = document;
    //             delete putData.vw_rights;
    //             Object.assign(putData,({'vw_rights': vw_rights}));
    //             console.log("UPDATE10",putData)
    //             let putAcc = await ProjectModel.putCategory(putData);  
    //         }
    //         else{
    //             if(vw_rights == 0){
    //                 var doc = document.toString();
    //                 var doc1= doc+",";
    //                 var doc2= ","+doc;
    //                 var rmdoc = vw_rights_docs.replace(doc1,"").replace(doc2,"").replace(doc,"");
    //                 vw_rights_docs = rmdoc;
    //                 delete putData.vw_rights;
    //                 Object.assign(putData,({'vw_rights':vw_rights_docs}));
    //                //return putData
    //                console.log("UPDATE9",putData)
    //                 let putAcc = await ProjectModel.putCategory(putData);
                   
    //             }

    //             else{
    //             vw_rights = vw_rights_docs+","+document;
    //             delete putData.vw_rights;
    //             Object.assign(putData,({'vw_rights':vw_rights}));
    //             console.log("UPDATE8",putData)
    //             let putAcc = await ProjectModel.putCategory(putData);
                
    //                 }
    //                 }  
    //             })
    //             console.log("following1")
    //         }
            
    //              //category-d addddedd
    //              console.log("following2")        
    //             }
    //             console.log("following3")
    //         new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Document"))
    //         }
    //         else {
    //             // failed response
    //             new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Document"))

    //         }
    //     }
    //     catch (err) {
    //         new AppErrorHandler(res, err)
    //     }
    // },


    async editDocument(req,res){
        let { document_id } = req.params
        
        let {project_id,category_id,file,file_name,user_id,description} = req.body;
        try {
                // let files=[]
                // file.map(item=>{
                    
                //     files.push(item)
                // })
                let ref =   {
                    "project_id":project_id,
                    "category_id":category_id,
                    "file" : file,
                    "file_name":file_name,
                    "user_id":user_id,
                    "description":description
                }
                const [getDocumentDetails] = await ProjectModel.getDocumentByProjectIdAnddocumentId({project_id,document_id,file_name});
                console.log('getDocumentDetails-->',getDocumentDetails);
                if(getDocumentDetails.length > 0){
                    console.log(ref);
                    let [mapped] = await ProjectModel.editDocument(document_id,ref);

                    if (mapped.affectedRows) {

                        // sending success response to client
                        new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Document"))

                    }
                    else {
                        // failed response
                        new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Document"))
                    }
                }else{
                    const [getDocumentDetail] = await ProjectModel.getDocumentByProjectId(project_id);
                    console.log('Document--->',getDocumentDetail)
                    const fileName =toLower(file_name.replaceAll(' ',''));
                    console.log('file_name-->',fileName)
                    const allDocumentName = await getDocumentDetail.map((item)=>{
                        return toLower(item.file_name.replaceAll(' ',''));
                    });
                    if(!allDocumentName.includes(fileName)){
                            console.log('Neww');
                            let [mapped] = await ProjectModel.editDocument(document_id,ref);

                            if (mapped.affectedRows) {

                                // sending success response to client
                                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Document"))

                            }
                            else {
                                // failed response
                                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Document"))
                            }
                    }else{
                        console.log('Already Exists')
                        // failed response
                        new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Document title"))
                    }
                }
            }
            catch (err) {
                new AppErrorHandler(res, err)
            }
    },
    
     /* ---------------------------- Get Document Details ---------------------------- */
    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
     async getDocuments(req, res) {
        try {
            
            let {
                
                project_id,category_id,users_id
            } = req.query
            let uid = req.user.user_id;

            if(req.user.role == "ADMIN"){
           let [documents] = await ProjectModel.getDocuments({
                project_id,users_id,uid,category_id
            })
            documents.map((data)=>{
                console.log('data--->',data);
                data.file_name = data.file_name.replaceAll('.','-');
            })
            if (documents.length) {
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Documents"),
                    documents
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    // Message.Common.FailureMessage.NoDataFound("Documents"),
                )
            }
        }
        else{

            let [documents] = await ProjectModel.getDocuments({
                project_id,users_id,uid,category_id
            })
            let [docs_rights] = await ProjectModel.getDocid(project_id,uid,category_id)
            console.log('documents11-->',documents)
            console.log('docs_rights222-->',docs_rights)
            if(docs_rights.length > 0){
                var getDocs = [];
                let doc_view_rights;
                if(category_id){
                    doc_view_rights = docs_rights[0].vw_rights;
                }else{
                    doc_view_rights = docs_rights.map(row => row.vw_rights).join(',');
                }
                documents.map((i)=>{
                    let documentRights;
                    // console.log("$$$$",docs_rights[0].vw_rights)
                    let docsAssigns = doc_view_rights.replace(/undefined,|undefined|,undefined|\,\[]|\[]\,|\[],|\[|\]/g,'');
                    console.log("valuee=>",docsAssigns)
                    if(docsAssigns.charAt(0) === ','){
                        let cleanedStr = docsAssigns.replace(/,+/g, ','); 
                        console.log("111","[" + cleanedStr + "]")
                        documentRights = JSON.parse("[" +  cleanedStr.substring(1).replace("[],", '') + "]");
                    }
                    else
                    {
                        console.log("222","[" + docsAssigns + "]")
                        let cleanedStr = docsAssigns.replace(/,+/g, ','); 
                        documentRights = JSON.parse("[" + cleanedStr + "]");
                    }

                    let filterDocsId = documentRights.find(x => x === i.document_id)
                    console.log('getDocs.filename-->',i.file_name)
                    i.file_name = i.file_name.replaceAll('.','-');
                    console.log('getDocs.filename-->',i.file_name)
                   if(filterDocsId !== undefined){
                   let filterDocs = documents.find((i) => i.document_id === filterDocsId)
                   getDocs.push(filterDocs)
                   }
                    console.log("0===>",getDocs)  
                })
                if (getDocs.length > 0) {
                    new Response(
                        res,
                        StatusCodes.OK
                    )._SuccessResponse(
                        Message.Common.SuccessMessage.Fetch("Documents"),
                        getDocs
                    )
    
                }
                else {
    
                    // if no users found
                    new Response(
                        res,
                        StatusCodes.OK
                    )._ErrorMessage(
                        // Message.Common.FailureMessage.NoDataFound("Documents"),
                    )
                }
            }
            else{

            if (documents.length) {
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Documents"),
                    documents
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    // Message.Common.FailureMessage.NoDataFound("Documents"),
                )
            }
        }
       }

            
            
        }
        catch (err) {


            console.log(err)
            // if something went wrong
            new AppErrorHandler(
                res,
                err
            )
        }
    },

    /* ---------------------------- Delete Document ---------------------------- */
    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
     async deleteDocuments(req, res) { 
        let { project_id } = req.params
        
        try {
            if(project_id !== undefined && project_id !== "undefined"){
            let [documentDetails] = await ProjectModel.getDocumentDetails({
                project_id
                    })
                if (documentDetails.length && documentDetails[0].file) {
                    documentDetails.forEach(async item => {                 
                        
                        let path = `${process.env.APP_BASE_PATH}public/uploads/${item.file}`
                                if(path){
                                await fs.unlinkSync(path)
                                }
                    })
                }
                let [documents] = await ProjectModel.deleteDocuments({
                    project_id
                })
                if (documents.affectedRows) {
                    console.log("ZZZ--->",project_id,documentDetails[0].document_id)
                    let [deleteNotification] = await ProjectModel.deleteNotification(project_id,documentDetails[0].document_id)
                    // sending success response to client
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Documents"))
                }
                else {
                    // failed response
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Documents"))
                }
            }
            
        }
        catch (err) {


            console.log(err)
            // if something went wrong
            new AppErrorHandler(
                res,
                err
            )
        }
    },

    async deleteCategoryDocuments(req, res) {
          
        let { project_id,category_id } = req.body;
        
        try {
            if(project_id !== undefined && project_id !== "undefined"){
            let [documentDetails] = await ProjectModel.getDocumentDetails({
                project_id
                    })
                if (documentDetails.length && documentDetails[0].file) {
                    documentDetails.forEach(async item => {                 
                        
                        let path = `${process.env.APP_BASE_PATH}public/uploads/${item.file}`
                                if(path){
                                await fs.unlinkSync(path)
                                }
                    })
                }
                let [documents] = await ProjectModel.deleteDocuments({
                    project_id
                })
                if (documents.affectedRows) {
                    console.log("ZZZ--->",project_id,documentDetails[0].document_id)
                    let [deleteNotification] = await ProjectModel.deleteNotification(project_id,documentDetails[0].document_id)
                    if(category_id != null){
                        const [getCategoryDetails] = await categoriesModel.getCategoryDetailsById(category_id);
                        if(getCategoryDetails.length > 0 && isSpecialCategory(getCategoryDetails[0].category_name)){
                            console.log('GFC category S3')
                            const deleteS3Files = await ProjectsController.deleteDocumentInS3(project_id);   
                        }
                    }
                    // sending success response to client
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Documents"))
                }
                else {
                    // failed response
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Documents"))
                }
            }
            
        }
        catch (err) {


            console.log(err)
            // if something went wrong
            new AppErrorHandler(
                res,
                err
            )
        }
    },
 /* ---------------------------- Get Mapped user Details ---------------------------- */
    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
     async getmappedUser(req, res) {
        try {
            let {
                project_id
            } = req.query
           
            let [users] = await ProjectModel.getmappedUsers({
                project_id
            })
            console.log('userss -->',users)
            function getUniqueListBy(arr, key) {
                return [...new Map(arr.map(item => [item[key], item])).values()]
            }

            const GetUsers= getUniqueListBy(users, 'name')

            console.log('GetUsers -- >',GetUsers)
            
            if (GetUsers.length) {

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Mapped Users"),
                    GetUsers
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Mapped Users"),
                )
            }
        }
        catch (err) {


            console.log(err)
            // if something went wrong
            new AppErrorHandler(
                res,
                err
            )
        }
    },



    async getmappedUserRights(req, res) {
        try {
            let {
                project_id,user_id
            } = req.query

            console.log("--------------------------------",req.query)
           
            let [users] = await ProjectModel.getmappedUsers({
                project_id
            })
            
            if (users.length) {

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Mapped Users"),
                    users
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Mapped Users"),
                )
            }
        }
        catch (err) {


            console.log(err)
            // if something went wrong
            new AppErrorHandler(
                res,
                err
            )
        }
    },
    /*----------------------------Delete for MapUser------------------------------------------*/

     async deleteMapuser(req, res) {
       
        let { userid,projectid } = req.params
        let user_id = userid;
        let project_id = projectid;
           
        try {
            let [documents] = await ProjectModel.deleteMapUser({
                userid, projectid
            })
            if (documents.affectedRows) {
                let [getTeamsByProjectId] = await TeamModal.getTeamProject(project_id,user_id)
                if(getTeamsByProjectId.length > 0){
                    const {team_id} = getTeamsByProjectId[0];
                    let [CheckTeamProjects] = await ProjectModel.CheckTeamProject({
                        user_id,team_id,project_id
                    })
                    if(CheckTeamProjects.length == 0){
                        let [deleteUsers] = await TeamModal.deleteProjectsbyTeamIdAndProjectId(team_id,user_id,project_id)
                    }
                }
                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("User"))
            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("User"))

            }
        }
        catch (err) {


            console.log(err)
            // if something went wrong
            new AppErrorHandler(
                res,
                err
            )
        }
    },

    async deleteCategoryMapUser(req, res) {
       
        let { user_id,project_id,category_id } = req.params;
            console.log('req.query->>',req.params)
        try {
            let [documents] = await ProjectModel.deleteCategoryMapUser({
                user_id,project_id,category_id
            })
            if (documents.affectedRows) {
                let [getTeamsByProjectId] = await TeamModal.getTeamProject(project_id,user_id)
                if(getTeamsByProjectId.length > 0){
                    const {team_id} = getTeamsByProjectId[0];
                    let [CheckTeamProjects] = await ProjectModel.CheckTeamProject({
                        user_id,team_id,project_id
                    })
                    if(CheckTeamProjects.length == 0){
                        let [deleteUsers] = await TeamModal.deleteProjectsbyTeamIdAndProjectId(team_id,user_id,project_id)
                    }
                }
                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("User"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("User"))

            }
        }
        catch (err) {


            console.log(err)
            // if something went wrong
            new AppErrorHandler(
                res,
                err
            )
        }
    },

    /* --------------------------- Get Document Details ends here -------------------------- */

    /*---------------------------Get project ---------------------------------------*/

    async getProject(req,res)
    {
        let {project_id}=req.params;

        console.log(project_id);
        var [data] =  await ProjectModel.getProject(project_id);

        if(data.length)
        {
            res.send(
                {
                status:true,
                Message:"Project fetched successfully",
            data:data}
            );
        }
        else
        {
            res.send(
                {
                    status:false,
                    Message:"Error in fetching",
                }
            )
        }
    },

    async projectsAddInTeam(req,res)
    {
        let {team_id,projects_id}=req.body;
        let {created_by} = req.user
        if(projects_id.length > 0){
        let [checkProjects] = await ProjectModel.getTeamsProjectsByProjectId(projects_id);
        if(checkProjects.length === 0){
        projects_id.map(async(ProjId,j)=>{
            let project_id = ProjId
      let [data] =  await ProjectModel.projectsAddInTeam({project_id,team_id});
        if(data.affectedRows > 0)
        {   
            let [users] = await ProjectModel.getmappedUsers({
                project_id
            })
            function getUniqueListBy(arr, key) {
                return [...new Map(arr.map(item => [item[key], item])).values()]
            }

            const GetUsers= getUniqueListBy(users, 'name')

            // console.log('GetUsers -- >',GetUsers)

            GetUsers.map(async(data)=>{
                console.log('Values--->',data.user_id)
                let user_id = data.user_id;
            let [updateUsers] = await TeamModal.addUsersinTeams({user_id,team_id,project_id})
            })

            let [getUsersInTeams] = await TeamModal.getTeamUsers(team_id)
                if(getUsersInTeams.length > 0){
                
                    getUsersInTeams.map(async(i)=>{
                    let DataLoad = {
                        project_id: project_id,
                        user_id: i.user_id
                    }
                    let [mapped] = await ProjectModel.mapUsers(DataLoad);

                    // Project Users Rights Assigning 
                    var putData = {"project_id": DataLoad.project_id};
                    let users_id = DataLoad.user_id
                    let getViewRights = await ProjectModel.getDocuments({project_id,users_id});
                    
                    let vw_rights_docs = []
                    getViewRights[0].map((i)=>{
                        vw_rights_docs.push(i.document_id)
                    })
                    vw_rights = vw_rights_docs;

                        Object.assign(putData,({'vw_rights': JSON.stringify(vw_rights_docs), "user_id":DataLoad.user_id}));
                        console.log("pushed--->",putData);
                        let [mappedData] = await ProjectModel.putCategory(putData);  
                    })
                
                }


            if(projects_id.length === j+1){
            res.send(
                {
                status:true,
                Message:"Project added in team successfully"}
            );
            }
        }
        else
        {
            res.send(
                {
                    status:false,
                    Message:"Error in adding project",
                }
            )
        }
        })
        }else{
            res.send(
                {
                    status:false,
                    message:"Project Allready Exisit in Teams",
                }
            )
        }
        }
    },
    async getProjectByTeam(req,res){
        let {teams_id} = req.params;
        let {user_id} = req.user
        try{
            let [getProjectIdbyTeams] = await ProjectModel.getProjectIdbyTeams(teams_id,user_id);
            console.log('getProjectIdbyTeams-->',getProjectIdbyTeams);
            let getProjects
            if(getProjectIdbyTeams.length > 0){
                let project_id = []
                getProjectIdbyTeams.map((i)=> project_id.push(i.project_id));
               [getProjects] = await ProjectModel.getProjectByTeam(teams_id,project_id);
            }
            else{
                [getProjects] = await ProjectModel.getProjectByTeam(teams_id);
            }

            if(getProjects.length > 0){
                res.send(
                    {
                    status:true,
                    Message:"Project fetched successfully",
                data:getProjects}
                );
            }else{
                res.send(
                    {
                        status:true,
                        Message:"No Projects Available",
                        data:[]
                    }
                )
            }
        }
        catch(err){
            console.log(err)
            new AppErrorHandler(
                res,
                err
            )
        }  
    },
    async projectDocumentsByProjectId(req,res){
        try{
            const {project_id} = req.query;
            const [projectDocument] = await ProjectModel.projectDocumentsByProjectId(project_id);
            console.log('projectDocument --->',projectDocument);
            // projectDocument.map(async(document,index)=>{
            if(projectDocument.length > 0){
                for (let i = 0; i < projectDocument.length; i++) {
                    const element = projectDocument[i];
                        const {project_name,document_id} = projectDocument[i];
                        let projectName = toLower(`${project_name}`.replace(/[^\w\s]|_/gi, '-'));
                        // let projectName = toLower(`${project_name}-${bucketUniqueId}`.replace(/[^\w\s]/gi, '-'));
                        projectName = projectName.replaceAll(' ','-')
                        const folderData = {
                            project_id,
                            "type" : "project"
                        }
                        // Set the bucketName 
                        const bucketName = PROJECT_COMPLETED_BUCKET;
                        const [folderDetails] = await ProjectModel.getS3FolderData(folderData);
                        if(folderDetails.length > 0){
                            logger.info('Bucket already Exist!')
                            const folderName = folderDetails[0].folder_name;
                            const filePath = `${APP_BASE_PATH}public/uploads/${projectDocument[i].file}`; // Update with your file path
                            // const filePath = `${APP_BASE_PATH}public/uploads/image/1690349615096_file.jpeg`; // Update with your file path
                            logger.info('filePath --->',filePath)
                            const fileExtension = path.extname(filePath);
                            logger.info('fileExtension --->',fileExtension);
                            let file_name = toLower(`${projectDocument[i].file_name}`.trim().replace(/[^\w\s]|_/gi, '-'));
                            file_name = file_name.replaceAll(' ','-')
                            if(fs.existsSync(filePath)){
                                const fileDetails = await awsUpload(filePath,fileExtension,file_name,folderName,bucketName);
                                console.log('uploadedFileDetails -->',fileDetails)
                                logger.info('File successfully upload to s3.');
                                if(fileDetails.key != ''){
                                    const {Location,key} = fileDetails; 
                                    const data = {
                                        project_id,
                                        type : AWS_file_type.Type_1,
                                        document_id,
                                        s3_key : key,
                                        bucket_name : bucketName
                                    }
                                    const [folderDetails] = await ProjectModel.createS3UploadedFileDetails(data);
                                }   
                            }else{
                                logger.info('File failed to upload in s3.');
                            }
                        }else{
                            projectName = projectName.replace(/^-+|-+$/g, '');
                            const projectBucketcreation = await projectS3FolderCreation(projectName,bucketName);
                            if(projectBucketcreation){
                                const folderDatas = {
                                    "folder_name" : projectBucketcreation.Key,
                                    "project_id" : project_id,
                                    "type" : "project"
                                }
                                const [createS3FolderInDB] = await ProjectModel.createS3FolderDetails(folderDatas);
                                logger.info('Bucket created successfully11...!')
                                const filePath = `${APP_BASE_PATH}public/uploads/${projectDocument[i].file}`; // Update with your file path
                                // const filePath = `${APP_BASE_PATH}public/uploads/image/1690349615096_file.jpeg`; // Update with your file path
                                logger.info('filePath --->',filePath)
                                const fileExtension = path.extname(filePath);
                                logger.info('fileExtension --->',fileExtension)
                                let file_name = toLower(`${projectDocument[i].file_name}`.trim().replace(/[^\w\s]|_/gi, '-'));
                                file_name = file_name.replaceAll(' ','-')
                                const folderName = projectBucketcreation.Key;
                                if(fs.existsSync(filePath)){
                                    const fileDetails = await awsUpload(filePath,fileExtension,file_name,folderName,bucketName);
                                    console.log('uploadedFileDetails -->',fileDetails)
                                    logger.info('File successfully upload to s3.');
                                    if(fileDetails.key != ''){
                                        const {Location,key} = fileDetails; 
                                        const data = {
                                            project_id,
                                            type : AWS_file_type.Type_1,
                                            document_id,
                                            s3_key : key,
                                            bucket_name : bucketName
                                        }
                                        const [folderDetails] = await ProjectModel.createS3UploadedFileDetails(data);
                                    } 
                                }else{
                                    logger.info('File failed to upload in s3.');
                                }
                            }else{
                                logger.error('Bucket created failed...!')
                            }
                        }
                    if(i == projectDocument.length - 1){
                        logger.info('Project document backup to the S3 bucket successfully');

                        res.send(
                            {
                            status:true,
                            Message:"Project document backup to the S3 bucket successfully"}
                        );
                    }
                }
            }
            // })
        }catch(error){
            logger.error('get project document error is --->',error);
            new Response(res,StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError); 
        }
    },
    async currentProject(req,res){
        try{
            let {user_id,project_id} = req.body
            const projectData = {
                user_id,
                project_id
            }
            const [getProject] = await ProjectModel.getcurrentProject(projectData.user_id);
            if(getProject.length == 0){
                const [createProject] = await ProjectModel.currentProjectcreate(projectData);
                if(createProject.affectedRows > 0){
                    new Response(res,StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Added("Project"))
                }else{
                    new Response(res,StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Project"))
                }
            }else{
                const [createProject] = await ProjectModel.updateCurrentProject(projectData);
                if(createProject.affectedRows > 0){
                    new Response(res,StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Added("Project"))
                }else{
                    new Response(res,StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Project"))
                }
            }
        }catch(error){
            logger.error('create project error is --->',error);
            new Response(res,StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError); 
        }
    },
    async deleteDocumentInS3(document_id){
        try{
            if(document_id != null && document_id != '' && document_id != 'null' && document_id != undefined){
                const [gets3fileDetails] = await ProjectModel.getS3DocumentData(document_id);
                if(gets3fileDetails.length > 0){
                    const {bucket_name,s3_key} = gets3fileDetails[0];
                    const fileDeleted = await deleteFileIns3(bucket_name,s3_key);
                    if(fileDeleted == true){
                        const [deletes3fileDetails] = await ProjectModel.deleteS3DocumentData(document_id);
                    }
                    logger.error('S3 document deleted successfully...!');
                }else{
                    logger.error('delete category file not found--->');
                }
            }
        }catch(error){
            logger.error('delete category file error is --->',error);
        }
    }
}

const projectS3BucketCreation = async(bucketName) => new Promise((resolve, reject) =>{
    const s3 = new AWS.S3({
      accessKeyId: AWS_KEY_ID,
      secretAccessKey: AWS_SECRET_KEY,
    });
    // Set the parameters for S3 bucket creation
    const bucketParams = {
        Bucket: `${bucketName}-${Date.now()}`, // Update with your desired bucket name
        ACL: 'private' // You can set the desired ACL (Access Control List) for your bucket
    };
    console.log('bucketParams -->',bucketParams)
    // Create the S3 bucket
    s3.createBucket(bucketParams, function(err, data) {
        if (err) {
        console.log('Error', err);
        }
        else{
            console.log('created bucket data -->',data)
            logger.info('Bucket created successfully...!')
            resolve(data)
        }
    });
});



const awsUpload = async(filePath,fileExtension,fileName,folderName,bucketName) => new Promise((resolve, reject) =>{
    const s3 = new AWS.S3({
      accessKeyId: AWS_KEY_ID,
      secretAccessKey: AWS_SECRET_KEY,
    });
    // Read file content
    const fileContent = fs.readFileSync(filePath);
    // const uniqueId = toLower(shortid.generate());
    const fileParams = {
        Bucket: bucketName,
        Key: `${folderName}${fileName}_${Math.floor(100000 + Math.random() * 900000)}${fileExtension}`, // File name you want to save as in S3
        Body: fileContent,
    };
    console.log('fileParams -->',fileParams)
    s3.upload(fileParams, (err, data) => {
        if (err) {
        reject(err);
        }
        console.log(`File uploaded successfully. ${data}`);
    //   files = {
    //     fieldname: fileContent.fieldname,
    //     mimetype: fileContent.mimetype,
    //     key: data.key,
    //     location: data.Location,
    //   };
        resolve(data)
    });
});

const projectS3FolderCreation = async(projectName,bucketName) => new Promise((resolve, reject) =>{
    const s3 = new AWS.S3({
      accessKeyId: AWS_KEY_ID,
      secretAccessKey: AWS_SECRET_KEY,
    });
    // Set the parameters for S3 folder creation
    const bucketParams = {
        Bucket: bucketName,
        Key: `${projectName}-${Math.floor(100000 + Math.random() * 900000)}/`, // Note the trailing slash to indicate it's a folder
        Body: '', // Empty body because it's a folder, not a file
      };
    console.log('bucketParams -->',bucketParams)
    // Upload the empty object to create the "folder"
    s3.putObject(bucketParams, function(err, data){
        if (err) {
        console.log('Error', err);
        }
        else{
            console.log('created folder data -->',data)
            logger.info('Folder created successfully...!')
            resolve(bucketParams)
        }
    });
});

const deleteFileIns3 = async(bucketName,S3_key) => new Promise((resolve,reject) => {
    const s3 = new AWS.S3({
        accessKeyId: AWS_KEY_ID,
        secretAccessKey: AWS_SECRET_KEY,
      });

    const bucketParams = {
    Bucket: bucketName,
    Key: S3_key
    };
      // Perform the delete operation
    s3.deleteObject(bucketParams, (err, data) => {
        if (err) {
        console.error('Error deleting file:', err);
        } else {
        console.log('File deleted successfully');
        resolve(true)
        }
    });
})


/* ------------------------ User controller ends here ----------------------- */

module.exports = ProjectsController