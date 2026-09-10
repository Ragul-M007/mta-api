/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 12:01:11
 * @desc [description]
 */

/* --------------------------------- Imports starts here -------------------------------- */


const { Message } = require("../utils/messages");
const Response = require("../utils/response");
const mailer = require("../utils/mailler");
// const ProjectModel = require("../models/projects.model.js");
// const { generatePassword } = require("../utils/generate-password");
const AppErrorHandler = require("../utils/error-handler");
const UserModel = require("../models/user.model.js");
const { StatusCodes } = require("http-status-codes");
const jwt = require('jsonwebtoken');
const moment = require('moment');
var fs = require('fs');
const logger = require('../utils/winston');
const { user_limit } = require('../utils/chat');
/* --------------------------------- Imports ends here -------------------------------- */



/* ----------------------- Customer controller starts here ---------------------- */

const UserController = {




    /**
     * ANCHOR user creation 
     * @param {*} req 
     * @param {*} res 
     */
    async create(req, res) {
        // getting request from body
        let { role_id, name, email, mobile_no, password, city, area, prof, state, status, dob, anniver_date, user_img } = req.body
        let { created_by } = req.user;
        try {
            let [users_name_dublicate] = await UserModel.find({ name });
            let [users_email_dublicate] = await UserModel.find({ email })

            if (users_name_dublicate.length != 0) {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Users"))
            }
            else if (users_email_dublicate != 0) {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Users"))
            }
            else {
                if (req.user.role == "ADMIN") {
                    if (password == "") {
                        password = password.generatePassword({ characters: [passwordGenerator.lower, passwordGenerator.upper, passwordGenerator.digits] });
                    }
                    console.log(password);
                    let [User] = await UserModel.create({
                        role_id, name, email, mobile_no, password, city, area, prof, state, status, dob, anniver_date, user_img, created_by
                    })
                    if (User.insertId) {
                        // [User] = await UserModel.updateDeviceId({
                        //     user_id: User.insertId
                        // })
                        mailer.ProjectCreateMail({ "email": email, "password": password, "mobile_no": mobile_no });
                        new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Creation("User"))
                    } else {
                        new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Creation("User"))
                    }
                }
                else if (req.user.role == "STAFF") {
                    if (role_id == 1) {
                        return res.status(401).send({
                            status: false,
                            message: "You have no access to create the admin !"
                        })
                    } else {
                        if (password == "") {
                            password = password.generatePassword({ characters: [passwordGenerator.lower, passwordGenerator.upper, passwordGenerator.digits] });
                        }
                        console.log(password);
                        let [User] = await UserModel.create({
                            role_id, name, email, mobile_no, password, city, area, state, status, dob, anniver_date, prof, user_img
                        })
                        if (User.insertId) {
                            // [User] = await UserModel.updateDeviceId({
                            //     user_id: User.insertId
                            // })
                            mailer.ProjectCreateMail({ "email_id": email, "password": password, "mobile_no": mobile_no });
                            new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Creation("User"))
                        } else {
                            new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Creation("User"))
                        }
                    }
                }
                else {
                    if (role_id == 1) {
                        return res.status(401).send({
                            status: false,
                            message: "You have no access to create the admin !"
                        })
                    }
                    else if (role_id == 2) {
                        return res.status(401).send({
                            status: false,
                            message: "You have no access to create the staff !"
                        })
                    } else {
                        if (password == "") {
                            password = password.generatePassword({ characters: [passwordGenerator.lower, passwordGenerator.upper, passwordGenerator.digits] });
                        }
                        console.log(password);
                        let [User] = await UserModel.create({
                            role_id, name, email, mobile_no, password, city, area, state, status, dob, anniver_date, prof, user_img
                        })
                        if (User.insertId) {
                            // [User] = await UserModel.updateDeviceId({
                            //     user_id: User.insertId
                            // })
                            new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Creation("User"))
                        } else {
                            new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Creation("User"))
                        }
                    }
                }

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



    // Public User SignUp

    async publicUserSignUp(req, res) {
        // getting request from body
        let { role_id, name, email, mobile_no, password, city, area, prof, state, status, dob, anniver_date, user_img, public_user } = req.body
        try {
            let [users_name_dublicate] = await UserModel.find({ name });
            let [users_email_dublicate] = await UserModel.find({ email })

            console.log("------------->", users_email_dublicate)
            if (users_name_dublicate.length != 0) {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Users"))
            }
            else if (users_email_dublicate != 0) {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Email"))
            }
            else {
                console.log("+++++>", password)

                if (password == "" || password == null) {

                    function generatePassword() {
                        var length = 5,
                            charset = "0123456789",
                            retVal = "";
                        for (var i = 0, n = charset.length; i < length; ++i) {
                            retVal += charset.charAt(Math.floor(Math.random() * n));
                        }
                        return retVal;
                    }

                    password = generatePassword();
                    //password=password.generatePassword({ characters: [passwordGenerator.lower, passwordGenerator.upper, passwordGenerator.digits] });

                }
                console.log(password);
                let [User] = await UserModel.create({
                    role_id, name, email, mobile_no, password, city, area, prof, state, status, dob, anniver_date, user_img, public_user
                })
                if (User.insertId) {
                    // [User] = await UserModel.updateDeviceId({
                    //     user_id: User.insertId
                    // })
                    mailer.ProjectCreateMail({ "email": email, "password": password, "mobile_no": mobile_no });
                    new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Creation("User"))
                } else {
                    new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Creation("User"))
                }



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
                project_id, user_id
            } = req.query

            let {
                role, created_by
            } = req.user

            let users

            if (project_id) {
                let [projectIUser] = await UserModel.getProjectUsers({
                    project_id
                })
                let [getUser] = await UserModel.find({
                    role, created_by
                })
                users = getUser.filter(({ user_id: id1 }) => !projectIUser.some(({ user_id: id2 }) => id1 === id2));
            } else if (user_id) {
                let [getUser] = await UserModel.find({
                    user_id
                })
                users = getUser;
            }
            else {
                let [getUser] = await UserModel.find({
                    role, created_by
                })
                users = getUser;
            }

            if (users.length) {
                // if users found
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("User"),
                    users
                )

            }
            else {
                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoDataFound("User"),
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
    // async update(req, res) {

    //     // getting request from body
    //     let { role_id, name, email, loginpin, mobile_no, password, city, area, prof, state, status, dob, anniver_date, user_img } = req.body;
    //     let { user_id } = req.params;
    //     // let { created_by } = req.user;
    //     // ✅ Handle created_by (null + "null")
    //     let created_by;
    //     if (req.body.hasOwnProperty("created_by")) {
    //       if (req.body.created_by === null || req.body.created_by === "null") {
    //         created_by = null;
    //       } else {
    //         created_by = req.body.created_by;
    //       }
    //     } else {
    //       created_by = req.user.created_by;
    //     }

    //     try {

    //         console.log('created_byData', created_by)

    //         if (user_img) {
    //             let [users] = await UserModel.find({
    //                 user_id
    //             })
    //             console.log("users ===>", users);
    //             if (users.length && users[0].user_img) {
    //                 users.forEach(async item => {
    //                     let path = `${process.env.APP_BASE_PATH}public/uploads/${item.user_img}`
    //                     try {
    //                         fs.unlink(path)
    //                         console.log(`DELETED ${path}`)
    //                     }
    //                     catch (err) {
    //                         console.log(err)
    //                     }
    //                 })
    //             }
    //         }
    //         else {
    //             user_img = null
    //         }
    //         // if(dob == "Invalid date"){
    //         //     console.log("STEP1",user_id)
    //         //     var [userdetails] = await UserModel.findByIdAndUpdate(user_id,{
    //         //         role_id, name, email, loginpin,mobile_no, status,city,area,prof,state,anniver_date, user_img }
    //         //     )
    //         // }
    //         // else if(anniver_date == "Invalid date"){
    //         //     console.log("STEP2",user_id)
    //         //     var [userdetails] = await UserModel.findByIdAndUpdate(user_id,{
    //         //         role_id, name, email, loginpin,mobile_no, status,city,area,prof,state,dob, user_img }
    //         //     )
    //         // }
    //         // else if(dob == "Invalid date" && anniver_date == "Invalid date"){
    //         //     console.log("STEP3",user_id)
    //         //     var [userdetails] = await UserModel.findByIdAndUpdate(user_id,{
    //         //         role_id, name, email, loginpin,mobile_no, status,city,area,prof,state, user_img }
    //         //     )
    //         // }
    //         // else if(password){
    //         //     console.log("STEP4",user_id)
    //         //     var [userdetails] = await UserModel.findByIdAndUpdate(user_id,{password})
    //         // }
    //         // else{
    //         // console.log("STEP5",user_id)

    //         if (password) {
    //             var [userdetails] = await UserModel.findByIdAndUpdate(user_id, { password })
    //         } else {
    //             var [userdetails] = await UserModel.findByIdAndUpdate(user_id, {
    //                 role_id, name, email, loginpin, mobile_no, status, city, area, prof, state, dob, anniver_date, user_img, created_by
    //             }
    //             )
    //         }
    //         // }


    //         if (password) {
    //             let [getmail] = await UserModel.GetMailforId(user_id);
    //             mailer.PasswordReset({ "email": getmail[0].email, "password": password });
    //         }


    //         // CustomerDetails updatedted successfully
    //         if (userdetails.affectedRows) {
    //             let [users] = await UserModel.find({
    //                 user_id
    //             })
    //             // sending success response to client
    //             new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Updation("User"), users[0])

    //         }
    //         else {
    //             // failed response
    //             new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Updation("User"), userdetails)

    //         }
    //     }
    //     catch (err) {
    //         new AppErrorHandler(res, err)
    //     }
    // },

    async update(req, res) {
  let {
    role_id,
    name,
    email,
    loginpin,
    mobile_no,
    password,
    city,
    area,
    prof,
    state,
    status,
    dob,
    anniver_date,
    user_img,
  } = req.body;

  let { user_id } = req.params;

  // ✅ Handle created_by (null + "null")
  let created_by;
  if (req.body.hasOwnProperty("created_by")) {
    if (req.body.created_by === null || req.body.created_by === "null") {
      created_by = null;
    } else {
      created_by = req.body.created_by;
    }
  } else {
    created_by = req.user.created_by;
  }

    console.log("created_by value:", created_by, typeof created_by);

  try {
    console.log("GET USER ID", user_id);

    // ✅ Handle image delete
    if (user_img) {
      let [users] = await UserModel.find({ user_id });

      if (users.length && users[0].user_img) {
        users.forEach(async (item) => {
          let path = `${process.env.APP_BASE_PATH}public/uploads/${item.user_img}`;
          try {
            fs.unlink(path);
            console.log(`DELETED ${path}`);
          } catch (err) {
            console.log(err);
          }
        });
      }
    } else {
      user_img = null;
    }

    let userdetails;

    // ✅ Password update (separate)
    if (password) {
      [userdetails] = await UserModel.findByIdAndUpdate(user_id, {
        password,
      });
    } else {
      [userdetails] = await UserModel.findByIdAndUpdateUser(user_id, {
        role_id,
        name,
        email,
        loginpin,
        mobile_no,
        status,
        city,
        area,
        prof,
        state,
        dob,
        anniver_date,
        user_img,
        created_by, // ✅ now supports NULL
      });
    }

    // ✅ Send password mail
    if (password) {
      let [getmail] = await UserModel.GetMailforId(user_id);
      mailer.PasswordReset({
        email: getmail[0].email,
        password: password,
      });
    }

    // ✅ Response
    if (userdetails.affectedRows) {
      let [users] = await UserModel.find({ user_id });

      new Response(res)._SuccessResponse(
        Message.Common.SuccessMessage.Updation("User"),
        users[0]
      );
    } else {
      new Response(res, StatusCodes.OK)._ErrorMessage(
        Message.Common.FailureMessage.Updation("User"),
        userdetails
      );
    }
  } catch (err) {
    new AppErrorHandler(res, err);
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
        let { user_id } = req.params
        try {


            let [deletecustomer] = await UserModel.findByIdAndDelete(user_id)




            if (deletecustomer.affectedRows) {

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.Deletion("User"))

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Deletion("User"))

            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },



    async login(req, res) {

        let {
            email_id,
            password,
            loginpin,
            device_token
        } = req.body

        try {

            let [user] = await UserModel.getLogin({
                email_id,
                password,
                loginpin

            })

            if (user.length) {
                let payload = {
                    name: user[0].name,
                    user_id: user[0].user_id,
                    email_id: user[0].email,
                    mobile_no: user[0].mobile_no,
                    user_img: user[0].user_img,
                    role: user[0].role,
                    city: user[0].city,
                    area: user[0].area,
                    state: user[0].state,
                    device_token: user[0].device_token,
                    created_by: user[0].created_by
                }
                let options = { expiresIn: process.env.JWT_EXPIRE_TIME, issuer: process.env.JWT_ISSUER };
                let secret = process.env.JWT_SECRET;
                let token = jwt.sign(payload, secret, options);

                // let {device_token}=payload;
                //  user_id = payload.user_id;
                console.log('device_token-->', device_token);
                if (device_token) {
                    let [tokenUpdate] = await UserModel.findByIdAndUpdate(payload.user_id, {
                        device_token
                    })
                    console.log(tokenUpdate);
                }
                // create http only cookie with refresh token that expires in 10 mins
                const cookieOptions = {
                    httpOnly: true,
                    expires: new Date(moment().add(31, 'days')),
                    overwrite: true
                };

                res.cookie('x-access-token', token, cookieOptions);
                const [getloginTime] = await UserModel.getLoginTime(user[0].user_id);
                // Create a new Date object
                var currentDate = new Date();

                // Get the components of the date and time
                var year = currentDate.getFullYear();
                var month = ('0' + (currentDate.getMonth() + 1)).slice(-2); // Months are zero-based
                var day = ('0' + currentDate.getDate()).slice(-2);
                var hours = ('0' + currentDate.getHours()).slice(-2);
                var minutes = ('0' + currentDate.getMinutes()).slice(-2);
                var seconds = ('0' + currentDate.getSeconds()).slice(-2);

                // Format the date and time
                var formattedDateTime = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;

                console.log(formattedDateTime);
                const last_login_time = formattedDateTime;
                const userDetails = {
                    user_id: user[0].user_id,
                    last_login_time
                }
                console.log('userDetails--->', userDetails)
                if (getloginTime.length == 0) {
                    const [addloginTime] = await UserModel.addLoginTime(userDetails);
                } else {
                    const { id } = getloginTime[0];
                    const updateloginTime = await UserModel.updateLoginTime(userDetails, id);
                }

                new Response(res)._SuccessResponse("Login success !", payload, token)

            }
            else {
                // new Response(res)._ErrorMessage("Invalid Email (or) Password, Please try again or click forget password to reset !")
                new Response(res)._ErrorMessage("Incorrect Email or Password. Check your credentials and try once more.");

            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },

    async profile(req, res) {
        // res.send(req.user)
        if (req.params) {
            let { user_id } = req.params;

            let [userData] = await UserModel.userDetails(user_id);
            console.log(userData);
            res.send(
                {
                    status: true,
                    Message: "User data is fetched successfully",
                    data: [{
                        "name": userData[0].name,
                        "user_id": userData[0].user_id,
                        "email": userData[0].email,
                        "mobile_no": userData[0].mobile_no,
                        "user_img": userData[0].user_img,
                        "role": userData[0].role,
                        "city": userData[0].city,
                        "area": userData[0].area,
                        "state": userData[0].state,

                    }]
                }
            )
        }
        else {
            res.send(
                {
                    status: false,
                    Message: "Error in fetching",
                }
            )
        }


        // if(req.user){
        //     console.log("ressssss")
        //     new Response(
        //         res,
        //         StatusCodes.OK
        //     )._SuccessResponse(
        //         Message.Common.SuccessMessage.Fetch("Feeds")
        //     )
        // }
    },
    async userroles(req, res) {
        let [userRoles] = await UserModel.getUserRoles();
        if (userRoles.length) {

            new Response(res)._SuccessResponse("success", userRoles)
        } else {
            new Response(res)._ErrorMessage("Failed to fetch the User roles")

        }
    },
    async handshake(req, res) {

        let [userRoles] = await UserModel.getUserRoles();
        if (userRoles.length) {

            new Response(res)._SuccessResponse("success", userRoles)
        } else {
            new Response(res)._ErrorMessage("Failed to fetch the User roles")

        }
    },
    //Forgot Password
    async forgotPassword(req, res) {

        // getting request from body
        let { email_id } = req.body;
        // let { user_id } = req.params;
        console.log(req.body);
        try {
            let [userdetails] = await UserModel.findEmail({
                email_id
            })


            if (userdetails.length) {
                console.log("users ===>", userdetails);
                mailer.sendMail({ "email_id": email_id, "OTP": 'Y' });
                // console.log(isSent);
                // if(isSent){

                // sending success response to client
                new Response(res)._SuccessResponse(Message.Common.SuccessMessage.EmailSent)

                // }else{
                //     new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.EmailSent) 
                // }

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.EmailSent)

            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },
    // async userCounts(res,req){
    //     try{
    //     let [getUserCounts] = await UserModel.getUserCounts()
    //             console.log("$$$$$$$",getUserCounts.length)
    //             if(getUserCounts.length > 0) {
    //                 console.log("12345")
    //                     // sending success response to client
    //              // new Response(res)._SuccessResponse(Message.Common.SuccessMessage.fetch("Users Counts"))
    //              new Response(
    //                 res,
    //                 StatusCodes.OK
    //             )._SuccessResponse(
    //                 Message.Common.SuccessMessage.Fetch("Project"),
    //                 getUserCounts
    //             )

    //             }
    //             else {
    //                 // failed response
    //                 // new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.EmailSent)

    //             }

    //         }
    //         catch (err) {
    //             new AppErrorHandler(res, err)
    //         }
    // },

    async userCounts(req, res) {
        try {

            let [getUsers] = await UserModel.getUserCounts()
            if (getUsers.length > 0) {

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Users counts"),
                    getUsers
                )

            }
            else {

                // if no users found
                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("No counts"),
                    getUsers
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

    async updateUserCounts(req, res) {

        try {

            let [updateUserCounts] = await UserModel.updateUserCount()
            if (updateUserCounts.affectedRows > 0) {

                // if users found

                new Response(
                    res,
                    StatusCodes.OK
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Updation("Users Counts")
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
    async validateOTP(req, res) {

        // getting request from body
        let { email_id, otp } = req.body;
        // let { user_id } = req.params;
        // console.log(req.body);
        try {
            let [validateOTP] = await UserModel.validateOTP({
                email_id, otp
            })

            if (validateOTP.length > 0) {
                let isVerified = 1;
                await UserModel.UpdateStatus(
                    email_id, otp, isVerified
                )
                new Response(res, StatusCodes.OK)._SuccessResponse("Success")

            }
            else {
                // failed response
                new Response(res, StatusCodes.OK)._ErrorMessage("Invalid OTP")

            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },
    async changePassword(req, res) {

        // getting request from body
        let { email_id, password, newPassword } = req.body;
        // let { user_id } = req.params;
        console.log(req.body);
        try {
            let [userdetails] = await UserModel.findEmail({
                email_id
            })


            if (userdetails.length) {
                // console.log("users ===>",userdetails);
                let obj = userdetails[0];
                if (obj.password == password || password == null || password == "") {
                    password = newPassword;
                    let [checkValid] = await UserModel.checkValidOTP(obj.email);
                    if (checkValid[0].isVerified === 1) {
                        await UserModel.findByIdAndUpdate(obj.user_id, { password })
                        var user = { email_id: userMail, otp: null, isVerified: 0 };
                        await UserModel.updateOTPVerification(userMail, user)
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.ChangePassword)
                    } else {
                        new Response(res, StatusCodes.OK)._ErrorMessage("Your not verified OTP please check your email")
                    }

                }
                else {
                    // failed response
                    new Response(res, StatusCodes.OK)._ErrorMessage("Old Password is Incorrect...!")

                }
            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },

    async changePin(req, res) {

        // getting request from body
        let { email_id, loginpin, } = req.body;
        // let { user_id } = req.params;
        try {
            let [userdetails] = await UserModel.findEmail({
                email_id
            })


            if (userdetails.length > 0) {
                // console.log("users ===>",userdetails);
                let obj = userdetails[0];
                if (loginpin !== null && loginpin !== "") {
                    loginpin = loginpin;
                    let [checkValid] = await UserModel.checkValidOTP(obj.email);
                    if (checkValid[0].isVerified === 1) {
                        await UserModel.findByIdAndUpdate(obj.user_id, { loginpin })
                        var user = { email_id: userMail, otp: null, isVerified: 0 };
                        await UserModel.updateOTPVerification(userMail, user)
                        // database.connection.promise().query(QueryGenerator.update("otp_verification", user,{email_id : userMail}))
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.ChangePassword)
                    } else {
                        new Response(res, StatusCodes.OK)._ErrorMessage("you don't have access change pin")
                    }

                }
                else {
                    // failed response
                    new Response(res, StatusCodes.OK)._ErrorMessage("Old Password is Incorrect...!")

                }
            }
            else {
                new Response(res, StatusCodes.OK)._ErrorMessage("User not available...!")
            }
        }
        catch (err) {
            new AppErrorHandler(res, err)
        }
    },

    async deleteImage(req, res) {
        let { user_id } = req.params;

        console.log(user_id);
        let [deleteUsr] = await UserModel.deleteUser(user_id);
        console.log("___________>", deleteUsr)

        if (deleteUsr.affectedRows) {
            res.send(
                {
                    status: true,
                    Message: "User deleted successfully",
                }
            );
        }
        else {
            res.send(
                {
                    status: false,
                    Message: "Error in fetching",
                }
            )
        }



    },

    async deleteDeviceId(req, res) {
        console.log("inside deleteDeviceId");
        console.log("test", req.params);

        let { user_id } = req.params;

        if (user_id) {
            console.log("user_id", user_id);
            let [deleteData] = await UserModel.deleteDeviceId(user_id);
            console.log(deleteData);

            if (deleteData.affectedRows == 1) {
                res.send(
                    {
                        status: true,
                        message: "Device Id deleted successfully",
                    }
                );
            }
            else {
                res.send(
                    {
                        status: false,
                        message: "Unable to delete Device Id"
                    }
                )
            }

        }

        // if(req.params)
        // {

        // }

    },
    async getUserList(req, res) {
        try {
            let {
                created_by,
                role
            } = req.user
            const [getUserList] = await UserModel.getUserList(created_by);
            if (getUserList.length > 0) {
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Users"), getUserList);
            } else {
                logger.error('users data not found');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Users"));
            }
        } catch (error) {
            logger.error('get user error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },
    async getUserLoginHours(req, res) {
        try {
            const { user_id } = req.query;
            if (user_id != null && user_id != '' && user_id != 'null' && user_id != undefined) {
                const [loginDetails] = await UserModel.getLoginTime(user_id);
                if (loginDetails.length > 0) {
                    const { last_login_time } = loginDetails[0];
                    console.log('loginDetails-->', loginDetails);
                    const last_login_date = moment(last_login_time, 'YYYY-MM-DD HH:mm:ss');
                    const current_date = moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
                    const difference = moment.duration(current_date.diff(last_login_date));
                    const days = difference.days();
                    const hours = difference.hours();
                    // const hours = 25;
                    console.log(`${difference.days()} days ${difference.hours()} hours`);
                    if (days >= 1) {
                        logger.info('users login time fetched successfully');
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("User details"), days);
                    } else {
                        logger.info('users login time less than 24 hours');
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("User details"), days);
                    }
                } else {
                    logger.error('Invalid user id');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("User id"));
                }
            }
        } catch (error) {
            logger.error('get user login hours error is--->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },

    async getAllUsersWithPagination(req, res) {
        try {
            let { role_id, page_no, page_count, search, status } = req.query;
            let {
                created_by,
                role
            } = req.user
            console.log('page_no--<', page_no)
            let user_offset_value;
            let user_count;
            if (page_count == 'null' || page_count == null || page_count == '') {
                page_count = user_limit;
                user_offset_value = (page_no * page_count) - page_count;
            } else {
                user_offset_value = (page_no * page_count) - page_count;
            }
            console.log('user_count-->', user_offset_value);
            const userData = {
                page_count,
                user_offset_value,
                role_id,
                search,
                status
            }
            console.log('userData-->', userData)
            const [user_total_count] = await UserModel.user_total_count(userData,created_by);
            const { total_count } = user_total_count[0];
            console.log('user_total_count-->', user_total_count[0])
            const [usersList] = await UserModel.getUserwithPagination(userData,created_by);
            if (usersList.length > 0) {
                logger.info('users fetched successfully');
                new Response(res, StatusCodes.OK)._SuccessResponseWithPagination(Message.Common.SuccessMessage.Fetch("User details"), usersList, total_count);
            } else {
                logger.info('users not found');
                new Response(res, StatusCodes.OK)._SuccessResponseWithPagination(Message.Common.FailureMessage.NoDataFound("Users"), usersList, total_count);
            }
        } catch (error) {
            logger.error('get user error is--->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },

    async getBackLink(req, res) {
        try {
            const [backlink] = await UserModel.getBackLink()
            if (backlink.length > 0) {
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Back link"), backlink);
            } else {
                new Response(res, StatusCodes.OK)._ErrorMessage(Message.Common.FailureMessage.Fetch("Back link"), backlink);

            }
        }
        catch (error) {
            logger.error('get backlink', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }

    },



}

/* ------------------------ User controller ends here ----------------------- */

module.exports = UserController
