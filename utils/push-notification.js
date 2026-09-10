const FCM = require('fcm-node');
const { database } = require("../config/database")
const QueryGenerator = require("../generators/query.generator")
const { notification } = require('../controllers/utils.controller')
const ProjectModel = require('../models/projects.model')
const UserModel = require('../models/user.model')
const UtilsModel = require('../models/utils.model')
const chatModel = require('../models/chat.model');
const meetingModel = require('../models/meeting.model');

var admin = require("firebase-admin");
const serviceAccount = require("../config/mtaapp-c9ed6-firebase-adminsdk-8pboy-de020ed4cf.json");
const { token } = require('morgan');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    // databaseURL: 'https://mtapushnotification-default-rtdb.firebaseio.com/',
});


// var serverKey = require('./mta-app-34a10-firebase-adminsdk-6hsyr-2da0db5ca0.json') //put the generated private key path here    
// var serverKey = require('./google-services.json') //put the generated private key path here    

//    var fcm = new FCM('AAAAZMGwEig:APA91bH3eloDlv-zavmF9Vo9Bc1yc0r-zuYpdtxgS7nINPFZmo_D0GMet7v6_R_8R96zVZDk5TdkEEty3P2I8r4N68gg-mzQVBQMc8nX-cxdQOK58nahk09y3lyVKPtjpy0a9oEvKif_')
var fcm = new FCM('AAAAFuwBxqE:APA91bFqmso90QWsE9HTWom32c5HpzxaP_EMc0qJ_Q_utGny3QyyN9EltVMIX8cI1htkL89lM66HTI7wFGlYVH3XyCoAH0RPBfSaxB-BwmXu3gCYE7LWVcaodVSlTr95FCn3sOoeiXU8')
function SendPush(payload, token, document, comment_id, commentId) {
    //console.log("notification payload----------->",payload,token,document);
    if (!token) {
        console.log('SendPush skipped: no device token for user');
        return;
    }
    var message;
    if (payload.img_url) {
        console.log("notification if condition")
        message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            token: token,

            notification: {
                title: payload.title,
                body: payload.description,
                image: "https://demo.emeetify.com:81/" + payload.img_url
            },
            data: {
                data: JSON.stringify({
                    // data: {  //you can send only notification or only data(or include both)
                    title: payload.title,
                    body: payload.description,
                    image: "https://demo.emeetify.com:81/" + payload.img_url
                    // }
                })
            }
        }
    }
    else if (payload.title == "Have you Logout ?") {
        console.log("notification else if condition")
        message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            token: token,

            notification: {
                title: payload.title,
                body: payload.description,
                image: "https://demo.emeetify.com:81/" + payload.img_url
            },

            // data: {  //you can send only notification or only data(or include both)
            data: {
                data: JSON.stringify({
                    title: payload.title,
                    body: payload.description,
                    image: "https://demo.emeetify.com:81/" + payload.img_url
                    // }
                })
            }

        }
    }
    else {
        if (payload.status == "comment_notfication") {
            if (document.file !== undefined) {
                message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                    token: token,

                    notification: {
                        title: payload.title,
                        body: payload.description
                    },
                    // data: {
                    // data: { data: JSON.stringify({
                    //     'file': document.file,
                    //     'category_id': document.category_id,
                    //     'updated_at': document.updated_at,
                    //     'project_id': document.project_id,
                    //     'user_id': document.user_id,
                    //     'file_name': document.file_name,
                    //     'created_at': document.created_at,
                    //     'description': document.description,
                    //     'document_id': document.document_id,
                    //     'noti_id': comment_id,
                    //     'parent_comment_id': commentId
                    // })}

                    data: {
                        data: JSON.stringify({
                            'file': document.file !== null && typeof document.file !== 'string' ? String(document.file) : document.file,
                            'category_id': document.category_id !== null && typeof document.category_id !== 'string' ? String(document.category_id) : document.category_id,
                            'updated_at': document.updated_at,
                            'project_id': document.project_id !== null && typeof document.project_id !== 'string' ? String(document.project_id) : document.project_id,
                            'user_id': document.user_id !== null && typeof document.user_id !== 'string' ? String(document.user_id) : document.user_id,
                            'file_name': document.file_name,
                            'created_at': document.created_at,
                            'description': document.description,
                            'document_id': document.document_id !== null && typeof document.document_id !== 'string' ? String(document.document_id) : document.document_id,
                            'noti_id': comment_id !== null && typeof comment_id !== 'string' ? String(comment_id) : comment_id,
                            'parent_comment_id': commentId !== null && typeof commentId !== 'string' ? String(commentId) : commentId
                        })
                    }
                    // }


                    // {  //you can send only notification or only data(or include both)
                    //     // title: payload.title, 
                    //     // body: payload.description,
                    //     document: document
                    // }
                }
            } else {
                message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                    token: token,

                    notification: {
                        title: payload.title,
                        body: payload.description
                    },
                    // data: {
                    // data: { data: JSON.stringify({
                    //     'noti_id': comment_id,
                    //     'parent_comment_id': commentId,
                    //     'user_id': document.user_id,
                    //     'project_id': document.project_id,
                    //     'project_name': document.project_name,
                    //     'parent_comment_id': document.parent_comment_id,
                    //     'project_comments': document.project_comments,
                    // })}
                    data: {
                        data: JSON.stringify({
                            'noti_id': comment_id !== null && typeof comment_id !== 'string' ? String(comment_id) : comment_id,
                            'parent_comment_id': commentId !== null && typeof commentId !== 'string' ? String(commentId) : commentId,
                            'user_id': document.user_id !== null && typeof document.user_id !== 'string' ? String(document.user_id) : document.user_id,
                            'project_id': document.project_id !== null && typeof document.project_id !== 'string' ? String(document.project_id) : document.project_id,
                            'project_name': document.project_name,
                            'parent_comment_id': document.parent_comment_id !== null && typeof document.parent_comment_id !== 'string' ? String(document.parent_comment_id) : document.parent_comment_id,
                            'project_comments': document.project_comments,
                        })
                    }
                    // }
                }
            }

        }
        else {
            message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                token: token,

                notification: {
                    title: payload.title,
                    body: payload.description,
                    image: "https://demo.emeetify.com:81/" + payload.img_url
                },

                // data: {  //you can send only notification or only data(or include both)
                data: {
                    data: JSON.stringify({
                        title: payload.title,
                        body: payload.description,
                        image: "https://demo.emeetify.com:81/" + payload.img_url
                        // }
                    })
                }
            }
        }
    }
    // fcm.send(message, function (err, response) {

    //     console.log("message--------------------------------->", message)

    //     if (err) {
    //         console.log("ṅSomething has gone wrong!", err)
    //     } else {
    //         console.log("Successfully sent with response: ", response)
    //     }
    //     return [];

    // })

    console.log('Notification message-->', message)
    admin.messaging().send(message)
        .then((response) => {
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            if (error.code === 'messaging/registration-token-not-registered') {
                // Remove the invalid token from your database
                console.error('The registration token is not registered. Removing it from the database.');
                // Your logic to remove the token goes here
            } else {
                console.error('Error sending message:', error);
            }
        });

}

