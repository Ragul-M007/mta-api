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
const newsfeedModel = require("../models/newsfeed.model.js");
const { StatusCodes } = require("http-status-codes");
const jwt = require('jsonwebtoken');
const moment = require('moment')

/* --------------------------------- Imports ends here -------------------------------- */



/* ----------------------- Customer controller starts here ---------------------- */

const NewsfeedController = {




    /**
     * ANCHOR user creation 
     * @param {*} req 
     * @param {*} res 
     */
    async create(req, res) {

        // getting request from body
        let {title_text, description, img_url, feed_type} = req.body


        try {

            let [feeds] = await newsfeedModel.create({
                title_text, description, img_url, feed_type
            })


            if (feeds.insertId) {


                // [User] = await UserModel.find({
                //     User_id: User.insertId
                // })

                // User

                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Creation("NewsFeed / Highlights"))
            } else {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Creation("NewsFeed / Highlights"))
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

            // let {
            //     project_id,
            // } = req.query

            // let {
                
            // } = req.user

            let [feeds] = await newsfeedModel.find({
                
            })

            if (feeds.length) {

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Feeds"),
                    feeds
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("Categories"),
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
        let {title_text, description, img_url, feed_type} = req.body;
        let {id} = req.params
        try {

console.log(img_url);

            if (img_url) {
                let [Feeds] = await newsfeedModel.find({
                    title_text, description, img_url, feed_type
                })
                if (Feeds) {
                    Feeds.forEach(async item => {
                        let path = `${process.env.APP_BASE_PATH}public/uploads/${item.img_url}`
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
                img_url = null
            }

            let [feedsdetails] = await newsfeedModel.findByIdAndUpdate(id, {
                title_text, description, img_url, feed_type
            })




            // CustomerDetails updatedted successfully
            if (feedsdetails.affectedRows) {

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("NewsFeed / Highlights"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("NewsFeed / Highlights"))

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
        let { id } = req.params;
        try {


            let [deleteFeed] = await newsfeedModel.findByIdAndDelete(id)




            if (deleteFeed.affectedRows) {

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("NewsFeed / Highlights"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("NewsFeed / Highlights"))

            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },
 
  
    
}

/* ------------------------ User controller ends here ----------------------- */

module.exports = NewsfeedController