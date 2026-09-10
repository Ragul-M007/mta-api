
var jwt = require('jsonwebtoken')
const { database } = require('../config/database')
const UtilsModel = require("../models/utils.model");
const PushNoti = require("../utils/push-notification");
const chatModel = require('../models/chat.model');
const { Socket } = require('socket.io');
const { connect } = require('../routes/chat.routes');
const logger = require('../utils/winston');
const { chatNotification } = require("../utils/push-notification");
const { Chat_message_limit } = require('../utils/chat');
const chatController = require('../controllers/chat.controller')
var io = require('socket.io')(process.env.SOCKET_PORT,
    {
        cors: {
            origin: '*',

        },

    }
)

console.log("socket io connected...............")


io.use(function (socket, next) {
    console.log('SOCKET DATA -->', socket.handshake.query)
    if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.document_id) {
        let user = jwt.decode(socket.handshake.query.token)
        if (socket.handshake.query.document_id) {
            socket.decoded = user;
            if (socket.handshake.query.document_id) {
                socket.document_id = socket.handshake.query.document_id;
            }
            if (socket.handshake.query.project_id) {
                socket.project_id = socket.handshake.query.project_id;
            }
            next();
        }
        else {
            next(new Error('Authentication error'));
        }
    }
    else if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.project_id) {
        let user = jwt.decode(socket.handshake.query.token)
        if (socket.handshake.query.project_id !== undefined &&
            (socket.handshake.query.document_id == undefined ||
                socket.handshake.query.document_id == '')) {
            console.log('project--->', socket.handshake.query)
            socket.decoded = user;
            socket.project_id = socket.handshake.query.project_id;
            next();
        }
        else {
            next(new Error('Authentication error'));
        }
    }
    else if (socket.handshake.query && socket.handshake.query.token &&
        socket.handshake.query.group_type && socket.handshake.query.project_group_id &&
        (socket.handshake.query.team_id != 'null' || socket.handshake.query.team_id != null)) {
        console.log('Project handshake successfully...!')
        let user = jwt.decode(socket.handshake.query.token)
        if (socket.handshake.query.project_group_id) {
            console.log('all group page--->', socket.handshake.query)
            socket.decoded = user;
            socket.project_group_id = socket.handshake.query.project_group_id;
            // console.log('socket-group-->',socket.group_id);
            // console.log('socket-decoded-->',socket.decoded);
            next();
        }
        else {
            next(new Error('Authentication error'));
        }
    } else if (socket.handshake.query && socket.handshake.query.token &&
        socket.handshake.query.group_type && socket.handshake.query.team_id &&
        (socket.handshake.query.project_group_id != 'null' || socket.handshake.query.project_group_id != null)) {
        console.log('Team handshake successfully...!')
        let user = jwt.decode(socket.handshake.query.token)
        if (socket.handshake.query.project_group_id) {
            console.log('all group page--->', socket.handshake.query)
            socket.decoded = user;
            socket.project_group_id = socket.handshake.query.project_group_id;
            // console.log('socket-group-->',socket.group_id);
            // console.log('socket-decoded-->',socket.decoded);
            next();
        }
        else {
            next(new Error('Authentication error'));
        }
    } else if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.group_id) {
        let user = jwt.decode(socket.handshake.query.token)
        if (socket.handshake.query.group_id) {
            console.log('chat connection--->', socket.handshake.query)
            socket.decoded = user;
            console.log('chat User-->', socket.decoded)
            socket.group_id = socket.handshake.query.group_id;
            // console.log('socket-group-->',socket.group_id);
            // console.log('socket-decoded-->',socket.decoded);
            next();
        }
        else {
            next(new Error('Authentication error'));
        }
    }
    else {
        next(new Error('Authentication error'));
    }
})


// Keep track of active rooms
const activeRooms = {};

// Function to check if a room exists
const roomExists = (room) => {
    return activeRooms.hasOwnProperty(room);
};

