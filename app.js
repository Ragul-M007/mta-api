/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-01-30 17:53:11
 * @modify date 2021-02-27 14:45:44
 * @desc [description]
 */

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var indexRouter = require('./routes/index.routes');
var winston = require('./utils/winston')
var passport = require('passport')
var cors = require('cors')
const bodyParser = require('body-parser')
const cron = require('node-cron');
const UtilsController = require('./controllers/utils.controller');
const UtilsModel = require("./models/utils.model");
const PushNoti = require("./utils/push-notification");
var app = express();
// Using ESM syntax
var fs = require('fs');
const moment = require('moment')
var morgan = require('morgan');

const { ExtractJwt, Strategy } = require('passport-jwt');
const UserModel = require('./models/user.model');
const { attendanceCounts } = require('./controllers/attendance.controller');
const attendanceModel = require("./models/attendance.model");
const ProjectModel = require("./models/projects.model");
const AttendanceController = require('./controllers/attendance.controller')

// combined logs
app.use(morgan('combined', { stream: winston.stream }));
// app.use(morgan('combined', { "stream": winston.stream.write}));  





/** PASSPORT SETUP */

/** Passport initialize */
app.use(passport.initialize());

/** Passport session */
app.use(passport.session());



var opts = {
  jwtFromRequest: ExtractJwt.fromExtractors([extractor]),
  secretOrKey: process.env.JWT_SECRET,
  issuer: process.env.JWT_ISSUER
}

// jwt 
// decode -> user instance + exp + iat + issuer

// passport 


passport.use(new Strategy(opts, async function (user, done) {

  try {

    done(undefined, user)

  }
  catch (err) {
    // console.log(err)
    done(err, undefined)
  }

}))


function extractor(req) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies['x-access-token'];
  return token;
}




app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use('/mta', indexRouter);





// app.use('/images', express.static(__dirname + '/images'));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
// deleteDocuments();
// async function deleteDocuments(){
//   try{
//       var [res]= await UtilsModel.getDuration();
//       console.log(res[0].duration);
//       if(res){
//         let day = '*';
//         let month = '*';
//         // Schedule tasks to be run on the server.
//         if(res[0].duration_type == 'Days'){
//         day = res[0].duration;
//         }else{
//         month = res[0].duration;
//         }
//     cron.schedule('59 23 '+day+' '+month+' *', async function () {
//       let data = await UtilsController.delete_docs();
//       console.log("data+++>", data);
//       if (data) {
//         let del = await UtilsController.delete(data[0].document_id);
//         for (var i = 0; i < data.length; i++) {
//           let files = JSON.parse(data[i].file);
//           console.log("files", files);
//           files.map(item => {
//             let file = "./public/uploads/" + item;
//             fs.unlink(file, (err) => {
//               if (err) throw err;
//               console.log('successfully deleted', file);
//             })
//           })
//         }
//       } else {
//         console.log("Document not Deleted");
//       }
//     });
//     }
//   }catch(error){
//     console.log('error-->',error)

//   }
// }

cron.schedule('00 09 * * *', async function () {
  let user_id;
  let [users] = await UserModel.find({ user_id });
  // console.log("users",users);
  if (users.length) {
    console.log(users);
    for (var i = 0; i < users.length; i++) {
      if (moment(users[i].dob).format("YYYY/MM/DD") == moment(new Date()).format("YYYY/MM/DD")) {
        let title = "Hey" + " " + users[i].name;
        console.log(title);
        let description = "Happy birthday";
        var payload = {
          'title': title,
          'description': description,
          'user_id': users[i].user_id,
          'user_type': '',
          'img_url': 'image/1619169926588_user_img.png'

        }
        let notiSuccess = await PushNoti.PushNotification(payload);

      }
    }
  }
});

require('./utils/socket');
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
});
// var cors = require('cors');    
// app.use(cors({credentials: true, origin: '*'}));

// var currentdate = new Date().toLocaleTimeString();

// if(currentdate === "4.52.00"){
//   console.log("settttttttttttttttttt")
// }

// async function getDateTime() {
//   var currenttime = new Date().toLocaleTimeString(undefined, {timeZone: 'Asia/Kolkata'});
//   //console.log("-------time----->",currenttime)
//   if(currenttime == '7:00:00 PM'){
//     getNotify_users = await UserModel.getNotify_user()
//     //console.log("-------------->",getNotify_users[0])

//     var succnoti = getNotify_users[0].map((item)=>{
//       var payload= {
//       'title':"Have you Logout ?",
//       'description':"it's 7 o clock can you Please logout !",
//       'user_id':item.user_id,
//       'user_type':item.user_type
//       } 

//       let notiSuccess= PushNoti.PushNotification(payload);
//     })
//   }
// }

// setInterval(function(){
//  getDateTime();
// }, 1000);

require('dotenv').config();
const { HOUR, MINUTES } = process.env;
console.log('HOURS-->', HOUR)
console.log('MINUTES-->', HOUR)

// Once user forgot the signout,Auto signout on particular time using cron-job

cron.schedule(`${MINUTES} ${HOUR} * * *`, async function () {

  async function attendance() {
    const currentdate = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const formattedDate = currentdate.toLocaleDateString('en-US', options).replace(/\//g, '-');
    const [month, day, year] = formattedDate.split('-');
    const date = `${year}-${month}-${day}`;
    let [attendance] = await attendanceModel.getProjects({ date })
    // console.log('Attendance Details--->',attendance);
    const result = attendance.map((project) => { return project.project_id })
    const project_ids = [...new Set(result)];
    // const result1 = attendance.map((project) => {return project.user_id})
    console.log('project_ids-->', project_ids)
    for (let index = 0; index < project_ids.length; index++) {
      const project_id = project_ids[index];
      let [userDetails] = await attendanceModel.getUsers({ project_id, date })
      const result1 = userDetails.map((user) => { return user.user_id })
      const user_ids = [...new Set(result1)];
      console.log('user_ids-->', user_ids);
      for (let i = 0; i < user_ids.length; i++) {
        const user_id = user_ids[i];
        console.log('user_id -->', user_id);
        // console.log('project_id -->',project_id)
        // console.log('date1212-->',date)
        let [attendanceData] = await attendanceModel.getAttendanceData({
          user_id, project_id, date
        })
        // console.log('attendanceData-->',attendanceData)
        for (let j = 0; j < attendanceData.length; j++) {
          if (j === attendanceData.length - 1 && attendanceData[j].checkType == 'IN') {
            console.log('Auto signOut');
            console.log('user_id -->', user_id)
            console.log('project_id -->', project_id)
            const utcTimeString = new Date();
            const utcDate = new Date(utcTimeString);
            // Add 5 hours and 30 minutes to the UTC time
            utcDate.setUTCHours(utcDate.getUTCHours() + 5);
            utcDate.setUTCMinutes(utcDate.getUTCMinutes() + 30);
            // Format the date string
            const checkTime = utcDate.toISOString().replace(/T/, ' ').replace(/\.\d{3}Z$/, '');
            const checkType = 'OUT';
            const auto_checkout = 1;
            const { latLng, location_name } = attendanceData[j];
            let [attendance] = await attendanceModel.create({
              user_id, checkType, checkTime, latLng, location_name, project_id, auto_checkout
            })
          }
        }
      }
    }
  }
  attendance();
});

module.exports = app;
