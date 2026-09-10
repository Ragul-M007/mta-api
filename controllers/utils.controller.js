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
const UtilsModel = require("../models/utils.model");
const { StatusCodes } = require("http-status-codes");
const jwt = require('jsonwebtoken');
const moment = require('moment')
const PushNoti = require("../utils/push-notification");
const { map } = require("underscore");
/* --------------------------------- Imports ends here -------------------------------- */



/* ----------------------- Customer controller starts here ---------------------- */

const UtilsController = {




    /**
     * ANCHOR user creation 
     * @param {*} req 
     * @param {*} res 
     */
    async create(req, res) {

        // getting request from body
        let {document_id,status, delete_time} = req.body;

        let{user_id} = req.user;
        try {

            let [documents] = await UtilsModel.create({
                document_id,status, delete_time
            })

             console.log(documents);
             if (documents.insertId) {

                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Document"))
            } else {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Document"))
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




    // /**
    //  * ANCHOR user creation 
    //  * @param {*} req 
    //  * @param {*} res 
    //  */
    // async notification(req, res) {

    //     // getting request from body
    //     let {title,description, noti_img,user_type, user_id} = req.body;

    //     // let{user_id} = req.user;
    //     try {

    //         let [notis] = await UtilsModel.createNoti({
    //             title,description, noti_img,user_type, user_id
    //         })

    //          console.log(notis);
    //          if (notis.insertId) {

    //             new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Notification"))
    //         } else {
    //             new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Notification"))
    //         }

    //     }
    //     catch (err) {

    //         console.log(err)
    //         /**
    //          * ANCHOR user creation and machine creation error handler
    //          */
    //         new AppErrorHandler(res, err)
    //     }
    // },


    /* ---------------------------- Get Customer Details ---------------------------- */
    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
    async fetch(req, res) {
        try {

            let {
                user_id
            } = req.user

            let [attendance] = await UtilsModel.find({
                user_id
            })

            if (attendance.length) {

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Attendance"),
                    attendance
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Attendance"),
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

     /* --------------------------- Insert Notification Details ends here -------------------------- */

 /**
     * ANCHOR user creation 
     * @param {*} req 
     * @param {*} res 
     */
  async notification(req, res) {

    // getting request from body
    let {title,description, user_id,user_type,img_url} = req.body;
    if(img_url == undefined){
            img_url = null
            }
    // let{user_id} = req.user;
    try {
       
        var payload= {
            'title':title,
            'description':description,
            'user_id':user_id,
            'user_type':user_type,
            'img_url':img_url
        }

        if(user_id == 0){
            let getuser= await UtilsModel.getUser();
            var usData = JSON.stringify(getuser[0])
            var usaDat = JSON.parse(usData);

            var payload = usaDat.map(item=>{
                return{
                'title':title,
                'description':description,
                'user_id':item.user_id,
                'user_type':user_type,
                'img_url':img_url
                }
            })
            var [documents] = await UtilsModel.createNoti(payload);
            payload.map(async(i)=>{
                payload = i
                let notiSuccess = await PushNoti.PushNotification(payload);
            })

            if (documents.insertId) {

                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Notification"))
            } else {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Notification"))
            }

        }else{
             user_id.map(async(item,index)=>{
                payload = {
                'title':title,
                'description':description,
                'user_id':item,
                'user_type':user_type,
                'img_url':img_url
            }
            let notiSuccess = PushNoti.PushNotification(payload);
            var [documents] = await UtilsModel.createNoti(payload);
            if (index == user_id.length-1) {
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Notification"))
            }
            })
        }
           
         //let notiSuccess= await PushNoti.PushNotification(payload);
        // let [documents] = await UtilsModel.createNoti({
        //     title,description, user_id,user_type,img_url
        // })

    }

    
    catch (err) {

        console.log(err)
        /**
         * ANCHOR user creation and machine creation error handler
         */
        new AppErrorHandler(res, err)
    }
},

/**
     * ANCHOR user creation 
     * @param {*} req 
     * @param {*} res 
     */
 async getNotification(req, res) {

    // getting request from body
    let {user_id} = req.user;

    try {
        
        let [notifications] = await UtilsModel.fetchNoti({
            user_id
        })
        var Notification_Data =[]
        
        for(let i=0; i < notifications.length; i++){
            
            let NotData = JSON.parse(notifications[i].doc_detail);
            //console.log("Not Data------------------>",NotData)
            var N_Dtaa={
                'noti_id':notifications[i].noti_id,
                'title':notifications[i].title,
                'description':notifications[i].description,
                'doc_detail':NotData,
                'img_url':notifications[i].img_url,
                'created_at':notifications[i].created_at,
                'read_status':notifications[i].read_status
                }
                Notification_Data.push(N_Dtaa);
                //console.log("Finallllllllllllllll Data------------------>",N_Dtaa)
            }
            if (Notification_Data.length) {
                // if users found
    
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Notification"),
                    Notification_Data
                )
    
            }
            else {
    
                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Notification"),
                )
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



    // update
    /**
           * 
           * @param {*} req 
           * @param {*} res 
           */
    async update(req, res) {

        // getting request from body
        let { duration , duration_type  } = req.body;
        let { duration_id } = req.params;

        console.log(duration ,duration_type,duration_id );
        try {

            let [dres] = await UtilsModel.findByIdAndUpdate(duration_id, {
                duration , duration_type 
            })




            // CustomerDetails updatedted successfully
            if (dres.affectedRows) {

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Duration"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Duration"))

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
    async delete(document_id) {

        // getting request from query params
        
        try {


            let [deletedoc] = await UtilsModel.findByIdAndDeleteDocument(document_id)




            if (deletedoc.affectedRows) {

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Document"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Document"))

            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },
   /**
     * ANCHOR user creation 
     * @param {*} req 
     * @param {*} res 
     */
    async setDeleteTime(document_id) {
        //console.log("====>>>>>>",document_id);
        let status="Active";
       
        // getting request from body
        // let {document_id,status} = {document_id,status};
        try {

            let [documents] = await UtilsModel.create({
                document_id,status
            })

             console.log(documents);
             if (documents.insertId) {
                
                // new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Document"))
            } else {
                // new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Document"))
            }
            return;
        }
        catch (err) {

            console.log(err)
            /**
             * ANCHOR user creation and machine creation error handler
             */
            new AppErrorHandler(res, err)
        }
    },
    async delete_docs() {

        // try {
             let [docs]=await UtilsModel.find();
            //  docs=JSON.stringify(docs);
             for(var i=0;i<docs.length;i++){
            let currentDate= moment(new Date()).format("YYYY/MM/DD")
            let delete_time=moment(docs[i].delete_time).format("YYYY/MM/DD")
            if(currentDate == delete_time){

            
            [deletedDocs] = await UtilsModel.findByIdAndDelete(docs[i].util_id);
            }


           
            if (deletedDocs.affectedRows) {
                console.log("deletedDocs==>",deletedDocs);
                // sending success response to client
                // new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Document"))

            }
            else {
                // failed response
                // return docs;
                // new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Document"))

            }
        }
        // }
        // catch (err) {
        //     new AppErrorHandler('', err)
        // }
            
        return docs;
    },

    async getAudioUrl(req,res){
        try{            
        let { documents_id,parent_comment_id,project_id,user_id,comment,audio,recipient,category_id_list,category_list,recipient_id } = req.body
        console.log('CommentsFiles--->',req.body)
        let audiosuccess = await UtilsModel.getAudioUrl(req.body)
        if (audiosuccess) {
         //-----TEMP-----   
            // let docc
            // if(documents_id){
            //  docc = {
            //     'user_id':user_id,
            //     'comment':comment,
            //     'document_id':documents_id,
            //     'recipient_id':JSON.stringify(recipient_id),
            //     'recipient':JSON.stringify(recipient),
            //     'category_id_list':JSON.stringify(category_id_list),
            //     'category_list':JSON.stringify(category_list)
            // }            
            // }else{
            //  docc = {
            //         'user_id':user_id,
            //         'comment':comment,
            //         'project_id':project_id,
            //         'recipient_id':JSON.stringify(recipient_id),
            //         'recipient':JSON.stringify(recipient),
            //         'category_id_list':JSON.stringify(category_id_list),
            //         'category_list':JSON.stringify(category_list)
            //     }        
            // }
            // console.log("11111",docc)
            // if(docc){
            // let [documents] = await UtilsModel.createcomment(docc)
            // }

        //-----TEMP-----
            
            // Push Notification
            await PushNoti.CommentsNotification(req.body,audiosuccess[0].insertId,user_id) 
           
           new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Notification"))
            
        } else {
            new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Notification"))
        }
        }
        catch (err) {
            console.log("errr",err)
            /**
             * ANCHOR user creation and machine creation error handler
             */
            new AppErrorHandler(res, err)
        }
    },

    async deletecomment(req,res){
        
        let { comment_id }= req.params;

        let [deletecomment] = await UtilsModel.deletecomment(comment_id)
        if (deletecomment.affectedRows) {
            new Response(
                res,
            )._SuccessResponse(
                Message.Common.SuccessMessage.Deletion("comments")
            )
        }
        else {
            new Response(
                res,
                StatusCodes.BAD_REQUEST
            )._ErrorMessage(
                Message.Common.FailureMessage.Deletion("comments"),
            )
        }
        
    },

    async UpdateNotification(req,res){
        let {noti_id} = req.params;
        let [updateNoty] = await UtilsModel.UpdateNoty(noti_id);
        if(updateNoty.affectedRows)
        {
            res.send(
                {
                status:true,
                Message:"Notification Status Updated successfully",}
            );
        }
        else
        {
            res.send(
                {
                    status:false,
                    Message:"Error in Updating",
                }
            )
        }

    }
    
    
}

/* ------------------------ User controller ends here ----------------------- */

module.exports = UtilsController