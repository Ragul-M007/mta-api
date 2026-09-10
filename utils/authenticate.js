const { StatusCodes } = require('http-status-codes');
var passport = require('passport');
const { database } = require('../config/database');
const QueryGenerator = require('../generators/query.generator');
const UserModel = require("../models/user.model.js");

 const Authentication = () => async (req, res, next) => {
    try {
        let user_id = req.user.user_id

        let [users]  = await UserModel.find({
            user_id
            })

            const allRole = await UserModel.getUserRoles();
            const getRoleId = allRole[0].filter((e) =>  e.role === req.user.role)


        if(getRoleId[0].role_id && users[0].role_id){
            if(users[0].role_id !== getRoleId[0].role_id){
                res.status(StatusCodes.UNAUTHORIZED).send({
                    status: false,
                    message: "Unauthorized !"
                })
            }
            else{
                next();
            }
        }
        else{
            next();
        }
    } catch (err) {
            console.log(err)
            res.status(StatusCodes.UNAUTHORIZED).send({
                status: false,
                message: "Unauthorized !"
            })
        }
  };

function Access(req, res, next) {
    
    try {
        if (req.user.role != "ADMIN" && req.user.role != "STAFF") {
            // user's role is not authorized
            return res.status(401).send({
                status: false,
                message: "You have no access to access this url !"
            })
        }else{
            next()
        }
       
    }
    catch (err) {
        console.log(err)
        res.status(StatusCodes.UNAUTHORIZED).send({
            status: false,
            message: "Unauthorized !"
        })
    }
}

// function Authentication(req, res, next) {

//     passport.authenticate('jwt', { session: false }, async function (err, user, info) {
//         try {

//             if (user) {
//                 req.user = user
//                 next()
//                 // var [refreshTokens] = await database.connection.promise().query(QueryGenerator.format(`SELECT * FROM shop_refresh_tokens WHERE shop_id = ? AND  revoked is null`), [user.shop_id])

//                 // let rtoken = req.headers['x-refresh-token'] || req.body.refreshToken || req.query.refreshToken || req.cookies['x-refresh-token'] || null



//                 // req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);

//                 // if (req.user.ownsToken(rtoken)) {
//                 //     next()
//                 // }
//                 // else {
//                 //     res.status(StatusCodes.UNAUTHORIZED).send({
//                 //         status: false,
//                 //         message: "Unauthorized !",
//                 //     })
//                 // }
//             } else {
//                 res.status(StatusCodes.UNAUTHORIZED).send({
//                     status: false,
//                     message: "Unauthorized !",
//                 })
//             }
//         }
//         catch (err) {
//             console.log(err)
//             res.status(StatusCodes.UNAUTHORIZED).send({
//                 status: false,
//                 message: "Unauthorized !"
//             })
//         }

//     })(req, res, next);

// }




module.exports = { Authentication,Access };


