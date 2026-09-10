/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-23 12:01:11
 * @desc [description]
 */

/* --------------------------------- Imports starts here -------------------------------- */


const { Message } = require("../utils/messages");
const Response = require("../utils/response");
const AppErrorHandler = require("../utils/error-handler");
const categoriesModel = require("../models/categories.model.js");
const TeamModal = require("../models/team.model");
const ProjectModel = require('../models/projects.model')
const UserModel = require('../models/user.model')
const { StatusCodes } = require("http-status-codes");
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { error } = require("winston");

/* --------------------------------- Imports ends here -------------------------------- */



/* ----------------------- Customer controller starts here ---------------------- */

const CategoriesController = {




    /**
     * ANCHOR user creation 
     * @param {*} req 
     * @param {*} res 
     */
    async create(req, res) {

        // getting request from body
        let {category_name, description,role_id} = req.body


        try {

            
            let [category_name_duplicate] = await categoriesModel.checkCategory(category_name);
            if(category_name_duplicate.length == 0){
                let [categories] = await categoriesModel.create({
                    category_name, description, role_id
                })
                if (categories.insertId) {
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Creation("Category"))
                } else {
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Creation("Category"))
                }
            }else{
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Category"))
            }

        }
        catch (err) {

            console.log(err)
            /**
             * ANCHOR user creation and machine creation error handler
             */
            new AppErrorHandler(res, err)
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
                project_id,category_id,type
            } = req.query
            let {user_id,role} = req.user;
            let category;
            let categorys;
            let gfc_category;     
            const [specialAccessUser] = await UserModel.hasSpecialCategoryAccessUser(user_id);
            const hasSpecialCategoryAccess = specialAccessUser.length > 0;
            console.log('Type-->',type);      
            if(role === "ADMIN"){
            console.log('Type-->11',type);      
                if(type != undefined && type == 'mobile'){
                    if(hasSpecialCategoryAccess){
                        [gfc_category] = await categoriesModel.getGfcCategoryDetails({
                            project_id,category_id
                        })
                        console.log('gfc_category',gfc_category)

                       let [categoryss] = await categoriesModel.categoryfind({
                            project_id,category_id
                        });
        
                        category = categoryss.concat(gfc_category);
                    }else{
                    [categorys] = await categoriesModel.categoryfind({
                        project_id,category_id
                    });
                    category = categorys;
                    }
                }else{
                    [categorys] = await categoriesModel.categoryfind({
                        project_id,category_id
                    });
                    [gfc_category] = await categoriesModel.getGfcCategoryDetails({
                        project_id,category_id
                    })
                    category = categorys.concat(gfc_category);
                }
            }else{
               let [catCount] = await categoriesModel.categoryfind({
                    project_id,category_id
                });
                let checkCategory = []
                let getCatList
                catCount.map(j => {
                    if(j.user_list !== null){
                        getCatList = j.user_list.split(',').filter(i => i === JSON.stringify(req.user.user_id))
                        checkCategory.push(getCatList[0])
                    }
                })
                checkCategory = checkCategory.filter(function( element ) {
                    return element !== undefined;
                });

                if(checkCategory.length > 0){

                     [categorys] = await categoriesModel.categoryfind({
                        project_id,category_id,user_id
                    });    
                      
                }else{
                     [categorys] = await categoriesModel.categoryfind({
                        project_id,category_id
                     });   
                }
                console.log('GFC Access Users--->',user_id)
                if(hasSpecialCategoryAccess){
                    [gfc_category] = await categoriesModel.getGfcCategoryDetails({
                        project_id,category_id,user_id
                    })
                    console.log('gfc_category',gfc_category)
                    category = categorys.concat(gfc_category);
                }else{
                    category = categorys;
                }
                 
               }

            // [category] = await categoriesModel.find({
            //                 project_id,category_id
            //              });   
           
            if (category.length) {
                console.log('category--->',category)
                

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Categories"),
                    category
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Categories"),
                    []
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

   /* ---------------------------- Get Customer Details ---------------------------- */
    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
     async getCatUsers(req, res) {
        try {

            let {
                project_id,
                category_id
            } = req.query

            let [category] = await categoriesModel.getCatUsers({
                project_id,category_id
            })

            if (category.length){

                // if users found
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Users in Category"),
                    category
                )
            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Users in Category"),
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

    async getAllCatUsersinProject(req, res) {
        try {

            let {
                project_id,
                category_id
            } = req.query

            // let {
                
            // } = req.user

            let [category] = await categoriesModel.getAllCatUsersinProject({
                project_id,category_id
            })

            if (category.length) {

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Category Users in Project"),
                    category
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Users in Category"),
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

    async getCatgorybyUser(req, res) {
        try {

            let {user_id
            } = req.query
            // let {
                
            // } = req.user

            let [category] = await categoriesModel.getCatgorybyUser({
                user_id
            })

            if (category.length) {

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Category Users in Project"),
                    category
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Users in Category"),
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
    
    /* --------------------------- Get Customer Details ends here -------------------------- */





    // update
    /**
           * 
           * @param {*} req 
           * @param {*} res 
           */
    async update(req, res) {

        // getting request from body
        let { category_name, description, role_id } = req.body;
        let { category_id } = req.params
        try {
            let [category_name_duplicate] = await categoriesModel.checkCategoryDuplication(category_name,category_id)
            if(category_name_duplicate.length > 0){
                let [customerdetails] = await categoriesModel.findByIdAndUpdate(category_id, {
                    category_name, description, role_id
                })
                // CustomerDetails updatedted successfully
                if (customerdetails.affectedRows) {
                    // sending success response to client
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Category"))
                }
                else {
                    // failed response
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Category"))
                }
            }else{
                let [checkCategory] = await categoriesModel.checkCategory(category_name);
                if(checkCategory.length == 0){
                    let [customerdetails] = await categoriesModel.findByIdAndUpdate(category_id, {
                        category_name, description, role_id
                    })
                    // CustomerDetails updatedted successfully
                    if (customerdetails.affectedRows) {
                        // sending success response to client
                        new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Category"))
                    }
                    else {
                        // failed response
                        new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Category"))
                    }
                }else{
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Category"))
                }
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
        let { category_id } = req.params
        try {

            let [deletecategory] = await categoriesModel.findByIdAndDelete(category_id)

            if (deletecategory.affectedRows) {

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Category"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Category"))

            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },
    async removeCat(req,res){
        let {
            category_id,project_id
        } = req.body;
        try{

            let uid = req.user.user_id;
                let [documents] = await ProjectModel.getDocuments({
                    project_id,uid,category_id
                })
                var getDocumentsId = []
                documents.map((i)=>{
                    getDocumentsId.push(i.document_id)
                })
                console.log("###1",JSON.stringify(getDocumentsId).replace(/[[\]]/g,'').length)
                var deleteDocuments
                let remCat
                if(JSON.stringify(getDocumentsId).replace(/[[\]]/g,'').length > 0){
                  [deleteDocuments] = await ProjectModel.deletemultipleDocuments(JSON.stringify(getDocumentsId).replace(/[[\]]/g,''));
                    [remCat] = await categoriesModel.rmCat(category_id,project_id)
                 // new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Category And Documents"))
                }else{
                    [remCat] = await categoriesModel.rmCat(category_id,project_id)
                 //   new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Category"))
                }
                let [category] = await categoriesModel.getCatUsers({
                    project_id,category_id
                })
                category.map(async(data,index)=>{
                    const user_id = data.user_id;
                    let [deleteUsers] = await TeamModal.deleteProjectsbyTeamIdAndProjectId(team_id,user_id,project_id)
                })
                console.log("###2",remCat);
                if(remCat.affectedRows > 0){
                    let [deleteNotification] = await ProjectModel.deleteNotification(project_id,JSON.stringify(getDocumentsId).replace(/[[\]]/g,''))
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Category"))
                }else{
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Category"))
                }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }

    },
  async getCats(req,res){
    let [availableCats]=await categoriesModel.getavailableCats();
    if(availableCats.length){
    
     new Response(res)._SuccessResponse("success", availableCats)
    }else{
     new Response(res)._ErrorMessage("Failed to fetch the User roles")

    }
  },

// Romove user from category
//   async deleteCatUser(req,res){
//     let [availableCats]=await categoriesModel.deleteCatUser();
//     if(availableCats.length){
    
//      new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("success", availableCats))
//     }else{
//      new Response(res)._ErrorMessage(Message.Common.FailureMessage.Deletion("Failed to fetch the User roles"))

//     }
//   },
    
}

/* ------------------------ User controller ends here ----------------------- */

module.exports = CategoriesController