async function PushNotification(payload) {

    let { user_id } = payload;
    let role_id = payload.user_type;
    let [device_tokens] = [];

    if (payload.user_id === 0) {
        console.log("??????????????", payload.user_id)
        let [device_tokens] = await database.connection.promise().query(
            QueryGenerator.format(`SELECT device_token FROM users`)
        )

        device_tokens.map((i) => {
            //console.log("device id ---------------------->",i.device_token)

            let device_tokens = i.device_token
            if (device_tokens != null && device_tokens != '') {
                for (var i = 0; i < device_tokens.length; i++) {
                    console.log("12,12,12")
                    SendPush(payload, device_tokens[i].device_token);
                }
            }
        })

    }
    else {

        if (role_id && payload.user_id) {

            [device_tokens] = await database.connection.promise().query(
                QueryGenerator.format(`SELECT device_token
                FROM users WHERE user_id in (${user_id}) AND role_id = ${role_id}`, {
                    user_id, role_id
                })
            )
        } else if (role_id) {
            [device_tokens] = await database.connection.promise().query(
                QueryGenerator.format(`SELECT device_token
                FROM users WHERE role_id = ${role_id}`, {
                    role_id
                })
            )
        } else {
            [device_tokens] = await database.connection.promise().query(
                QueryGenerator.format(`SELECT device_token
                FROM users WHERE user_id in (${user_id})`, {
                    user_id
                })
            )
        }

        if (device_tokens) {
            for (var i = 0; i < device_tokens.length; i++) {
                console.log("11,11,11")
                SendPush(payload, device_tokens[i].device_token);
            }

        }
    }
}

