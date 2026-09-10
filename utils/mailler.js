
// 'use strict';
const nodemailer = require('nodemailer');
const { database } = require("../config/database")
const QueryGenerator = require("../generators/query.generator")
const axios = require('axios');
const passwordGenerator = require('secure-random-password');
const UserModel = require('../models/user.model');

const MAIL_USER = process.env.OUTLOOK_USER || 'mtaconnectofficial@gmail.com';
const MAIL_PASS = process.env.OUTLOOK_PASS || 'tglkpjxibsacmnqx';
const MAIL_FROM = process.env.MAIL_FROM || `"MTA Konnect" <${MAIL_USER}>`;

function getTransporter() {
    if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASS) {
        return nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.OUTLOOK_USER,
                pass: process.env.OUTLOOK_PASS
            }
        });
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'mtaconnectofficial@gmail.com',
            pass: 'tglkpjxibsacmnqx'
        }
    });
}

   async function sendMail(request, callback) {
        console.log("user_id ==> ",request);
    userMail = request.email_id;
    //var newPwd=passwordGenerator.randomPassword({ length: 4, characters: password.digits });

   // if(request.OTP == 'Y'){
        var newPwd=generatePassword();

   // }
    var transporter = getTransporter();


    console.log(" Otp Number ====> ",newPwd)
    var mailOptions = {
        from: MAIL_FROM, // sender address
        to: userMail, // list of receivers
        subject: 'Your MTA Konnect verification code', // Subject line
        text: `Your MTA Konnect verification code is: ${newPwd}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
            <p>Your MTA Konnect verification code is:</p>
            <p style="font-size:20px;font-weight:bold;">${newPwd}</p>
        </div>`
    };

            let [cheackUsers] = await UserModel.checkValidOTP(userMail);
            console.log("####",cheackUsers)
             if(cheackUsers.length === 0){   
                console.log("POST")
                    transporter.sendMail(mailOptions, function(err, info) {
                        if (err){
                            console.log("Error:**send email**", err);
                            
                        }else{
                        var user= {email_id:userMail,otp:newPwd,isVerified:0};
                        // query = QueryGenerator.insert(`otp_verification`,{email_id:userMail,otp:newPwd,isVerified:0})
                        // return  await database.promise().query(query)
                            return database.connection.promise().query(QueryGenerator.insert("otp_verification", user))
                        // callback(null, info);
                        }
                    });
                }
                else{
                    console.log("PUTTT")
                    transporter.sendMail(mailOptions, function(err, info) {
                        if (err){
                            console.log("Error:**send email**", err);
                            
                        }else{
                            var user= {email_id:userMail,otp:newPwd,isVerified:0};
                        // query = QueryGenerator.insert(`otp_verification`,{email_id:userMail,otp:newPwd,isVerified:0})
                        // return  await database.promise().query(query)
                            return database.connection.promise().query(QueryGenerator.update("otp_verification", user,{email_id : userMail}))
                        // callback(null, info);
                        }
                    });
                }

};

function ProjectCreateMail(request, callback) {
    console.log("data inside ------------------------------------ ==> ",request);
userMail = request.email;
var Passwordd = request.password;
var mobile_no = request.mobile_no;
//var newPwd=passwordGenerator.randomPassword({ length: 4, characters: password.digits });

var transporter = getTransporter();

var mailOptions = {
    from: MAIL_FROM, // sender address
    to: userMail, // list of receivers
    subject: 'Your MTA Konnect account is ready', // Subject line
    text: `Hi,\n\nYour MTA Konnect account is ready to use.\n\nLogin ID: ${userMail}\nPassword: ${Passwordd}\n\nPlease sign in and update your password at your earliest convenience.\n\nRegards,\nMTA Konnect Team`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;">
        <p>Hi,</p>
        <p>Your MTA Konnect account is ready to use.</p>
        <p>Login ID: ${userMail}<br/>Password: ${Passwordd}</p>
        <p>Please sign in and update your password at your earliest convenience.</p>
        <p>Regards,<br/>MTA Konnect Team</p>
    </div>`
};

// let message = `Hii.. here MULTITECH ASSOCIATES Your MTA KONNECT account has been created successfully...! and Your password is ${Passwordd}`
let message = `Hii.., here MULTITECH ASSOCIATES Your MTA KONNECT account has been created successfully...! and Your password is ${Passwordd}`
console.log("MESSAGE--->",message)
// let sms_for_customer = axios.get(`http://smsserver9.creativepoint.in/api.php?username=multitech&password=648158&to=${mobile_no}&from=MULARC&message=${message}&PEID=1701168983845812603&templateid=1707169113507770776`)
axios.get(`http://sms.creativepoint.in/api/push.json?apikey=67db9ba581b51&route=transsms&sender=MULASO&mobileno=${mobile_no}&text=${message}`)
    .then((sms_for_customer) => {
        console.log("MESSAGE RESPONSE--->",sms_for_customer.data)
    })
    .catch((smsErr) => {
        console.log("Error:**send sms**", smsErr.message);
    });
        transporter.sendMail(mailOptions, function(err, info) {
            if (err)
                console.log("Error:**send email**", err);
            else
              //var user= {email_id:userMail,otp:newPwd,isVerified:0};
            // query = QueryGenerator.insert(`otp_verification`,{email_id:userMail,otp:newPwd,isVerified:0})
            // return  await database.promise().query(query)
            //return database.connection.promise().query(QueryGenerator.insert("otp_verification", user))
                 callback(null, info);
        });

};

function PasswordReset(request, callback) {
    console.log("data inside ------------------------------------ ==> ",request);
userMail = request.email;
userPassword = request.password;
//var newPwd=passwordGenerator.randomPassword({ length: 4, characters: password.digits });

var transporter = getTransporter();

var mailOptions = {
    from: MAIL_FROM, // sender address
    to: userMail, // list of receivers
    subject: 'Your MTA Konnect password has been reset', // Subject line
    text: `Hi,\n\nYour MTA Konnect password has been reset.\n\nNew password: ${userPassword}\n\nRegards,\nMTA Konnect Team`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
        <p>Hi,</p>
        <p>Your MTA Konnect password has been reset.</p>
        <p>New password: <strong>${userPassword}</strong></p>
        <p>Regards,<br/>MTA Konnect Team</p>
    </div>`
};


        transporter.sendMail(mailOptions, function(err, info) {
            if (err)
                console.log("Error:**send email**", err);
            else
              //var user= {email_id:userMail,otp:newPwd,isVerified:0};
            // query = QueryGenerator.insert(`otp_verification`,{email_id:userMail,otp:newPwd,isVerified:0})
            // return  await database.promise().query(query)
            //return database.connection.promise().query(QueryGenerator.insert("otp_verification", user))
                 callback(null, info);
        });

};


function generatePassword() {
    const length = 5;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
}

module.exports = {sendMail,ProjectCreateMail,PasswordReset};
