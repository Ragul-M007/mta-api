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
const attendanceModel = require("../models/attendance.model");
const { StatusCodes } = require("http-status-codes");
const jwt = require('jsonwebtoken');
const moment = require('moment')
const logger = require('../utils/winston')
const ProjectModel = require("../models/projects.model.js");
const {Report_type} = require('../utils/chat');
const UserModel = require("../models/user.model.js");

/* --------------------------------- Imports ends here -------------------------------- */



/* ----------------------- Customer controller starts here ---------------------- */

const AttendanceController = {




    /**
     * ANCHOR user creation 
     * @param {*} req 
     * @param {*} res 
     */
    async create(req, res) {

        // getting request from body
        let {checkType,checkTime, latLng, location_name,project_id} = req.body;
        console.log('req.body-->',req.body);
        let{user_id} = req.user;
        try {

            let [attendance] = await attendanceModel.create({
                user_id, checkType, checkTime, latLng, location_name,project_id
            })

             console.log(attendance);
             if (attendance.insertId) {
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Added("Attendance"))
            } else {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Added("Attendance"))
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
                user_id,date
            } = req.query
            let {
                created_by,
                role
            } = req.user
            let [attendance] = await attendanceModel.find({
                user_id,date,created_by
            })
            if (attendance.length) {
            var attendList=[];
                // if users found
               
                // for(var i=0; i < attendance.length;i++){
                //    if(moment(attendance[i].date).format('DD-MM-YYYY') == date){
                   
                //     attendList.push(attendance[i]);
                   
                //    }else if(moment(attendance[i].date).format('MM-YYYY') == date){
                //     attendList.push(attendance[i]);
                
                //        }
                //  }
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponseWithRadius(
                    Message.Common.SuccessMessage.Fetch("Attendance"),
                    attendance,
                    process.env.ATTENDANCE_MAX_RADIUS
                )
            }
            else {
                res.send(
                    {
                        status:true,
                        Message:"No Entries found",
                        data : [],
                        radius : process.env.ATTENDANCE_MAX_RADIUS
                    }
                )

                // if no users found

                // new Response(
                //     res,
                //     StatusCodes.OK
                // )._ErrorMessage(
                //     Message.Common.FailureMessage.NoDataFound("Entries"),
                // )
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
    async attendanceCounts(req, res) {
        try {
           console.log("12345678")
            let [getAttendance] = await attendanceModel.getAttendanceCounts()
            if (getAttendance.length > 0) {
                console.log("$$$$$",)
                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Attendance counts"),
                    getAttendance
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("No counts"),
                    getAttendance
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
    async updateAttendanceCounts(req, res){
        try {
           
            let [updateUserCounts] = await attendanceModel.updateAttendanceCounts()
            if (updateUserCounts.affectedRows > 0) {

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Updation("Attendance Counts")
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Updation("No data")
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
        let { customer_name, customer_address1, customer_address2, city, state, pincode,
            customer_mobile_no1, customer_mobile_no2, customer_land_line,
            customer_status, customer_image } = req.body;
        let { customer_id } = req.params
        try {



            if (customer_image) {
                let [customer] = await attendanceModel.find({
                    customer_id
                })
                if (customer.length && customer[0].customer_image) {
                    customer.forEach(async item => {
                        let path = `${process.env.APP_BASE_PATH}public/uploads/${item.customer_image}`
                        try {
                            await fs.unlink(path)
                            logger.info(`DELETED ${path}`)
                        }
                        catch (err) {
                            logger.info(err)
                        }
                    })
                }
            }
            else {
                customer_image = null
            }

            let [customerdetails] = await attendanceModel.findByIdAndUpdate(customer_id, {
                customer_name, customer_address1, customer_address2, city, state, pincode,
                customer_mobile_no1, customer_mobile_no2, customer_land_line,
                customer_status, customer_image
            })




            // CustomerDetails updatedted successfully
            if (customerdetails.affectedRows) {

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("Pawn"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("Pawn"))

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
        let { customer_id } = req.params
        try {


            let [deletecustomer] = await attendanceModel.findByIdAndDelete(customer_id)




            if (deletecustomer.affectedRows) {

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Pawn"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("Pawn"))

            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },
  async getCats(req,res){
    let [availableCats]=await attendanceModel.getavailableCats();
    if(availableCats.length){
    
     new Response(res)._SuccessResponse("success", availableCats)
    }else{
     new Response(res)._ErrorMessage("Failed to fetch the User roles")

    }
  },

  // Attendance Report Function

//   async attendanceReport(req,res){
//     try{
//         console.log('attendance report')
//         let {from_date,to_date,project_ids,user_ids,type} = req.body;
//         if(from_date != '' && from_date != null && to_date != null && to_date != '' && type != '' && type != null )
//         {
//             const attendanceDetails = [];
//             const fromDate = new Date(from_date);
//             const toDate = new Date(to_date);
//             const datesBetweenArray = await AttendanceController.getDatesBetween(fromDate, toDate);
//             if(Report_type.Type_1 == type){
//                 for (let indexValue = 0; indexValue < project_ids.length; indexValue++) {
//                     let project_id = project_ids[indexValue];
//                     let [projectDetails] = await ProjectModel.getProject(project_id);
//                     let [GetUsers] = await ProjectModel.getAttendanceUsers({project_id})
//                     const userArray = [];
//                     for (let i = 0; i < GetUsers.length; i++) {
//                         let {user_id,name} = GetUsers[i];
//                         const dateArray = [];
//                         for (let j = 0; j < datesBetweenArray.length; j++) {
//                             const date = datesBetweenArray[j];
//                             let [attendance] = await attendanceModel.getAttendanceData({
//                                 user_id,project_id,date
//                             })
//                             console.log('attendance --->',attendance)
//                             let totalHours = 0;
//                             let totalMinutes = 0;
//                             for (let index = 0; index < attendance.length; index++) {
//                                 const element = attendance[index];
//                                 if(attendance[index] && attendance[index+1]){
//                                     if(attendance[index].checkType == 'IN' && attendance[index+1].checkType == 'OUT'){
//                                         const start_value = moment(attendance[index].created_at, 'YYYY-MM-DD HH:mm:ss');
//                                         const end_value = moment(attendance[index+1].created_at, 'YYYY-MM-DD HH:mm:ss');
//                                         const difference = moment.duration(end_value.diff(start_value));
//                                         console.log(`${difference.hours()} hours ${difference.minutes()} minutes`)
//                                         totalHours += difference.hours();
//                                         totalMinutes += difference.minutes();
//                                     }
//                                 }
//                             }
//                             // Convert total minutes to hours and remaining minutes
//                             totalHours += Math.floor(totalMinutes / 60);
//                             totalMinutes %= 60;
//                             const dateObject = {"date":date,"user_id":user_id,"totalWorkHours" : `${totalHours} hours, ${totalMinutes} minutes`};
//                             // console.log('dateObject --->',dateObject)
//                             dateArray.push(dateObject)
//                         }
//                         // console.log('dateArray -->',dateArray)
//                         const userObject = {"user_id" : user_id,"user_name" : name,"user_details":dateArray};
//                         userArray.push(userObject)
//                     }
//                     const projectObject = {"project_id" : project_id,"project_name":projectDetails[0].project_name,"project_details":userArray};
//                     attendanceDetails.push(projectObject)
//                 }
//             }else if(Report_type.Type_2 == type){
//                 for (let indexValue = 0; indexValue < user_ids.length; indexValue++) {
//                     let user_id = user_ids[indexValue];
//                     let [userDetails] = await UserModel.userDetails(user_id);
//                     let [getProjects] = await ProjectModel.getUserProjects({user_id})
//                     const projectArray = [];
//                     for (let i = 0; i < getProjects.length; i++) {
//                         let {project_id,project_name} = getProjects[i];
//                         const dateArray = [];
//                         for (let j = 0; j < datesBetweenArray.length; j++) {
//                             const date = datesBetweenArray[j];
//                             let [attendance] = await attendanceModel.getAttendanceData({
//                                 user_id,project_id,date
//                             })
//                             let totalHours = 0;
//                             let totalMinutes = 0;
//                             for (let index = 0; index < attendance.length; index++) {
//                                 const element = attendance[index];
//                                 // console.log('attendance[index].checkType -->',attendance[index].checkType)
//                                 // console.log('attendance[index+1].checkType -->',attendance[index+1].checkType)
//                                 if(attendance[index] && attendance[index+1]){
//                                     if(attendance[index].checkType == 'IN' && attendance[index+1].checkType && attendance[index+1].checkType == 'OUT'){
//                                         const start_value = moment(attendance[index].created_at, 'YYYY-MM-DD HH:mm:ss');
//                                         const end_value = moment(attendance[index+1].created_at, 'YYYY-MM-DD HH:mm:ss');
//                                         const difference = moment.duration(end_value.diff(start_value));
//                                         console.log(`${difference.hours()} hours ${difference.minutes()} minutes`)
//                                         totalHours += difference.hours();
//                                         totalMinutes += difference.minutes();
//                                     }
//                                 }
//                             }
//                             // Convert total minutes to hours and remaining minutes
//                             totalHours += Math.floor(totalMinutes / 60);
//                             totalMinutes %= 60;
//                             const dateObject = {"date":date,"project_id":project_id,"totalWorkHours" : `${totalHours} hours, ${totalMinutes} minutes`};
//                             // console.log('dateObject --->',dateObject)
//                             dateArray.push(dateObject)
//                         }
//                         const projectObject = {"project_id" : project_id,"project_name" : project_name,"project_details":dateArray};
//                         projectArray.push(projectObject)
//                     }
//                     const userObject = {"user_id" : user_id,"user_name":userDetails[0].name,"user_details":projectArray};
//                     attendanceDetails.push(userObject)   
//                 }
//             }
//             new Response(res,StatusCodes.OK)._SuccessAttendanceResponse(Message.Common.SuccessMessage.Fetch("Attendance details"),attendanceDetails,type)
//         }else{

//         }
//     }catch(error){
//         logger.error('attendance report error is --->',error);
//         new Response(res,StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
//     }
//   },

async attendanceReport(req,res){
    try{
        console.log('attendance report')
        let {from_date,to_date,project_ids,user_ids,type} = req.body;
        if(from_date != '' && from_date != null && to_date != null && to_date != '' && type != '' && type != null )
        {
            const attendanceDetails = [];
            const fromDate = new Date(from_date);
            const toDate = new Date(to_date);
            const datesBetweenArray = await AttendanceController.getDatesBetween(fromDate, toDate);
            console.log("datesbetween---------",datesBetweenArray)
            if(Report_type.Type_1 == type){
               
                for (let indexValue = 0; indexValue < project_ids.length; indexValue++) {
                    let project_id = project_ids[indexValue];
                   
                    let [projectDetails] = await ProjectModel.getProject(project_id);
                    
                    let [GetUsers] = await ProjectModel.getAttendanceUsers({project_id})
                   console.log('GetUsers-->',GetUsers)
                    const userArray = [];
                    for (let i = 0; i < GetUsers.length; i++) {
                        let {user_id,name} = GetUsers[i];
                        
                        const dateArray = [];
                        for (let j = 0; j < datesBetweenArray.length; j++) {
                            const date = datesBetweenArray[j];
                            let [attendance] = await attendanceModel.getAttendanceData({
                                user_id,project_id,date
                            })
                            console.log('attendance --->',attendance)
                            let totalHours = 0;
                            let totalMinutes = 0;
                            let status;
                            let totalWorkHours;
                            for (let index = 0; index < attendance.length; index++) {
                                
                                const element = attendance[index];
                                console.log("----------ele",attendance[index])
                               
                                const checkInDate = moment(attendance[index].created_at).format('YYYY-MM-DD');
                                console.log("-----------",checkInDate)
                                // if(attendance[index] && attendance[index+1]){
                                //     if(attendance[index].checkType == 'IN' && attendance[index+1].checkType == 'OUT'){
                                if(attendance[index]&& attendance[index+1]) {
                                    console.log('attendance index working')
                                    if(attendance[index].checkType == 'IN' && attendance[index+1].checkType == 'OUT'){
                                    const start_value = moment(attendance[index].created_at, 'YYYY-MM-DD HH:mm:ss');
                                    const end_value = moment(attendance[index+1].created_at, 'YYYY-MM-DD HH:mm:ss');
                                    const difference = moment.duration(end_value.diff(start_value));
                                    console.log(`${difference.hours()} hours ${difference.minutes()} minutes`)
                                    totalHours += difference.hours();
                                    totalMinutes += difference.minutes();
                                    }
                                }else if(index == attendance.length -1 && attendance[index].checkType == 'IN'){
                                    console.log("Only OUT")
                                    const start_value = moment(attendance[index].created_at, 'YYYY-MM-DD HH:mm:ss');
                                    const end_value = moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
                                    console.log('end_value-->',end_value)
                                    // const end_value  = moment('18:00', 'HH:mm');
                                    const difference = moment.duration(end_value.diff(start_value));
                                    console.log(`${difference.hours()} hours ${difference.minutes()} minutes`)
                                    status = 'still working';
                                    totalHours += difference.hours();
                                    totalMinutes += difference.minutes();
                               }
                            }
                            // Convert total minutes to hours and remaining minutes
                            console.log('totalHours-->',totalHours)
                            console.log('totalMinutes-->',totalMinutes)
                            if(totalHours === 0 && totalMinutes === 0){
                                totalWorkHours = 'Check In and Check Out record does not found for this user for this particular date'
                            }else if(status == 'still working'){
                                totalWorkHours= 'User still checked-In';
                            }
                            // else if(totalHours >= 11){
                            //     totalWorkHours='User does not checkout'
                                
                            // }
                            // else if(totalHours < 7 ){
                            //     totalHours += Math.floor(totalMinutes / 60);
                            //     totalMinutes %= 60;
                            //     // totalWorkHours = `${totalHours} hours, ${totalMinutes} minutes still working`
                            //     totalWorkHours='User check-In in the morning still the user is in working state'
                            // }
                            else{
                                totalHours += Math.floor(totalMinutes / 60);
                                totalMinutes %= 60;
                                totalWorkHours = `${totalHours} hours, ${totalMinutes} minutes` 
                            }
                    
                            const dateObject = {"date":date,"user_id":user_id,"totalWorkHours" :totalWorkHours,};
                             console.log('dateObject --->',dateObject)
                            dateArray.push(dateObject)
                        }
                        // console.log('dateArray -->',dateArray)
                        const userObject = {"user_id" : user_id,"user_name" : name,"user_details":dateArray};
                        userArray.push(userObject)
                    }
                    const projectObject = {"project_id" : project_id,"project_name":projectDetails[0].project_name,"project_details":userArray};
                    attendanceDetails.push(projectObject)
                }
            }else if(Report_type.Type_2 == type){
               
                for (let indexValue = 0; indexValue < user_ids.length; indexValue++) {
                    let user_id = user_ids[indexValue];
                    let [userDetails] = await UserModel.userDetails(user_id);
                    let [getProjects] = await ProjectModel.getUserProjects({user_id})
                    const projectArray = [];
                    if(getProjects.length > 0){
                        for (let i = 0; i < getProjects.length; i++) {
                            let {project_id,project_name} = getProjects[i];
                            const dateArray = [];
                            for (let j = 0; j < datesBetweenArray.length; j++) {
                                const date = datesBetweenArray[j];
                                let [attendance] = await attendanceModel.getAttendanceData({
                                    user_id,project_id,date
                                })
                                let totalHours = 0;
                                let totalMinutes = 0;
                                let status = '';
                                let totalWorkHours;
                                for (let index = 0; index < attendance.length; index++) {
                                    const element = attendance[index];
                                    // console.log('attendance[index].checkType -->',attendance[index].checkType)
                                    // console.log('attendance[index+1].checkType -->',attendance[index+1].checkType)
                                    if(attendance[index] && attendance[index+1]){
                                        if(attendance[index].checkType == 'IN' && attendance[index+1].checkType && attendance[index+1].checkType == 'OUT'){
                                            const start_value = moment(attendance[index].created_at, 'YYYY-MM-DD HH:mm:ss');
                                            const end_value = moment(attendance[index+1].created_at, 'YYYY-MM-DD HH:mm:ss');
                                            const difference = moment.duration(end_value.diff(start_value));
                                            console.log(`${difference.hours()} hours ${difference.minutes()} minutes`)
                                            totalHours += difference.hours();
                                            totalMinutes += difference.minutes();
                                        }
                                    }else if(index == attendance.length -1 && attendance[index].checkType == 'IN'){
                                        const start_value = moment(attendance[index].created_at, 'YYYY-MM-DD HH:mm:ss');
                                        const end_value = moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
                                        console.log('end_value-->',end_value)
                                        // const end_value  = moment('22:00', 'HH:mm');
                                        const difference = moment.duration(end_value.diff(start_value));
                                        console.log(`${difference.hours()} hours ${difference.minutes()} minutes`)
                                        status = 'still working'
                                        totalHours += difference.hours();
                                        totalMinutes += difference.minutes();
                                    }
                                }
                                                            
                                // Convert total minutes to hours and remaining minutes
                                if(totalHours === 0 && totalMinutes === 0){
                                    totalWorkHours = 'Check In and Check Out record does not found for this user for this particular date'
                                }else if(status == 'still working'){
                                    totalWorkHours= 'User still checked-In';
                                }
                                // else if(totalHours > 11){
                                //     totalWorkHours='User does not checkout still working'
                                    
                                // }else if(totalHours > 10 || (totalHours === 10 && totalMinutes < 59)){
                                //     totalHours += Math.floor(totalMinutes / 60);
                                //     totalMinutes %= 60;
                                //     totalWorkHours = `${totalHours} hours, ${totalMinutes} minutes still working`
                                // }
                                else{
                                    totalHours += Math.floor(totalMinutes / 60);
                                    totalMinutes %= 60;
                                    totalWorkHours = `${totalHours} hours, ${totalMinutes} minutes` 
                                }
                                const dateObject = {"date":date,"project_id":project_id,"totalWorkHours" : totalWorkHours};
                                // console.log('dateObject --->',dateObject)
                                dateArray.push(dateObject)
                            }
                            const projectObject = {"project_id" : project_id,"project_name" : project_name,"project_details":dateArray};
                            projectArray.push(projectObject)
                        }
                    }else{
                        const projectObject = {"project_id" : 10,"project_name" : 'Check In and Check Out record does not found for this user',
                        "project_details":'Check In and Check Out record does not found for this user'};
                        projectArray.push(projectObject)
                    }
                    const userObject = {"user_id" : user_id,"user_name":userDetails[0].name,"user_details":projectArray};
                    attendanceDetails.push(userObject)   
                }
            }
            new Response(res,StatusCodes.OK)._SuccessAttendanceResponse(Message.Common.SuccessMessage.Fetch("Attendance details"),attendanceDetails,type)
        }else{

        }
    }catch(error){
        logger.error('attendance report error is --->',error);
        new Response(res,StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
    }
  },

  async getDatesBetween(startDate, endDate) {
    const datesArray = [];
    let currentDate = moment(startDate);
  
    while (currentDate <= moment(endDate)) {
      datesArray.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.clone().add(1, 'day');
    }
  
    return datesArray;
  }
  
  
    
}

/* ------------------------ User controller ends here ----------------------- */

module.exports = AttendanceController