async function CommentsNotification(data, commentId, user_id) {
    var Get_User_id = user_id
    if (data.document_id !== undefined && data.document_id !== "undefined") {
        var [document] = await ProjectModel.getProjectDocumentbyId(data.document_id)
    }
    var [GetProjects] = await ProjectModel.getProject(data.project_id)
    let [allAdmin] = await UserModel.GetAllAdmin();
    let [commentDetails] = await UserModel.getCommentsId(commentId);
    //console.log('Get All Admins------------------>',commentDetails[0].parent_comment_id)
    console.log('NotificationData--->', data)
    let [CommentedUser] = await UserModel.GetUsers(user_id);

    if (document !== undefined) {
        if (data.comment == undefined) {

            var payload = {
                title: CommentedUser[0].name + " Has Commented on Project" + " " + document[0].file_name + " " + "in" + " " + GetProjects[0].project_name,
                description: "",
                status: "comment_notfication"
            }


            var payloadreply = {
                title: CommentedUser[0].name + " Has Replied on Project" + " " + document[0].file_name + " " + "in" + " " + GetProjects[0].project_name,
                description: "",
                status: "comment_notfication"
            }
        }
        else {
            var payload = {
                title: CommentedUser[0].name + " Has Commented on " + " " + document[0].file_name + " " + "in" + " " + GetProjects[0].project_name,
                description: data.comment,
                status: "comment_notfication"
            }


            var payloadreply = {
                title: CommentedUser[0].name + " Has Replied on Project" + " " + document[0].file_name + " " + "in" + " " + GetProjects[0].project_name,
                description: data.comment,
                status: "comment_notfication"
            }

        }
        console.log('data.recipient_id-->before', data.recipient_id)
        data.recipient_id = data.recipient_id.slice(1, -1)
        console.log('data.recipient_id-->', data.recipient_id)
        console.log('data.recipient_id lengh-->', data.recipient_id.length)

        if (data.recipient_id.length != 0) {

            console.log('data.recipient_id-->', data.recipient_id)

            let [getUserDeviceId] = await UserModel.GetUsers(data.recipient_id)

            var device_tokens = []
            for (i = 0; i <= allAdmin.length; i++) {
                device_tokens.push(allAdmin[i]);
            }

            for (j = 0; j <= getUserDeviceId.length; j++) {
                device_tokens.push(getUserDeviceId[j]);
            }
            device_tokens.map(async (iii) => {
                console.log('iii--value--->', iii)
                if (iii != undefined && iii.user_id != Get_User_id) {
                    let getDoc = []
                    getDoc = {
                        file: document[0].file,
                        category_id: document[0].category_id,
                        updated_at: document[0].updated_at,
                        project_id: document[0].project_id,
                        user_id: document[0].user_id,
                        file_name: document[0].file_name,
                        created_at: document[0].created_at,
                        description: document[0].description,
                        document_id: document[0].document_id,
                        parent_comment_id: data.parent_comment_id
                    }

                    let docDetails = [{
                        file: document[0].file,
                        category_id: document[0].category_id,
                        updated_at: document[0].updated_at,
                        project_id: document[0].project_id,
                        user_id: document[0].user_id,
                        file_name: document[0].file_name,
                        created_at: document[0].created_at,
                        description: document[0].description,
                        document_id: document[0].document_id,
                    }]
                    // let dev_id = iii.device_token;
                    if (iii != undefined) {
                        if (data.parent_comment_id) {

                            var insData = {
                                'title': payloadreply.title,
                                'description': payloadreply.description,
                                'user_id': iii.user_id,
                                'doc_detail': JSON.stringify(getDoc),
                                'project_id': document[0].project_id
                            }
                            let [insertNotication] = await UtilsModel.createNoti(insData);
                            console.log("10,10,10")
                            SendPush(payloadreply, iii.device_token, getDoc, insertNotication.insertId, commentDetails[0].parent_comment_id)
                        }
                        else {
                            var insData = {
                                'title': payload.title,
                                'description': payload.description,
                                'user_id': iii.user_id,
                                'doc_detail': JSON.stringify(getDoc),
                                'project_id': document[0].project_id,
                                'document_id': document[0].document_id
                            }
                            let [insertNotication] = await UtilsModel.createNoti(insData);
                            console.log("999")
                            SendPush(payload, iii.device_token, getDoc, insertNotication.insertId, commentDetails[0].parent_comment_id)
                        }
                    }
                    console.log("888")
                    // SendPush(payload,iii.device_token,getDoc)
                }
            })


        }
        else {

            let device_tokens = []
            return allAdmin.map(async (item) => {
                if (item.user_id != Get_User_id) {
                    device_tokens.push(item.device_token);
                    if (document !== undefined) {
                        let getDoc = [];
                        getDoc = {
                            file: document[0].file,
                            category_id: document[0].category_id,
                            updated_at: document[0].updated_at,
                            project_id: document[0].project_id,
                            user_id: item.user_id,
                            file_name: document[0].file_name,
                            created_at: document[0].created_at,
                            description: document[0].description,
                            document_id: document[0].document_id,
                            parent_comment_id: data.parent_comment_id
                        }
                        let docDetails = [{
                            file: document[0].file,
                            category_id: document[0].category_id,
                            updated_at: document[0].updated_at,
                            project_id: document[0].project_id,
                            user_id: document[0].user_id,
                            file_name: document[0].file_name,
                            created_at: document[0].created_at,
                            description: document[0].description,
                            document_id: document[0].document_id,
                        }]
                        if (data.parent_comment_id) {
                            var insData = {
                                'title': payloadreply.title,
                                'description': payloadreply.description,
                                'user_id': item.user_id,
                                'doc_detail': JSON.stringify(getDoc),
                                'project_id': document[0].project_id,
                                'document_id': document[0].document_id
                            }
                            let [insertNotication] = await UtilsModel.createNoti(insData);
                            console.log("777")
                            SendPush(payloadreply, item.device_token, getDoc, insertNotication.insertId, commentDetails[0].parent_comment_id)
                        }
                        else {
                            var insData = {
                                'title': payload.title,
                                'description': payload.description,
                                'user_id': item.user_id,
                                'doc_detail': JSON.stringify(getDoc),
                                'project_id': document[0].project_id,
                                'document_id': document[0].document_id
                            }

                            let [insertNotication] = await UtilsModel.createNoti(insData);
                            console.log("666")
                            SendPush(payload, item.device_token, getDoc, insertNotication.insertId, commentDetails[0].parent_comment_id)
                        }
                    }
                }
            })
        }
    } else if (GetProjects !== undefined) {

        if (data.comment == undefined) {

            var payload = {
                title: CommentedUser[0].name + " Has Commented on Project" + "in" + " " + GetProjects[0].project_name,
                description: "",
                status: "comment_notfication"
            }


            var payloadreply = {
                title: CommentedUser[0].name + " Has Replied on Project" + "in" + " " + GetProjects[0].project_name,
                description: "",
                status: "comment_notfication"
            }
        }
        else {
            var payload = {
                title: CommentedUser[0].name + " Has Commented on " + "in" + " " + GetProjects[0].project_name,
                description: data.comment,
                status: "comment_notfication"
            }


            var payloadreply = {
                title: CommentedUser[0].name + " Has Replied on Project" + "in" + " " + GetProjects[0].project_name,
                description: data.comment,
                status: "comment_notfication"
            }

        }
        data.recipient_id = data.recipient_id.slice(1, -1)

        if (data.recipient_id.length != 0) {


            let [getUserDeviceId] = await UserModel.GetUsers(data.recipient_id)


            var device_tokens = []
            for (i = 0; i <= allAdmin.length; i++) {
                device_tokens.push(allAdmin[i]);
            }

            for (j = 0; j <= getUserDeviceId.length; j++) {
                device_tokens.push(getUserDeviceId[j]);
            }
            device_tokens.map(async (iii) => {
                if (iii != undefined) {
                    if (iii.user_id != Get_User_id) {

                        if (data.parent_comment_id) {
                            let getData = []
                            getData = {
                                'user_id': iii.user_id,
                                'project_id': GetProjects[0].project_id,
                                'project_name': GetProjects[0].project_name,
                                'parent_comment_id': commentDetails[0].parent_comment_id,
                                'project_comments': "true",
                                'category_list': data.category_list,
                                'category_id_list': data.category_id_list
                            }
                            var insData = {
                                'title': payloadreply.title,
                                'description': payloadreply.description,
                                'user_id': iii.user_id,
                                'doc_detail': JSON.stringify(getData),
                                'project_id': GetProjects[0].project_id
                            }
                            let [insertNotication] = await UtilsModel.createNoti(insData);
                            console.log("555")
                            SendPush(payloadreply, iii.device_token, getData, insertNotication.insertId, commentDetails[0].parent_comment_id)
                        }
                        else {
                            let getData = []
                            getData = {
                                'user_id': iii.user_id,
                                'project_id': GetProjects[0].project_id,
                                'project_name': GetProjects[0].project_name,
                                'parent_comment_id': commentDetails[0].parent_comment_id,
                                'project_comments': "true",
                                'category_list': data.category_list,
                                'category_id_list': data.category_id_list
                            }

                            var insData = {
                                'title': payload.title,
                                'description': payload.description,
                                'user_id': iii.user_id,
                                'doc_detail': JSON.stringify(getData),
                                'project_id': GetProjects[0].project_id
                            }
                            let [insertNotication] = await UtilsModel.createNoti(insData);

                            console.log("444")
                            SendPush(payload, iii.device_token, getData, insertNotication.insertId, commentDetails[0].parent_comment_id)
                        }
                    }
                }
            })


        }
        else {

            let device_tokens = []
            return allAdmin.map(async (item) => {
                if (item.user_id != Get_User_id) {
                    let getData = []
                    getData = {
                        'user_id': item.user_id,
                        'project_id': GetProjects[0].project_id,
                        'project_name': GetProjects[0].project_name,
                        'parent_comment_id': commentDetails[0].parent_comment_id,
                        'project_comments': "true",
                    }
                    device_tokens.push(item.device_token);
                    if (data.parent_comment_id) {
                        var insData = {
                            'title': payloadreply.title,
                            'description': payloadreply.description,
                            'user_id': item.user_id,
                            'doc_detail': JSON.stringify(getData),
                            'project_id': GetProjects[0].project_id
                        }
                        let [insertNotication] = await UtilsModel.createNoti(insData);
                        console.log("222")
                        SendPush(payloadreply, item.device_token, getData, insertNotication.insertId, commentDetails[0].parent_comment_id)
                    }
                    else {
                        var insData = {
                            'title': payload.title,
                            'description': payload.description,
                            'user_id': item.user_id,
                            'doc_detail': JSON.stringify(getData),
                            'project_id': GetProjects[0].project_id
                        }

                        let [insertNotication] = await UtilsModel.createNoti(insData);
                        console.log("111")
                        SendPush(payload, item.device_token, getData, insertNotication.insertId, commentDetails[0].parent_comment_id)
                    }
                    // }
                }
            })
        }










    }
    return true;
}

