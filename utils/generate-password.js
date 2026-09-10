// 'use strict';
const nodemailer = require('nodemailer');
const passwordGenerator = require('secure-random-password');
const QueryGenerator = require("../generators/query.generator")
const database = require("../config/database")

// Generate Password || OTP
function generatePassword(opts){
    console.log(opts);
   return passwordGenerator.randomPassword(opts);
  };

  module.exports = {generatePassword};