io.on('connect', function (socket) {
    // get Document Comments
    var getDocumentComments = async function (user_id, document_id) {
        if (document_id !== undefined && document_id !== "undefined") {
            let [document] = await UtilsModel.findComments({
                user_id, document_id
            })
            console.log('document Comment-->', document)
            io.emit('document-comments', document);
        }

    }

    // show all the document comment by document_id in the comment module

    if (socket.handshake.query.document_id) {
        getDocumentComments(socket.decoded.user_id, socket.handshake.query.document_id);
    }

    // Add Documents
    socket.on('create-document-comment', async function (data) {
        data = JSON.parse(data)
        let { user_id } = socket.decoded;
        let document_id = socket.document_id;
        let { parent_comment_id, comment, recipient_id, recipient, category_id_list, category_list } = data;
        if (parent_comment_id != null) {
            let [documents] = await UtilsModel.createcomment({
                user_id, document_id, parent_comment_id, comment, recipient_id, recipient, category_id_list, category_list
            })
            getDocumentComments(user_id, document_id);
            await PushNoti.CommentsNotification(data, documents.insertId, user_id)
        } else {
            let [documents] = await UtilsModel.createcomment({
                user_id, document_id, comment, recipient_id, recipient, category_id_list, category_list
            })
            getDocumentComments(user_id, document_id);
            await PushNoti.CommentsNotification(data, documents.insertId, user_id)
        }
        // data = {
        //     comment_id : "<comment_id_to_reply>", // optional
        //     comment : "<user_comment>"
        // }
        // document.push(data)
        ///insert 

        getDocumentComments(user_id, document_id);
    })

    // get Project Comments
    var getProjectComments = async function (user_id, project_id) {
        if (project_id !== undefined && project_id !== "undefined") {
            let [getProject] = await UtilsModel.findComments({
                user_id, project_id
            })
            console.log("Project Comments--->", getProject)
            io.emit('project-comments', getProject);
        }
    }

    // show all the project comment by document_id in the comment module

    if (socket.handshake.query.project_id) {
        getProjectComments(socket.decoded.user_id, socket.handshake.query.project_id);
    }

    // Add Project
    socket.on('create-project-comment', async function (data) {
        data = JSON.parse(data)
        let { user_id } = socket.decoded;
        let project_id = socket.project_id;
        let { parent_comment_id, comment, recipient_id, recipient, category_id_list, category_list } = data;
        if (parent_comment_id != null) {
            console.log("COMMENT--->", user_id, project_id, parent_comment_id, comment, recipient_id, recipient, category_id_list, category_list);
            let [documents] = await UtilsModel.createcomment({
                user_id, project_id, parent_comment_id, comment, recipient_id, recipient, category_id_list, category_list
            })
            getProjectComments(user_id, project_id);
            await PushNoti.CommentsNotification(data, documents.insertId, user_id)
        } else {
            console.log("REPLY COMMENT--->", user_id, project_id, comment, recipient_id, recipient, category_id_list, category_list);
            let [documents] = await UtilsModel.createcomment({
                user_id, project_id, comment, recipient_id, recipient, category_id_list, category_list
            })
            getProjectComments(user_id, project_id);
            await PushNoti.CommentsNotification(data, documents.insertId, user_id)
        }
        // data = {
        //     comment_id : "<comment_id_to_reply>", // optional
        //     comment : "<user_comment>"
        // }
        // document.push(data)
        ///insert 
        getProjectComments(user_id, project_id);
    })


    // Below the code is chat module

    // Get all the group by group_type

    var getGroups = async function (group_type, project_id, team_id, user_id) {
        // const {user_id} = socket.decoded;
        const groupData = {
            group_type,
            project_id,
            team_id,
            user_id
        }
        console.log('groupData-->', groupData)
        // socket.join(project_id);
        const [getGroups] = await chatModel.getGroupDetails(groupData);
        // console.log('User joined room:',getGroups);
        if (getGroups.length > 0 || getGroups.length == 0) {
            // for (let i = 0; i < getGroups.length; i++) {
            // let {user_id} = socket.decoded;
            // const {group_id} = getGroups[i];
            // const array = [48,340];
            // for (let j = 0; j < array.length; j++) {
            // const user_id = array[j];
            // const [count] = await chatModel.getMessageCount(group_id,user_id);
            // getGroups[i].unread_message_count = count[0].unread_message_count;
            // if(i == getGroups.length -1){
            const AllgroupDetails = {
                user_id: (user_id != null) || (user_id != 'null') ? parseInt(user_id) : null,
                team_id: (team_id != null) || (team_id != 'null') ? parseInt(team_id) : null,
                project_id: (project_id != null) || (project_id != 'null') ? parseInt(project_id) : null,
                "group_details": getGroups
            }
            io.emit('all-groups', AllgroupDetails);
            // io.emit('all-groups',getGroups);
            //console.log('all-groupsss-->', AllgroupDetails)
            // }
            // }

            // } 
        }

    }

    var getGroupAfterCreatedMessage = async function (group_id) {

        const [groupDetails] = await chatModel.getGroupDetailsByGroupId(group_id);
        if (groupDetails.length > 0) {
            const { group_type, project_id, team_id } = groupDetails[0];
            const [getUsersByGroupId] = await chatModel.getUsersByGroupId(group_id);
            getUsersByGroupId.map(async (userDetails) => {
                await getGroups(group_type, project_id, team_id, userDetails.user_id);
            })
            // console.log('groupDetails-->',groupDetails[0]);
        } else {
            return 'error'
        }
    }

    var messageAlert = async function () {
       // console.log('messageAlerted')
        getMessage = {
            "message": "received"
        }
        io.emit('message-received', getMessage);
    }

    // show all the group by group_type ( projectwise || teamwise ) in the chat module

    if (socket.handshake.query.group_type && socket.handshake.query.project_group_id && socket.handshake.query.team_id && socket.decoded.user_id) {
        getGroups(socket.handshake.query.group_type, socket.handshake.query.project_group_id, socket.handshake.query.team_id, socket.decoded.user_id);
    }


    // Get all message by group_id 

    const getGroupMessages = async function (group_id, page_no = null) {
       // console.log('getGroupMessages')
        if (group_id != '' && group_id != null) {
            let message_limit;
            if (page_no == null) {
                message_limit = Chat_message_limit;
            } else {
                message_limit = page_no * Chat_message_limit;
            }
           // console.log('message_limit', message_limit);
            const messageData = {
                group_id,
                message_limit
            }
            const [getMessages] = await chatModel.getMessagesByGroupId(messageData);
            // const [groupDetails] = await chatModel.getGroupDetailsByGroupId(group_id);
            // const {group_type,project_id,team_id} = groupDetails[0];
            // console.log('getMessages -->',getMessages);
            let { user_id } = socket.decoded;
            //console.log('UserId-->', user_id);
            if (getMessages.length > 0) {
               // console.log('getMessages details')
                // getMessages.map( async(message,index) => {
                //     const {parent_message_id} = message;
                //     message.parent_message = null;
                //     message.parent_message_user_name = null;
                //     message.parent_message_user_id = null;
                //     if(parent_message_id  != 0){
                //         const [parentMessage] = await chatModel.messageByMessageId(message.parent_message_id);
                //         if(parentMessage.length > 0){
                //             message.parent_message = parentMessage[0].message;
                //             message.parent_message_user_name = parentMessage[0].user_name;
                //             message.parent_message_user_id = parentMessage[0].user_id;
                //         }
                //     }
                //     if(index == getMessages.length - 1){
                // console.log('group messages--->',getMessages)
                const getAllMessage = getMessages.reverse();
                io.to(group_id).emit('group-messages', getAllMessage);
                // getGroups(group_type,project_id,team_id);
                messageAlert();
                //     }
                // })
            } else {
               // console.log('group-messages fecthed successfully-->', user_id)
                io.to(group_id).emit('group-messages', getMessages);
            }
        }
    }

    const updateReadedUsers = async function (group_id, type = null, page_no = null) {
        logger.info('Trying to update readed userId --->', group_id);
        if (group_id != '' && group_id != null) {
            let message_limit;
            if (page_no == null) {
                message_limit = Chat_message_limit;
            } else {
                message_limit = page_no * Chat_message_limit;
            }
            console.log('message_limit', message_limit);
            const messageData = {
                group_id,
                message_limit
            }
            const [getGroupUsers] = await chatModel.getUsersByGroupId(group_id);
            const getGroupUserIds = getGroupUsers.map((item) => { return item.user_id });
            const [getMessages] = await chatModel.getMessagesByGroupIdForUpdateUserId(messageData);
            let { user_id } = socket.decoded;
            logger.info('UserId-->', user_id);
            if (getMessages.length > 0) {
                getMessages.map(async (message, index) => {
                    const { message_id, message_readed_users, group_type, project_id, team_id } = message;
                    let message_readed_user = JSON.parse(message_readed_users)
                    // console.log('message_id-->', message_id)
                    if (!message_readed_user.includes(user_id)) {
                        message_readed_user.push(user_id);
                        const [readStatus] = await chatModel.updateReadedUserId(message_id, message_readed_user);
                        const [getMessageDetails] = await chatModel.messageByMessageId(message_id);
                        let message_readed_userIds = JSON.parse(getMessageDetails[0].message_readed_users);
                        // console.log('message_readed_userIds-->', message_readed_userIds);
                        // console.log('getGroupUserIds-->', getGroupUserIds);
                        const arrayWithDuplicates = message_readed_userIds.concat(getGroupUserIds);
                        let arrayWithoutDuplicates = arrayWithDuplicates.filter((value, index, self) => {
                            return self.indexOf(value) === self.lastIndexOf(value);
                        });
                        //console.log('arrayWithoutDuplicates-->', arrayWithoutDuplicates);
                        if (arrayWithoutDuplicates.length == 0) {
                            const [readMessageUpdated] = await chatModel.updateAllUserReaded(message_id);
                        }
                    }
                    // 0 th index only update the socket-connected-user-id
                    if (index == 0) {
                        // if(index == getMessages.length - 1){
                        if (type == "createdMessage") {
                            const [getConnectedUsers] = await chatModel.getConnectedUsers(group_id);
                            const { user_ids } = getConnectedUsers[0];
                            // console.log('Connected UserIds-->', user_ids)
                            // console.log('getGroupUserIds-->', getGroupUserIds)
                            let message_readed_users = JSON.parse(user_ids);
                            //console.log('message_readed_users-->', message_readed_users);
                            const [readStatusUpdated] = await chatModel.updateReadedUserId(message_id, message_readed_users);
                            if (readStatusUpdated.affectedRows > 0) {
                                getGroupAfterCreatedMessage(group_id);
                            }
                            function removeDuplicates(arr) {
                                return [...new Set(arr)];
                            }
                            // Example usage
                            const arrayWithDuplicates = message_readed_users.concat(getGroupUserIds);
                            const arrayWithoutDuplicates = removeDuplicates(arrayWithDuplicates);
                            if (arrayWithoutDuplicates.length == 0) {
                                const [readMessageUpdated] = await chatModel.updateAllUserReaded(message_id);
                            }
                            //console.log('arrayWithoutDuplicates-->', arrayWithoutDuplicates);
                            const data = {
                                group_type,
                                project_id,
                                team_id,
                                user_id,
                                type: 'create',
                                group_id
                            }
                            const getUnreadMessage = await chatController.getunreadMessageDetails(data);
                            for (let i = 0; i < message_readed_users.length; i++) {
                                const connect_userId = message_readed_users[i];
                                const data = {
                                    group_type,
                                    project_id,
                                    team_id,
                                    user_id: connect_userId,
                                    type: null,
                                    group_id
                                }
                                const getUnreadMessage = await chatController.getunreadMessageDetails(data);
                                logger.info('Message updated successfully---->type--create');
                            }
                        }
                        logger.info('User Id updated successfully---->');
                    }
                    if (index == getMessages.length - 1) {
                        if (type == null) {
                            const messsagesdata = {
                                group_type,
                                project_id,
                                team_id,
                                user_id,
                                type: null,
                                group_id
                            }
                            const getUnreadMessages = await chatController.getunreadMessageDetails(messsagesdata);
                            logger.info('Message updated successfully---->type--null', user_id);

                        }
                    }
                })
            }
            if (type != "createdMessage") {
                getGroupAfterCreatedMessage(group_id);
            }
        }
    }
    const connectedUserIdUpdatedToReadedMessage = async function (group_id, message_id) {
        logger.info('Trying to update readed userId --->', group_id);
        if (group_id != '' && group_id != null && message_id != '' && message_id != null) {
            const messageData = {
                group_id
            }
            const [getConnectedUsers] = await chatModel.getConnectedUsers(messageData.group_id);
            const { user_ids } = getConnectedUsers[0];
            let message_readed_users = JSON.parse(user_ids)
           // console.log('message_readed_users-->', message_readed_users);
            const [readStatusUpdated] = await chatModel.updateReadedUserId(message_id, message_readed_users);
            logger.info('Connected User Id updated into readed message successfully---->');
        }
    };
    const getUsersByGroupId = async function (group_id) {
        //console.log('get Users By GroupId function call-->', group_id);
        const [getUsersByGroupId] = await chatModel.getUsersByGroupId(group_id);
        io.to(group_id).emit('group-users-list', getUsersByGroupId);
    }

    // Join the group and fetch the messages by given group_id

    socket.on('join-group', async function (room) {
        //console.log('req room -->', JSON.parse(room))
        let { group_id } = JSON.parse(room);
        socket.join(group_id);
        getGroupMessages(group_id);
        getUsersByGroupId(group_id);
    });

    socket.on('update-message-readed-user', async function (groupData) {
        let { group_id } = JSON.parse(groupData);
        //console.log('update message user group id-->', group_id)
        updateReadedUsers(group_id);
    })

    socket.on('add-users-into-group', async function (groupData) {
        //console.log('add users function call-->', groupData)
        let { group_id, user_id } = JSON.parse(groupData);
        //console.log('add users function call-->', group_id)
        for (let i = 0; i < user_id.length; i++) {
            const userId = user_id[i];
            const userData = {
                group_id,
                "user_id": userId
            }
            const [addUsersInGroup] = await chatModel.addUsersInGroup(userData);
            if (i == user_id.length - 1) {
                getUsersByGroupId(group_id);
            }
        }
    })

    socket.on('get-users-by-group-id', async function (groupData) {
        let { group_id } = JSON.parse(groupData);
        //console.log('get users function call-->', group_id)
        getUsersByGroupId(group_id);
    })

    socket.on('create-message', async function (messageDetails) {
       // console.log('createMessage call');
        let { message, group_id, user_id, parent_message_id, parent_message, parent_message_user_id, parent_message_user_name,
            parent_files, parent_file_name, parent_file_original_name } = JSON.parse(messageDetails);
        // socket.join(group_id);
        if (parent_message_id != "") {
            const [parent_message_data] = await chatModel.messageByParentMessageId(parent_message_id);
           // console.log('parent_message_data-->', parent_message_data);
            parent_message = parent_message_data[0].parent_message;
            parent_message_user_id = parent_message_data[0].parent_message_user_id;
            parent_message_user_name = parent_message_data[0].parent_message_user_name;
            parent_files = parent_message_data[0].parent_files;
            parent_file_name = parent_message_data[0].parent_file_name;
            parent_file_original_name = parent_message_data[0].parent_file_original_name;
        }
        const messageData = {
            message,
            group_id,
            user_id,
            parent_message_id,
            parent_message,
            parent_files,
            parent_file_name,
            parent_file_original_name,
            parent_message_user_name,
            parent_message_user_id,
            message_readed_users: '[]',
            file_downloaded_users: '[]'
        }
        const [createMessage] = await chatModel.createMessage(messageData);
        if (createMessage.affectedRows > 0) {
            //console.log('Created messages after get message')
            const type = "createdMessage";
            getGroupMessages(group_id);
            updateReadedUsers(group_id, type);
            chatNotification(group_id, createMessage.insertId, user_id);
            // connectedUserIdUpdatedToReadedMessage(group_id,createMessage.insertId);
        }
    })

    socket.on('get-message-with-pagecount', async function (data) {
        let { group_id, page_no } = JSON.parse(data);
        getGroupMessages(group_id, page_no);
        updateReadedUsers(group_id, page_no);
    });
    // socket.on('forward-message', async function (data) {
    //     let forward_details = JSON.parse(data);
    //     chatController.forwardmessage(forward_details);
    //     if (data.receiver_group_id.length > 0) {
    //         console.log('if working')
    // for (let i = 0; i < receiver_group_id.length > 0; i++) {
    //     const group_id = receiver_group_id[i]
    //     getGroupAfterCreatedMessage(group_id);
    //     if (i === receiver_group_id.length - 1) {
    //         console.log('working if loop')
    //         // setTimeout(() => {
    //         //     console.log('This message is displayed after 3 seconds');
    //         //     socket.emit('forward-message-response', { success: true, message: 'All messages forwarded successfully!' });
    //         // }, 3000);


    //     }
    // }

    //         let promises = receiver_group_ids.map(async (group_id) => {
    //             await getGroupAfterCreatedMessage(group_id);
    //         });

    //         // Wait for all promises to resolve
    //         await Promise.all(promises);
    //         socket.emit('forward-message-response', { success: true, message: 'All messages forwarded successfully!' });
    //     } else {

    //     }
    //     //
    //     //callback({ status: 'completed', message: 'All messages forwarded successfully!' });
    //     socket.emit('forward-message-response', { success: true, message: 'All messages forwarded successfully!' });
    //     //updateReadedUsers(group_id,page_no);
    // });

    socket.on('forward-message', (data, callback) => {
        let forward_details = JSON.parse(data);
        console.log('forwa---', forward_details)
        chatController.forwardmessage(forward_details);

        // Forward message to all groups
        const rgroup_id = forward_details.receiver_group_id
        console.log('----rgroValue', rgroup_id)
        forwardMessageToGroups(rgroup_id, (error) => {
            console.log('error---', error)
            if (error) {
                console.error('Error forwarding message:', error);
                callback({ success: false, message: 'Failed to forward message' });
            } else {
                console.log('success---')
                callback({ success: true, message: 'All messages forwarded successfully!' });
            }
        });
    });

    // Example implementation of forwardMessageToGroups with a callback
    function forwardMessageToGroups(group_id, callback) {
        console.log('--------receivergroupid', group_id)

        if (!group_id || group_id.length === 0) {
            return callback(new Error('No receiver group IDs provided'));
        }

        let promises = group_id.map((groupId) => {
            return new Promise((resolve, reject) => {
                getGroupAfterCreatedMessage(groupId, (err) => {
                    if (err) {
                        console.error(`Error for group ${groupId}:`, err);
                        reject(err);
                    } else {
                        console.error('successfully resolved');
                        resolve();
                    }
                });
            });
        });

        // Promise.all(promises)
        //     .then(() => callback(null))
        //     .catch((error) => callback(error));

        Promise.all(promises)
            .then(() => {
                console.log('All group messages processed successfully');
                callback(null);
            })
            .catch((error) => {
                console.error('Error processing group messages:', error);
                callback(error);
            });
    }




    if (socket.handshake.query.group_id) {

        async function connectedUser() {
            let { user_id } = socket.decoded;
            const { group_id } = socket.handshake.query;
            // console.log('AutogetGroupMessage', user_id)
            const [checkConnectedUsers] = await chatModel.getConnectedUsers(group_id);
            //console.log('checkConnectedUsers-->', checkConnectedUsers)
            if (checkConnectedUsers.length == 0) {
                let connectedUser = []
                connectedUser.push(user_id)
                const userData = {
                    group_id,
                    user_ids: connectedUser
                }
                const [addConnectedUser] = await chatModel.createConnectedUser(userData);
            } else {
                const { user_ids } = checkConnectedUsers[0];
                let connected_user = JSON.parse(user_ids);
                if (!connected_user.includes(user_id)) {
                    connected_user.push(user_id)
                    const userData = {
                        group_id,
                        user_ids: connected_user
                    }
                    const [updateConnectedUser] = await chatModel.updateConnectedUser(userData);
                }
            }
        }
        connectedUser();
    }

    socket.on('disconnect', function () {
        console.log('Got disconnect!', socket.decoded);

        if (socket.handshake.query.group_id) {
            const { group_id } = socket.handshake.query;
            async function removedDicconnectedUser() {
                const [checkConnectedUsers] = await chatModel.getConnectedUsers(group_id);
                const { user_id } = socket.decoded;
                const { user_ids } = checkConnectedUsers[0];
                let connected_user = JSON.parse(user_ids);
                const removingUserIndex = connected_user.indexOf(user_id);
                connected_user.splice(removingUserIndex, 1);
                // console.log('disconnecting user_id-->', user_id)
                // console.log('connected_user after filter--->', connected_user)
                const userData = {
                    group_id,
                    user_ids: connected_user
                }
                const [updateConnectedUser] = await chatModel.updateConnectedUser(userData);

            }
            removedDicconnectedUser();
        }

        // var i = allClients.indexOf(socket);
        // delete allClients[i];
    });

    //  console.log('connectedUser',connectedUser)

    //  socket.on('joinRoom', (room) => {
    //     if (!roomExists(room)) {
    //       // If the room doesn't exist, create it
    //       activeRooms[room] = { users: [] };
    //       console.log(`Room created: ${room}`);
    //     }

    //     // socket.join(room);
    //     console.log('socket.id -->',socket.id)
    //     activeRooms[room].users.push(socket.id);

    //     console.log(`User joined room: ${room}`);
    //     console.log(`Users in room ${room}: ${activeRooms[room].users.length}`);

    //     // io.to(room).emit('userJoined', {
    //     //   userId: socket.id,
    //     //   totalUsers: activeRooms[room].users.length,
    //     // });
    //   });
    // setInterval(function () {
    //     console.log('UserId-->',socket.decoded.user_id)
    //     getGroups(socket.handshake.query.group_type,socket.handshake.query.project_group_id,socket.handshake.query.team_id,socket.decoded.user_id);
    // }, 2000);



});