async function fcmMessage(message) {
    for (let index = 0; index < message.length; index++) {
        // await fcm.send(message[index], function (err, response) {

        //     if (err) {
        //         console.log("Something has gone wrong!", err)
        //         if (message.length == index) {
        //             return {
        //                 status: 400,
        //                 message: 'Error while sending push notifications',
        //                 data: err
        //             }
        //         }
        //     } else {
        //         console.log("Successfully sent with response: ", response);
        //         if (message.length == index) {
        //             return {
        //                 status: 200,
        //                 message: "Push notification send successfully",
        //                 data: response
        //             }
        //         }
        //     }
        // })

        console.log('Notification message-->', message[index])
        await admin.messaging().send(message[index])
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                if (error.code === 'messaging/registration-token-not-registered') {
                    // Remove the invalid token from your database
                    console.error('The registration token is not registered. Removing it from the database.');
                    // Your logic to remove the token goes here
                } else {
                    console.error('Error sending message:', error);
                }
            });
    }
}

async function DocumentsNotification(data) {
    let [GetProjects] = await ProjectModel.getProject(data.project_id)
    let [document] = await ProjectModel.getProjectDocumentbyId(data.document)
    let [users] = await UserModel.GetUsers(data.user_id);
    let [uploadUser] = await UserModel.GetUsers(document[0].user_id)
    let [allAdmin] = await UserModel.GetAllAdmin();
    let category = "";

    if (document[0].category_id) {
        category = await ProjectModel.getCategoryByCatId(document[0].category_id)
    }

    let notification_Users = []
    let des_message = "";
    let message = [];

    // allAdmin.map((i)=>{
    //     if(i.device_token !== null){
    //         notification_Users.push(i)
    //     }
    // })

    users.map((j) => {
        if (j.device_token !== null && j.device_token != '') {
            notification_Users.push(j)
        }
    })
    console.log('users list --->', notification_Users);
    if (document[0].category_id === null) {
        des_message = `${uploadUser[0].name} has uploaded document on project ${GetProjects[0].project_name}`
    } else {
        des_message = `${uploadUser[0].name} has uploaded document on project ${GetProjects[0].project_name} in ${category[0][0].category_name} `
    }
    if (document[0].category_id) {
        notification_Users.map(async (userData, idx) => {

            if (userData.device_token !== null && userData.device_token != '') {

                // Adding Notification for Document Upload
                let getDoc = [];
                getDoc = {  //you can send only notification or only data(or include both)
                    file: document[0].file,
                    project_name: GetProjects[0].project_name,
                    category_name: category[0][0].category_name,
                    category_id: document[0].category_id,
                    updated_at: document[0].updated_at,
                    project_id: document[0].project_id,
                    user_id: document[0].user_id,
                    file_name: document[0].file_name,
                    created_at: document[0].created_at,
                    description: document[0].description,
                    document_id: document[0].document_id,
                }
                let notificationCheckData = {
                    'user_id': userData.user_id,
                    'document_id': document[0].document_id
                }
                let [checkNotification] = await UtilsModel.checkNotificationData(notificationCheckData);
                console.log('checkNotification.length-->', checkNotification);
                console.log('user_id-->', data.user_id);
                if (checkNotification.length == 0) {
                    // console.log("checkNotification Details-->",checkNotification)
                    let insData = {
                        'title': "Documents Uploaded",
                        'description': des_message,
                        'user_id': userData.user_id,
                        'doc_detail': JSON.stringify(getDoc),
                        'project_id': document[0].project_id,
                        'document_id': document[0].document_id
                    }
                    let [insertNotication] = await UtilsModel.createNoti(insData);
                    if (insertNotication.affectedRows > 0) {
                        message.push({ //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                            token: userData.device_token,

                            notification: {
                                title: "Documents Uploaded",
                                body: des_message,
                            },

                            // data: {  //you can send only notification or only data(or include both)
                            // data: { data: JSON.stringify({
                            //     file: document[0].file,
                            //     project_name: GetProjects[0].project_name,
                            //     category_name: category[0][0].category_name,
                            //     category_id: document[0].category_id,
                            //     updated_at: document[0].updated_at,
                            //     project_id: document[0].project_id,
                            //     user_id: document[0].user_id,
                            //     file_name: document[0].file_name,
                            //     created_at: document[0].created_at,
                            //     description: document[0].description,
                            //     document_id: document[0].document_id,
                            //     notiId: insertNotication.insertId
                            // })}

                            data: {
                                data: JSON.stringify({
                                    file: document[0].file !== null && typeof document[0].file !== 'string' ? String(document[0].file) : document[0].file,
                                    project_name: GetProjects[0].project_name,
                                    category_name: category[0][0].category_name,
                                    category_id: document[0].category_id !== null && typeof document[0].category_id !== 'string' ? String(document[0].category_id) : document[0].category_id,
                                    updated_at: document[0].updated_at,
                                    project_id: document[0].project_id !== null && typeof document[0].project_id !== 'string' ? String(document[0].project_id) : document[0].project_id,
                                    user_id: document[0].user_id !== null && typeof document[0].user_id !== 'string' ? String(document[0].user_id) : document[0].user_id,
                                    file_name: document[0].file_name,
                                    created_at: document[0].created_at,
                                    description: document[0].description,
                                    document_id: document[0].document_id !== null && typeof document[0].document_id !== 'string' ? String(document[0].document_id) : document[0].document_id,
                                    notiId: insertNotication.insertId !== null && typeof insertNotication.insertId !== 'string' ? String(insertNotication.insertId) : insertNotication.insertId
                                })
                            }
                            // }
                        });
                        if (message.length > 0 && idx === 0) {
                            fcmMessage(message)
                            message = []
                        }
                    }
                }
            }
        })
        // if(message.length > 0){
        //     fcmMessage(message);
        // }
    } else {
        // console.log("all users",users)

        notification_Users.map(async (userData) => {
            if (userData.device_token !== null && userData.device_token != '') {

                // Adding Notification for Document Upload

                let getDoc = {  //you can send only notification or only data(or include both)
                    file: document[0].file,
                    project_name: GetProjects[0].project_name,
                    category_id: null,
                    category_name: null,
                    updated_at: document[0].updated_at,
                    project_id: document[0].project_id,
                    user_id: document[0].user_id,
                    file_name: document[0].file_name,
                    created_at: document[0].created_at,
                    description: document[0].description,
                    document_id: document[0].document_id,
                }

                let insData = {
                    'title': "Documents Uploaded",
                    'description': des_message,
                    'user_id': userData.user_id,
                    'doc_detail': JSON.stringify(getDoc),
                    'project_id': document[0].project_id,
                    'document_id': document[0].document_id
                }
                let [insertNotication] = await UtilsModel.createNoti(insData);

                if (insertNotication.affectedRows > 0) {
                    // console.log("NOTI USERS",userData)
                    message.push({ //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                        token: userData.device_token,

                        notification: {
                            title: "Documents Uploaded",
                            body: des_message,
                        },

                        // data: {  //you can send only notification or only data(or include both)
                        // data: { data: JSON.stringify({
                        //     file: document[0].file,
                        //     project_name: GetProjects[0].project_name,
                        //     category_id: "null",
                        //     category_name: "null",
                        //     updated_at: document[0].updated_at,
                        //     project_id: document[0].project_id,
                        //     user_id: document[0].user_id,
                        //     file_name: document[0].file_name,
                        //     created_at: document[0].created_at,
                        //     description: document[0].description,
                        //     document_id: document[0].document_id,
                        //     notiId: insertNotication.insertId
                        // })}
                        // }

                        data: {
                            data: JSON.stringify({
                                file: document[0].file,
                                project_name: GetProjects[0].project_name,
                                category_id: "null",
                                category_name: "null",
                                updated_at: document[0].updated_at,
                                project_id: document[0].project_id !== null && typeof document[0].project_id !== 'string' ? String(document[0].project_id) : document[0].project_id,
                                user_id: document[0].user_id !== null && typeof document[0].user_id !== 'string' ? String(document[0].user_id) : document[0].user_id,
                                file_name: document[0].file_name,
                                created_at: document[0].created_at,
                                description: document[0].description,
                                document_id: document[0].document_id !== null && typeof document[0].document_id !== 'string' ? String(document[0].document_id) : document[0].document_id,
                                notiId: insertNotication.insertId !== null && typeof insertNotication.insertId !== 'string' ? String(insertNotication.insertId) : insertNotication.insertId
                            })
                        }
                    });
                    fcmMessage(message)
                    message = []
                }
            }
        })
    }
}

async function DocumentsNotificationForAdmin(data,created_by) {
    let [GetProjects] = await ProjectModel.getProject(data.project_id)
    let [document] = await ProjectModel.getProjectDocumentbyId(data.document)
    let [users] = await UserModel.GetUsers(data.user_id);
    let [uploadUser] = await UserModel.GetUsers(document[0].user_id)
    let [allAdmin] = await UserModel.GetAllAdmin(created_by);
    let category = "";
    console.log('allAdminData--->',allAdmin)
    if (document[0].category_id) {
        category = await ProjectModel.getCategoryByCatId(document[0].category_id)
    }

    let notification_Users = []
    let des_message = "";
    let message = [];

    allAdmin.map((i) => {
        if (i.device_token !== null && i.device_token != '') {
            notification_Users.push(i)
        }
    })

    // users.map((j)=>{
    //     if(j.device_token !== null){
    //         notification_Users.push(j)
    //     }
    // })
    if (document[0].category_id === null) {
        des_message = `${uploadUser[0].name} has uploaded document on project ${GetProjects[0].project_name}`
    } else {
        des_message = `${uploadUser[0].name} has uploaded document on project ${GetProjects[0].project_name} in ${category[0][0].category_name} `
    }
    if (document[0].category_id) {
        notification_Users.map(async (userData, idx) => {

            if (userData.device_token !== null && userData.device_token != '') {

                // Adding Notification for Document Upload
                let getDoc = [];
                getDoc = {  //you can send only notification or only data(or include both)
                    file: document[0].file,
                    project_name: GetProjects[0].project_name,
                    category_name: category[0][0].category_name,
                    category_id: document[0].category_id,
                    updated_at: document[0].updated_at,
                    project_id: document[0].project_id,
                    user_id: document[0].user_id,
                    file_name: document[0].file_name,
                    created_at: document[0].created_at,
                    description: document[0].description,
                    document_id: document[0].document_id,
                }
                let notificationCheckData = {
                    'user_id': userData.user_id,
                    'document_id': document[0].document_id
                }
                let [checkNotification] = await UtilsModel.checkNotificationData(notificationCheckData);
                console.log('checkNotification.length-->', checkNotification);
                console.log('user_id-->', data.user_id);
                if (checkNotification.length == 0) {
                    // console.log("checkNotification Details-->",checkNotification)
                    let insData = {
                        'title': "Documents Uploaded",
                        'description': des_message,
                        'user_id': userData.user_id,
                        'doc_detail': JSON.stringify(getDoc),
                        'project_id': document[0].project_id,
                        'document_id': document[0].document_id
                    }
                    let [insertNotication] = await UtilsModel.createNoti(insData);
                    if (insertNotication.affectedRows > 0) {
                        message.push({ //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                            token: userData.device_token,

                            notification: {
                                title: "Documents Uploaded",
                                body: des_message,
                            },

                            // data: {  //you can send only notification or only data(or include both)
                            // data: { data: JSON.stringify({
                            //     file: document[0].file,
                            //     project_name: GetProjects[0].project_name,
                            //     category_name: category[0][0].category_name,
                            //     category_id: document[0].category_id,
                            //     updated_at: document[0].updated_at,
                            //     project_id: document[0].project_id,
                            //     user_id: document[0].user_id,
                            //     file_name: document[0].file_name,
                            //     created_at: document[0].created_at,
                            //     description: document[0].description,
                            //     document_id: document[0].document_id,
                            //     notiId: insertNotication.insertId
                            // })}
                            // }

                            data: {
                                data: JSON.stringify({
                                    file: document[0].file,
                                    project_name: GetProjects[0].project_name,
                                    category_name: category[0][0].category_name,
                                    category_id: document[0].category_id !== null && typeof document[0].category_id !== 'string' ? String(document[0].category_id) : document[0].category_id,
                                    updated_at: document[0].updated_at,
                                    project_id: document[0].project_id !== null && typeof document[0].project_id !== 'string' ? String(document[0].project_id) : document[0].project_id,
                                    user_id: document[0].user_id !== null && typeof document[0].user_id !== 'string' ? String(document[0].user_id) : document[0].user_id,
                                    file_name: document[0].file_name,
                                    created_at: document[0].created_at,
                                    description: document[0].description,
                                    document_id: document[0].document_id !== null && typeof document[0].document_id !== 'string' ? String(document[0].document_id) : document[0].document_id,
                                    notiId: insertNotication.insertId !== null && typeof insertNotication.insertId !== 'string' ? String(insertNotication.insertId) : insertNotication.insertId
                                })
                            }
                        });
                        // if(message.length > 0 && idx === 1){
                        fcmMessage(message)
                        message = []
                        // }
                    }
                }
            }
        })
        // if(message.length > 0){
        //     fcmMessage(message);
        // }
    } else {
        // console.log("all users",users)

        notification_Users.map(async (userData) => {
            if (userData.device_token !== null && userData.device_token != '') {

                // Adding Notification for Document Upload

                let getDoc = {  //you can send only notification or only data(or include both)
                    file: document[0].file,
                    project_name: GetProjects[0].project_name,
                    category_id: null,
                    category_name: null,
                    updated_at: document[0].updated_at,
                    project_id: document[0].project_id,
                    user_id: document[0].user_id,
                    file_name: document[0].file_name,
                    created_at: document[0].created_at,
                    description: document[0].description,
                    document_id: document[0].document_id,
                }

                let insData = {
                    'title': "Documents Uploaded",
                    'description': des_message,
                    'user_id': userData.user_id,
                    'doc_detail': JSON.stringify(getDoc),
                    'project_id': document[0].project_id,
                    'document_id': document[0].document_id
                }
                let [insertNotication] = await UtilsModel.createNoti(insData);

                if (insertNotication.affectedRows > 0) {
                    // console.log("NOTI USERS",userData)
                    message.push({ //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                        token: userData.device_token,

                        notification: {
                            title: "Documents Uploaded",
                            body: des_message,
                        },

                        // data: {  //you can send only notification or only data(or include both)
                        // data: { data: JSON.stringify({
                        //     file: document[0].file,
                        //     project_name: GetProjects[0].project_name,
                        //     category_id: "null",
                        //     category_name: "null",
                        //     updated_at: document[0].updated_at,
                        //     project_id: document[0].project_id,
                        //     user_id: document[0].user_id,
                        //     file_name: document[0].file_name,
                        //     created_at: document[0].created_at,
                        //     description: document[0].description,
                        //     document_id: document[0].document_id,
                        //     notiId: insertNotication.insertId
                        // })}
                        // }

                        data: {
                            data: JSON.stringify({
                                file: document[0].file,
                                project_name: GetProjects[0].project_name,
                                category_id: "null",
                                category_name: "null",
                                updated_at: document[0].updated_at,
                                project_id: document[0].project_id !== null && typeof document[0].project_id !== 'string' ? String(document[0].project_id) : document[0].project_id,
                                user_id: document[0].user_id !== null && typeof document[0].user_id !== 'string' ? String(document[0].user_id) : document[0].user_id,
                                file_name: document[0].file_name,
                                created_at: document[0].created_at,
                                description: document[0].description,
                                document_id: document[0].document_id !== null && typeof document[0].document_id !== 'string' ? String(document[0].document_id) : document[0].document_id,
                                notiId: insertNotication.insertId !== null && typeof insertNotication.insertId !== 'string' ? String(insertNotication.insertId) : insertNotication.insertId
                            })
                        }
                    });
                    fcmMessage(message)
                    message = []
                }
            }
        })
    }

}

async function DocumentsNotificationForGFCAccessUser(data, created_by = 'A') {
    let [GetProjects] = await ProjectModel.getProject(data.project_id)
    let [document] = await ProjectModel.getProjectDocumentbyId(data.document)
    let [users] = await UserModel.GetUsers(data.user_id);
    let [uploadUser] = await UserModel.GetUsers(document[0].user_id)
    let [specialFileAccessUsers] = await UserModel.specialFileAccessUsers(document[0].category_id);
    let category = "";

    if (document[0].category_id) {
        category = await ProjectModel.getCategoryByCatId(document[0].category_id)
    }

    let notification_Users = []
    let des_message = "";
    let message = [];

    specialFileAccessUsers.map((i) => {
        if (i.device_token !== null && i.device_token !== '') {
            notification_Users.push(i)
        }
    })

    // users.map((j)=>{
    //     if(j.device_token !== null){
    //         notification_Users.push(j)
    //     }
    // })
    if (document[0].category_id === null) {
        des_message = `${uploadUser[0].name} has uploaded document on project ${GetProjects[0].project_name}`
    } else {
        des_message = `${uploadUser[0].name} has uploaded document on project ${GetProjects[0].project_name} in ${category[0][0].category_name} `
    }
    if (document[0].category_id) {
        notification_Users.map(async (userData, idx) => {

            if (userData.device_token !== null && userData.device_token != '') {

                // Adding Notification for Document Upload
                let getDoc = [];
                getDoc = {  //you can send only notification or only data(or include both)
                    file: document[0].file,
                    project_name: GetProjects[0].project_name,
                    category_name: category[0][0].category_name,
                    category_id: document[0].category_id,
                    updated_at: document[0].updated_at,
                    project_id: document[0].project_id,
                    user_id: document[0].user_id,
                    file_name: document[0].file_name,
                    created_at: document[0].created_at,
                    description: document[0].description,
                    document_id: document[0].document_id,
                }
                let notificationCheckData = {
                    'user_id': userData.user_id,
                    'document_id': document[0].document_id
                }
                let [checkNotification] = await UtilsModel.checkNotificationData(notificationCheckData);
                console.log('checkNotification.length-->', checkNotification);
                console.log('user_id-->', data.user_id);
                if (checkNotification.length == 0) {
                    // console.log("checkNotification Details-->",checkNotification)
                    let insData = {
                        'title': "Documents Uploaded",
                        'description': des_message,
                        'user_id': userData.user_id,
                        'doc_detail': JSON.stringify(getDoc),
                        'project_id': document[0].project_id,
                        'document_id': document[0].document_id
                    }
                    let [insertNotication] = await UtilsModel.createNoti(insData);
                    if (insertNotication.affectedRows > 0) {
                        message.push({ //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                            token: userData.device_token,

                            notification: {
                                title: "Documents Uploaded",
                                body: des_message,
                            },

                            // data: {  //you can send only notification or only data(or include both)
                            // data: { data: JSON.stringify({
                            //     file: document[0].file,
                            //     project_name: GetProjects[0].project_name,
                            //     category_name: category[0][0].category_name,
                            //     category_id: document[0].category_id,
                            //     updated_at: document[0].updated_at,
                            //     project_id: document[0].project_id,
                            //     user_id: document[0].user_id,
                            //     file_name: document[0].file_name,
                            //     created_at: document[0].created_at,
                            //     description: document[0].description,
                            //     document_id: document[0].document_id,
                            //     notiId: insertNotication.insertId
                            // // }
                            // })}
                            data: {
                                data: JSON.stringify({
                                    file: document[0].file,
                                    project_name: GetProjects[0].project_name,
                                    category_name: category[0][0].category_name,
                                    category_id: document[0].category_id !== null && typeof document[0].category_id !== 'string' ? String(document[0].category_id) : document[0].category_id,
                                    updated_at: document[0].updated_at,
                                    project_id: document[0].project_id !== null && typeof document[0].project_id !== 'string' ? String(document[0].project_id) : document[0].project_id,
                                    user_id: document[0].user_id !== null && typeof document[0].user_id !== 'string' ? String(document[0].user_id) : document[0].user_id,
                                    file_name: document[0].file_name,
                                    created_at: document[0].created_at,
                                    description: document[0].description,
                                    document_id: document[0].document_id !== null && typeof document[0].document_id !== 'string' ? String(document[0].document_id) : document[0].document_id,
                                    notiId: insertNotication.insertId !== null && typeof insertNotication.insertId !== 'string' ? String(insertNotication.insertId) : insertNotication.insertId
                                    // }
                                })
                            }
                        });
                        // if(message.length > 0 && idx === 1){
                        fcmMessage(message)
                        message = []
                        // }
                    }
                }
            }
        })
        // if(message.length > 0){
        //     fcmMessage(message);
        // }
    } else {
        // console.log("all users",users)

        notification_Users.map(async (userData) => {
            if (userData.device_token !== null && userData.device_token != '') {

                // Adding Notification for Document Upload

                let getDoc = {  //you can send only notification or only data(or include both)
                    file: document[0].file,
                    project_name: GetProjects[0].project_name,
                    category_id: null,
                    category_name: null,
                    updated_at: document[0].updated_at,
                    project_id: document[0].project_id,
                    user_id: document[0].user_id,
                    file_name: document[0].file_name,
                    created_at: document[0].created_at,
                    description: document[0].description,
                    document_id: document[0].document_id,
                }

                let insData = {
                    'title': "Documents Uploaded",
                    'description': des_message,
                    'user_id': userData.user_id,
                    'doc_detail': JSON.stringify(getDoc),
                    'project_id': document[0].project_id,
                    'document_id': document[0].document_id
                }
                let [insertNotication] = await UtilsModel.createNoti(insData);

                if (insertNotication.affectedRows > 0) {
                    // console.log("NOTI USERS",userData)
                    message.push({ //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                        token: userData.device_token,

                        notification: {
                            title: "Documents Uploaded",
                            body: des_message,
                        },

                        // data: {  //you can send only notification or only data(or include both)
                        // data: { data: JSON.stringify({
                        //     file: document[0].file,
                        //     project_name: GetProjects[0].project_name,
                        //     category_id: "null",
                        //     category_name: "null",
                        //     updated_at: document[0].updated_at,
                        //     project_id: document[0].project_id,
                        //     user_id: document[0].user_id,
                        //     file_name: document[0].file_name,
                        //     created_at: document[0].created_at,
                        //     description: document[0].description,
                        //     document_id: document[0].document_id,
                        //     notiId: insertNotication.insertId
                        // // }
                        // })}
                        data: {
                            data: JSON.stringify({
                                file: document[0].file,
                                project_name: GetProjects[0].project_name,
                                category_id: "null",
                                category_name: "null",
                                updated_at: document[0].updated_at,
                                project_id: document[0].project_id !== null && typeof document[0].project_id !== 'string' ? String(document[0].project_id) : document[0].project_id,
                                user_id: document[0].user_id !== null && typeof document[0].user_id !== 'string' ? String(document[0].user_id) : document[0].user_id,
                                file_name: document[0].file_name,
                                created_at: document[0].created_at,
                                description: document[0].description,
                                document_id: document[0].document_id !== null && typeof document[0].document_id !== 'string' ? String(document[0].document_id) : document[0].document_id,
                                notiId: insertNotication.insertId !== null && typeof insertNotication.insertId !== 'string' ? String(insertNotication.insertId) : insertNotication.insertId
                                // }
                            })
                        }

                    });
                    fcmMessage(message)
                    message = []
                }
            }
        })
    }

}

async function chatNotification(group_id, message_id, created_user_id) {

    const [getUsersByGroupId] = await chatModel.getUsersByGroupId(group_id);
    const [getMessage] = await chatModel.messageByMessageId(message_id);
    const { message, user_name } = getMessage[0];
    if (getUsersByGroupId.length > 0) {
        for (let i = 0; i < getUsersByGroupId.length; i++) {
            const { token, group_name, group_id, user_id, group_type, project_id, team_id } = getUsersByGroupId[i];
            console.log('created_user_id-->', created_user_id)
            console.log('user_id-->', user_id)
            if (token != null && token != '' && user_id != created_user_id) {
                let userMessage;
                if (message == 'file-uploaded') {
                    userMessage = 'file uploaded';
                } else {
                    userMessage = message.replaceAll('##&&%', ' ');
                }

                const messages = {
                    token: token,
                    notification: {
                        title: `You have new message in ${group_name}`,
                        body: `${user_name} : ${userMessage}`
                    },
                    // data: { data: JSON.stringify({
                    //     group_id ,
                    //     group_type,
                    //     project_id ,
                    //     team_id ,
                    //     group_name
                    // })}
                    data: {
                        data: JSON.stringify({
                            group_id: group_id !== null && typeof group_id !== 'string' ? String(group_id) : group_id,
                            group_type: group_type !== null && typeof group_type !== 'string' ? String(group_type) : group_type,
                            project_id: project_id !== null && typeof project_id !== 'string' ? String(project_id) : project_id,
                            team_id: team_id !== null && typeof team_id !== 'string' ? String(team_id) : team_id,
                            group_name: group_name !== null && typeof group_name !== 'string' ? String(group_name) : group_name
                        })
                    }

                }
                console.log('Notification message-->', messages)
                await admin.messaging().send(messages)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        if (error.code === 'messaging/registration-token-not-registered') {
                            // Remove the invalid token from your database
                            console.error('The registration token is not registered. Removing it from the database.');
                            // Your logic to remove the token goes here
                        } else {
                            console.error('Error sending message:', error);
                        }
                    });
                // await fcm.send(messages, function (err, response) {
                //     console.log("message--------------------------------->", messages)
                //     if (err) {
                //         console.log("ṅSomething has gone wrong!", err)
                //     } else {
                //         console.log("Successfully sent with response: ", response)
                //     }
                //     return [];
                // })
            }
        }
    }
}



async function meetingNotification(data) {
    console.log("meeting-Data", data)
    const { meeting_id, title, action, user_ids } = data;

    const [tokens] = await meetingModel.meetingUserDetails(data)
    //const name = tokens[0].name
    if (tokens.length > 0) {
        const result = []
        for (let i = 0; i < tokens.length; i++) {
            console.log(tokens[i].device_token)
            if (tokens[i].device_token != null && tokens[i].device_token != '' && tokens[i].user_id != data.user_ids) {
                let message;
                if (action === 'update') {
                    message = {
                        token: tokens[i].device_token,
                        notification: {
                            title: `Your meeting has been Rescheduled for ${title}`,
                            body: ''
                        },
                        data: {
                            data: JSON.stringify({
                                meeting_id,
                                action
                            })
                        }
                    }
                } else if (action === 'delete') {
                    message = {
                        token: tokens[i].device_token,
                        notification: {
                            title: `Your meeting has been Cancelled for ${title}`,
                            body: ''
                        },
                        data: {
                            data: JSON.stringify({
                                meeting_id,
                                action
                            })
                        }
                    }

                } else {
                    message = {
                        token: tokens[i].device_token,
                        notification: {
                            title: `Your meeting has been scheduled for ${title}`,
                            body: ''
                        },
                        data: {
                            data: JSON.stringify({
                                meeting_id,
                                action
                            })
                        }

                    }
                }
                console.log('Notification message-->', message)
                await admin.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        if (error.code === 'messaging/registration-token-not-registered') {
                            // Remove the invalid token from your database
                            console.error('The registration token is not registered. Removing it from the database.');
                            // Your logic to remove the token goes here
                        } else {
                            console.error('Error sending message:', error);
                        }
                    });
            } else {
                console.log('Device token is empty')
            }
        }
        return result
    }
}








module.exports = { PushNotification, CommentsNotification, DocumentsNotification, DocumentsNotificationForAdmin, DocumentsNotificationForGFCAccessUser, chatNotification, meetingNotification };