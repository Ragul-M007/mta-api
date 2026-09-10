/**
 * @author Ramesh sankar S
 * @email rameshsankar.s@skeintech.com
 * @create date 2023-11-01
 * @desc [description]
 */

const express = require('express');
const { Message } = require("../utils/messages");
const Response = require("../utils/response");
const AppErrorHandler = require("../utils/error-handler");
const { StatusCodes } = require("http-status-codes");
const logger = require('../utils/winston');
const chatModel = require('../models/chat.model');
const path = require('path');
const { toLower } = require('lodash');
const UserModel = require('../models/user.model');
const { Chat_message_limit, Group_type } = require('../utils/chat');
const { log, group } = require('console');
const { type } = require('os');
const { json } = require('body-parser');
const { chatNotification, forwardNotification } = require("../utils/push-notification");
const fs = require('fs');
const { getMaxListeners } = require('process');

const chatController = {

    // create the group

    async createGroup(req, res) {
        try {
            logger.info('Trying to create group --->', req.body);
            const { group_name, group_description, group_image, group_type, group_created_by, project_id, team_id } = req.body;
            if (group_name != '' && group_name != null &&
                group_created_by != null && group_created_by != '' && group_created_by != undefined &&
                group_type != null && group_type != '' && group_type != undefined
            ) {
                logger.info('group creation required data --->', group_name);
                // I will remove the all spaces in group_name because avoid the group name duplication issue.
                const groupName = toLower(group_name.replaceAll(' ', ''));
                const [getAllGroupDetails] = await chatModel.getAllGroupDetails();
                const allGroupName = await getAllGroupDetails.map((item) => {
                    return toLower(item.group_name.replaceAll(' ', ''));
                });
                if (!allGroupName.includes(groupName)) {
                    const [createGroup] = await chatModel.createGroup(req.body);
                    if (createGroup.affectedRows > 0) {
                        logger.info('group created sucessfully');
                        const data = {
                            "group_id": createGroup.insertId
                        }
                        // Chat Access Users
                        // let [chatAccessUser] = await chatModel.GetChatDefaultUsers();
                        // const chatAccessUserArray = chatAccessUser.map((item) => { return item.user_id });
                        // const groupData = {
                        //     group_type,
                        //     "group_id": createGroup.insertId
                        // }
                        // let [projectManagerDetails] = await chatModel.getProjectManagerDetails(groupData);
                        // const projectManagerUserArray = projectManagerDetails.map((item1) => { return item1.user_id });
                        // const defaultUserArray = chatAccessUserArray.concat(projectManagerUserArray);
                        // // const userId = [req.user.user_id];
                        // console.log('Default User Array-->', defaultUserArray);
                        const defaultUserArray = []
                        defaultUserArray.push(req.user.user_id)
                        const type = 'admin';
                        await chatController.userAddedIntoGroup(res, defaultUserArray, createGroup.insertId, type);
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Creation("Group"), data);
                    } else {
                        logger.error('group creation failed');
                        new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Creation("Group"));
                    }
                } else {
                    logger.error('group name already exists');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Group name"));
                }
            }
            else {
                logger.error('The error is group creation required some data missing --->', req.body);
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Group creation"));
            }
        } catch (error) {
            logger.error('group creation error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }

    },

    // Get All Groups

    async getGroups(req, res) {
        try {
            const { group_type, project_id, team_id } = req.query;
            if (group_type != '' && group_type != null) {
                const groupData = {
                    group_type,
                    project_id,
                    team_id
                }
                logger.info('Body Data --->', group_type);
                const [getGroups] = await chatModel.getGroups(groupData);
                if (getGroups.length > 0) {
                    for (let i = 0; i < getGroups.length; i++) {
                        const user_id = 48;
                        const { group_id } = getGroups[i];
                        const [count] = await chatModel.getMessageCount(group_id, user_id);
                        getGroups[i].unread_message_count = count[0].unread_message_count;
                    }
                    logger.info("Groups fecthed successfully")
                    new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Groups"), getGroups);
                } else {
                    logger.error('Groups data not found');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Groups"));
                }
            } else {
                logger.error('Get group required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Get groups"));
            }
        } catch (error) {
            logger.error('get group error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },

    // Get Group Details By Group Id

    async getGroupDetailsByGroupId(req, res) {
        try {
            const { group_id } = req.query;
            if (group_id != '' && group_id != null) {
                logger.info('Query Data --->', group_id);
                const [getGroupDetails] = await chatModel.getGroupDetailsByGroupId(group_id);
                if (getGroupDetails.length > 0) {
                    logger.info("Group details fecthed successfully")
                    new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Group details"), getGroupDetails[0]);
                } else {
                    logger.error('Groups details not found');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Groups"));
                }
            } else {
                logger.error('Get group details required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Get group details"));
            }
        } catch (error) {
            logger.error('get group error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }

    },

    // update Group details

    async updateGroup(req, res) {
        try {
            const { group_name, group_description, group_image } = req.body;
            const { group_id } = req.query;
            console.log('query -->', group_id);
            if (group_id != '' && group_id != null) {
                const groupData = {
                    group_name,
                    group_description,
                    group_image
                }
                logger.info('Body Data --->', groupData);
                logger.info('group creation required data --->', group_name);
                // I will remove the all spaces in group_name because avoid the group name duplication issue.
                const groupName = toLower(group_name.replaceAll(' ', ''));
                const [getAllGroupDetails] = await chatModel.getAllGroupDetails();
                const allGroupName = await getAllGroupDetails.map((item) => {
                    return toLower(item.group_name.replaceAll(' ', ''));
                });
                if (!allGroupName.includes(groupName)) {
                    const [updateGroup] = await chatModel.updateGroup(groupData, group_id);
                    if (updateGroup.affectedRows > 0) {
                        logger.info("Group details updated successfully")
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Updation("Group Details"));
                    } else {
                        logger.error('Group details updated failed');
                        new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Groups"));
                    }
                } else {
                    logger.error('group name already exists');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Group name"));
                }
            } else {
                logger.error('Get group required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Get groups"));
            }

        } catch (error) {
            logger.error('get group error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }

    },

    // Delete the Group

    async deleteGroup(req, res) {
        try {
            const { group_id } = req.query;
            const user_id = req.user.user_id;
            if (group_id != '' && group_id != null) {
                logger.info('Body Data --->', group_id);
                const [deleteGroup] = await chatModel.deleteGroup(group_id, user_id);
                console.log('deleteGroup-->', deleteGroup)
                if (deleteGroup[0]) {
                    logger.info("Groups deleted successfully")
                    new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Groups"));
                } else {
                    logger.error('Groups deletion failed');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Deletion("Groups"));
                }
            } else {
                logger.error('Get group required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Get groups"));
            }
        } catch (error) {
            logger.error('get group error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },

    // Add users in group

    async addUsersInGroup(req, res) {
        try {
            logger.info('Trying to add users in group');
            const { group_id, user_id } = req.body;
            if (user_id.length > 0 && group_id != '' && group_id != null) {
                await chatController.userAddedIntoGroup(res, user_id, group_id);
            } else {
                logger.error('Add users in group required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Add users in group"));
            }
        } catch (error) {
            logger.error('add users in group error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }

    },

    async userAddedIntoGroup(res, user_id, group_id, type = null) {
        let success;
        if (type != null && type == 'admin') {
            user_id.map(async (userId, index) => {
                const userData = {
                    group_id,
                    "user_id": userId
                }
                const [checkUserInGroup] = await chatModel.checkUserInGroup(userData);
                if (checkUserInGroup.length == 0) {
                    const [addUsersInGroup] = await chatModel.addUsersInGroup(userData);
                    if (addUsersInGroup.affectedRows > 0) {
                        if (index === user_id.length - 1) {
                            logger.info('Users added into group sucessfully');
                            return success = true;
                        }
                    } else {
                        logger.error('Users added into group failed');
                        return success = false;
                    }
                }
            });
            return success;
        } else {
            user_id.map(async (userId, index) => {
                const userData = {
                    group_id,
                    "user_id": userId
                }
                const [checkUserInGroup] = await chatModel.checkUserInGroup(userData);
                if (checkUserInGroup.length == 0) {
                    const [addUsersInGroup] = await chatModel.addUsersInGroup(userData);
                    if (addUsersInGroup.affectedRows > 0) {
                        if (index === user_id.length - 1) {
                            logger.info('Users added into group sucessfully');
                            new Response(res, StatusCodes.OK)._SuccessResponse("Users added into group sucessfully");
                        }
                    } else {
                        logger.error('Users added into group failed');
                        new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage("Users will added into group failed");
                    }
                } else {
                    if (index === user_id.length - 1) {
                        logger.info('Users added into group sucessfully');
                        new Response(res, StatusCodes.OK)._SuccessResponse("Users added into group sucessfully, but some users already exists");
                    }
                }
            });
        }
    },

    // Get Users by group_id

    async getUsersByGroupId(req, res) {
        try {
            const { group_id } = req.query;
            if (group_id != '' && group_id != null) {
                logger.info('Body data -->', group_id);
                const [getUsersByGroupId] = await chatModel.getUsersByGroupId(group_id);
                if (getUsersByGroupId.length > 0) {
                    logger.info('Users fetched sucessfully');
                    new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Users"), getUsersByGroupId);
                } else {
                    logger.error('Users data not found');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Users"));
                }
            } else {
                logger.error('Get users required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Get users"));
            }
        } catch (error) {
            logger.error('get users by group_id error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }
    },

    // Get Unlinked users in Group 

    async getUnlinkedUsersInGroup(req, res) {
        try {
            const { group_id } = req.query;
            if (group_id != '' && group_id != null) {
                logger.info('Body data -->', group_id);
                const [getGroupDetails] = await chatModel.getGroupDetailsByGroupId(group_id);
                const [getUsersByGroupId] = await chatModel.getUsersByGroupId(group_id);
                const groupData = {
                    group_id,
                    "group_type": getGroupDetails[0].group_type
                }
                const [userList] = await chatModel.getUsers(groupData);
                if (userList.length > 0) {
                    userList.map((userDetails, index) => {
                        userDetails.alreadyLinked = false;
                        if (getUsersByGroupId.some(item => item.user_id === userDetails.user_id)) {
                            userDetails.alreadyLinked = true;
                        }
                        if (index == userList.length - 1) {
                            logger.info('Users fetched sucessfully');
                            new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Users"), userList)
                        }
                    })
                }
                else {
                    logger.error('Users data not found');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Users"));
                }
            } else {
                logger.error('Get users required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Get users"));
            }
        } catch (error) {
            logger.error('get users by group_id error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }

    },
    async removeUsersInGroup(req, res) {
        try {
            logger.info('Trying to remove users in group');
            const { group_id, user_id } = req.body;
            if (user_id.length > 0 && group_id != '' && group_id != null) {
                const userData = {
                    user_id,
                    group_id
                }
                const [removeUser] = await chatModel.removeUserInGroup(userData);
                console.log('removeUser', removeUser)
                if (removeUser.affectedRows > 0) {
                    logger.info('Users removed sucessfully');
                    new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Removed("User"))
                } else {
                    logger.error('Users deletion failed');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Deletion("User"));
                }
            } else {
                logger.error('Remove users in group required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Remove users in group"));
            }
        } catch (error) {
            logger.error('Remove users in group error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },
    async createMessage(req, res) {
        try {
            let { message, group_id, user_id, parent_message_id, parent_message, parent_message_user_id, parent_message_user_name,
                parent_files, parent_file_name, parent_file_original_name } = req.body;
            if (group_id != '' && group_id != null && user_id != '' && user_id != null) {
                const groupFiles = req.files;
                if (groupFiles.length > 0) {
                    // let {messages} = req.body;
                    let messages = ['1stImage', '2ndImage'];
                    groupFiles.map(async (file, index) => {
                        console.log('file -->', file);
                        let filePath = file.path.replaceAll('\\', '/');
                        filePath = filePath.replace('public/uploads/', '')
                        const fileExtension = toLower(path.extname(file.originalname));
                        console.log('fileExtension-->', fileExtension)
                        let file_type;
                        if (fileExtension == '.pdf' || fileExtension == '.xlsx' || fileExtension == '.csv' || fileExtension == '.docx') {
                            file_type = 'document';
                        } else if (fileExtension == '.mp4' || fileExtension == '.avi' || fileExtension == '.mov' || fileExtension == '.wmv' ||
                            fileExtension == '.mkv' || fileExtension == '.mpeg-2') {
                            file_type = 'video';
                        } else if (fileExtension == '.jpeg' || fileExtension == '.gif' || fileExtension == '.png' || fileExtension == '.jpg' ||
                            fileExtension == '.tiff' || fileExtension == '.psd') {
                            file_type = 'image';
                        } else if (fileExtension == '.mp3' || fileExtension == '.aac' || fileExtension == '.wav' || fileExtension == '.opus'
                            || fileExtension == '.m4a') {
                            file_type = 'audio'
                        } else {
                            file_type = 'others'
                        }
                        if (parent_message_id != "") {
                            const [parent_message_data] = await chatModel.messageByParentMessageId(parent_message_id);
                            console.log('parent_message_data-->', parent_message_data);
                            parent_message = parent_message_data[0].parent_message;
                            parent_message_user_id = parent_message_data[0].parent_message_user_id;
                            parent_message_user_name = parent_message_data[0].parent_message_user_name;
                            parent_files = parent_message_data[0].parent_files;
                            parent_file_name = parent_message_data[0].parent_file_name;
                            parent_file_original_name = parent_message_data[0].parent_file_original_name;
                        }
                        const messageData = {
                            message: 'file-uploaded',
                            files: filePath,
                            file_name: file.filename.split('.')[0],
                            file_original_name: file.originalname.split('.')[0],
                            file_size: file.size,
                            file_type,
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
                            const message_id = createMessage.insertId;
                            const [getConnectedUsers] = await chatModel.getConnectedUsers(group_id);
                            const { user_ids } = getConnectedUsers[0];
                            let message_readed_users = JSON.parse(user_ids);
                            console.log('message_readed_users-->', message_readed_users);
                            const [readStatusUpdated] = await chatModel.updateReadedUserId(message_id, message_readed_users);
                            const [getGroupDetails] = await chatModel.getGroupDetailsByGroupId(group_id);
                            const { group_type, project_id, team_id } = getGroupDetails[0];
                            const data = {
                                group_type,
                                project_id,
                                team_id,
                                user_id,
                                type: 'create',
                                group_id
                            }
                            const getUnreadMessage = await chatController.getunreadMessageDetails(data);
                            chatNotification(group_id, message_id, user_id);
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
                        if (index == groupFiles.length - 1) {
                            logger.info('Message created successfully')
                            new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Creation("Message"));
                        }
                    })
                } else {
                    if (parent_message_id != "") {
                        const [parent_message_data] = await chatModel.messageByParentMessageId(parent_message_id);
                        console.log('parent_message_datasss-->', parent_message_data);
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
                        logger.info('Message created successfully')
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Creation("Message"));
                    } else {
                        logger.error('Message creation failed');
                        new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Creation("Message"));
                    }
                }
            } else {
                logger.error('Message required data some missing ');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Message"));
            }
        } catch (error) {
            logger.error('Message creation error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }
    },

    // Get all Message by Group Id

    async messagesByGroupId(req, res) {
        try {
            const { group_id, page_no } = req.query;
            if (group_id != '' && group_id != null) {
                console.log('pageNo--->', page_no);
                let message_limit;
                if (page_no == null) {
                    message_offset_value = Chat_message_limit;
                } else {
                    message_offset_value = (page_no * Chat_message_limit) - Chat_message_limit;
                }
                console.log('message_limit', message_offset_value);
                const messageData = {
                    group_id,
                    message_offset_value,
                    Chat_message_limit
                }
                const [getMessages] = await chatModel.getMessagesByGroupIdInAPI(messageData);
                console.log('getMessages-Count-->', getMessages.length)
                if (getMessages.length > 0) {
                    const getAllMessage = getMessages.reverse();
                    logger.info('Messages fetched sucessfully');
                    const nextpagecount = getMessages.length;
                    let nextpage;
                    if (nextpagecount >= Chat_message_limit) {
                        nextpage = 1
                    } else {
                        nextpage = 0
                    }
                    new Response(res, StatusCodes.OK)._SuccessResponse1(Message.Common.SuccessMessage.Fetch("Messages"), getAllMessage, nextpage)
                    // getMessages.map( async(message,index) => {
                    //     const {parent_message_id,message_id,message_readed_users} = message;
                    //     console.log('message_readed_users-->',typeof(message_readed_users))
                    //     let message_readed_user = JSON.parse(message_readed_users)
                    //     if(!message_readed_user.includes(12)){
                    //         message_readed_user.push(12);
                    //         console.log('message_readed_users-->',message_readed_user)
                    //         const [readStatus] = await chatModel.updateReadedUserId(message_id,message_readed_user);
                    //     }
                    //     message.parent_message = null;
                    //     message.parent_message_user_name = null;
                    //     message.parent_message_user_id = null;
                    //     console.log('parent_id--->',parent_message_id)
                    //     if(parent_message_id != 0){
                    //         console.log('Parent message check')
                    //         const [parentMessage] = await chatModel.messageByMessageId(message.parent_message_id);
                    //         if(parentMessage.length > 0){
                    //             message.parent_message = parentMessage[0].message;
                    //             message.parent_message_user_name = parentMessage[0].user_name;
                    //             message.parent_message_user_id = parentMessage[0].user_id;
                    //         }
                    //     }
                    //     if(index == getMessages.length - 1){
                    //         logger.info('Messages fetched sucessfully');
                    //         new Response(res,StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Messages"),getMessages.reverse())
                    //     }
                    // })
                }
                else {
                    logger.error('Messages data not found');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoDataFound("Messages"));
                }
            } else {
                logger.error('Message required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Get message"));
            }
        } catch (error) {
            logger.error('Get message error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }
    },

    // Message readed user list function

    async messagereadedUsers(req, res) {
        try {
            const { message_id } = req.query;
            const { user_id } = req.user;
            if (message_id != '' && message_id != null) {
                const [getUsers] = await chatModel.readerUserByMessageId(message_id);
                if (getUsers.length > 0) {
                    let { message_readed_users } = getUsers[0];
                    let userListInArray = JSON.parse(message_readed_users)
                    console.log('userListInArray-->', userListInArray)
                    userListInArray = userListInArray.filter((item) => item != user_id)
                    console.log('userListInArray1-->', userListInArray)
                    const user_ids = userListInArray.join(',')
                    if (userListInArray.length > 0) {
                        console.log('user_ids-->', user_ids)
                        const [userDetails] = await UserModel.GetUsers(user_ids);
                        if (userDetails.length > 0) {
                            logger.info('Message readed users fetched successfully');
                            new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Message readed users"), userDetails)
                        } else {
                            logger.error('Message readed users fetched failed');
                            new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Message reader users"));
                        }
                    } else {
                        logger.error('No users seen');
                        new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoUserSeen("users"));
                    }
                } else {
                    logger.error('Message readed users fetched failed');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Message reader users"));
                }
            } else {

            }
        } catch (error) {
            logger.error('message reader user error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }
    },

    // Group create access 

    async groupCreateAccess(req, res) {
        try {
            let { user_id, status } = req.body;
            if (user_id.length > 0) {
                if (status == "add") {
                    const userData = {
                        "group_create_access": 1
                    }
                    const [updategroupCreateAccess] = await UserModel.updateuserData(userData, user_id);
                    if (updategroupCreateAccess.affectedRows > 0) {
                        logger.info('Group create access enabled successfully');
                        new Response(res, StatusCodes.OK)._SuccessResponse("Group create access enabled successfully")
                    }
                } else if (status == 'remove') {
                    const userData = {
                        "group_create_access": 0
                    }
                    const [updategroupCreateAccess] = await UserModel.updateuserData(userData, user_id);
                    if (updategroupCreateAccess.affectedRows > 0) {
                        logger.info('Group create access disabled successfully');
                        new Response(res, StatusCodes.OK)._SuccessResponse("Group create access disabled successfully")
                    }
                }
            } else {
                logger.error('Group create access required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Group create access"));
            }
        } catch (error) {
            logger.error('group create access error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }
    },

    // Get group create access user list

    async groupCreateAccessUserList(req, res) {
        try {
            let { status } = req.query;
            const [getUserList] = await UserModel.GetGroupAccessUserList(status);
            if (getUserList.length > 0) {
                logger.info('Group create access user list fetched successfully');
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Group create access user list"), getUserList)
            } else {
                logger.error('Group create access user list fetched failed');
                new Response(res, StatusCodes.OK)._SuccessResponse("No users found", [])
            }
        } catch (error) {
            logger.error('group create access user list error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }
    },

    // Once file downloaded after update the is_downloaded status

    async updateFileDownloadStatus(req, res) {
        try {
            let { message_id, status } = req.query;
            let { user_id } = req.user;
            logger.info('File download status query', req.query);
            if (message_id != null && status != null && message_id != '' && status != '') {
                logger.info('File download status message_id', message_id);
                const [getMessages] = await chatModel.messageByMessageId(message_id);
                console.log('getMessages--->', getMessages[0])
                const { file_downloaded_users } = getMessages[0];
                let file_downloded_user_ids = JSON.parse(file_downloaded_users)
                if (!file_downloded_user_ids.includes(user_id)) {
                    file_downloded_user_ids.push(user_id);
                }
                console.log('file_downloded_user_ids--->', file_downloded_user_ids)
                // const messageData = {
                //     "is_downloaded" : status,
                //     file_downloaded_users : file_downloded_user_ids
                // }
                const [updateStatus] = await chatModel.updateFileDownloadStatus(message_id, file_downloded_user_ids);
                if (updateStatus.affectedRows > 0) {
                    logger.info('File download status updated successfully');
                    new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Updation("File download status"))
                } else {
                    logger.error('File download status updated failed');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Updation("File download status"));
                }
            } else {
                logger.error('update file download status required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Update file download status"));
            }
        } catch (error) {
            logger.error('update file download status error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }
    },

    // Get group files based on file type

    async getGroupFiles(req, res) {
        try {
            const { group_id, file_type } = req.query;
            const { user_id } = req.user;
            logger.info('getGroupFiles', req.query);
            if (group_id != null && group_id != '' && file_type != null && file_type != '') {
                logger.info('getGroupFiles --> group_id', group_id);
                const groupData = {
                    group_id,
                    file_type,
                    user_id
                }
                const [getFiles] = await chatModel.getGroupFiles(groupData);
                if (getFiles.length > 0) {
                    logger.info('Group files fetched successfully');
                    new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Group files"), getFiles)
                } else {
                    logger.error('Group files fetched failed');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Group files"));
                }
            } else {
                logger.error('update file download status required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Update file download status"));
            }
        } catch (error) {
            logger.error('get group file error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }
    },

    async groupCreateAccessDetails(req, res) {
        try {
            //----------------getting user id from jwt token --------------//
            const user_id = req.user.user_id
            logger.info('User Details--->', user_id);
            const [getGroupAccessData] = await chatModel.groupCreateAccessDetails(user_id)
            if (getGroupAccessData.length > 0) {
                logger.info('Group access for particular user fetched successfully');
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Group create access user"), getGroupAccessData[0])
            } else {
                logger.error('Group access for particular user fetched failed');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Group create access user"));
            }
        }
        catch (error) {
            logger.error('group create access for particular user  error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }

    },
    async getunreadMessageDetails(data) {
        try {
            console.log('givendata--->', data)
            //----------------getting un read message details --------------//
            const { group_type, project_id, team_id, user_id, type, group_id } = data;
            logger.info('User Details--->', user_id);
            const groupData = {
                user_id,
                group_type,
                project_id,
                team_id,
                type
            }
            console.log('unMessageData--->1212')
            const [unMessageData] = await chatModel.getUnreadMessageDetails(groupData);
            let getUserIds;
            if (group_type == Group_type.Type_1) {
                const [getUsers] = await chatModel.getUsersByProjectId(project_id, group_id);
                console.log('Project Users-->', getUsers);
                getUserIds = getUsers.map((item) => item.user_id).filter((element) => element != user_id)
                console.log('Project UserIds-->', getUserIds);
            } else if (group_type == Group_type.Type_2) {
                const [getUsers] = await chatModel.getUsersByTeamId(team_id, group_id);
                console.log('Team Users-->', getUsers);
                getUserIds = getUsers.map((item) => item.user_id).filter((element) => element != user_id)
                console.log('Team UserIds-->', getUserIds);
            }
            if (unMessageData.length == 0) {
                console.log('getGroupAccessData1-->');
                const messagesData = {
                    user_id: getUserIds,
                    group_type,
                    project_id,
                    team_id
                }
                if (type == 'create') {
                    const [unMessageData1] = await chatModel.addUnreadMessageDetails(messagesData);
                }
                console.log('Message added successfully..!')
            } else {
                console.log('getGroupAccessData1-->update');
                const [getTotalUnReadMessageCount] = await chatModel.getTotalUnReadMessageCount(groupData);
                console.log('getGroupAccessData-->', getTotalUnReadMessageCount);
                if (getTotalUnReadMessageCount[0].totalUnReadMessageCount == 0) {
                    console.log('count if working')
                    const count = getTotalUnReadMessageCount[0].totalUnReadMessageCount == null
                        || getTotalUnReadMessageCount[0].totalUnReadMessageCount == 0 ? 0 : getTotalUnReadMessageCount[0].totalUnReadMessageCount;
                    logger.info('Unread Message count fetched successfully');
                    getTotalUnReadMessageCount[0].totalUnReadMessageCount = parseInt(count);
                    const user_ids = JSON.parse(unMessageData[0].user_id);
                    console.log('user_ids-->', user_ids)
                    console.log('givenUserId-->', user_id)
                    let newArray = user_ids.filter(element => element != user_id);
                    // user_ids.push(user_id);
                    const messagesData = {
                        user_id: newArray,
                        group_type,
                        project_id,
                        team_id
                    }
                    console.log('messagesData-->', messagesData)
                    const [unMessageData12] = await chatModel.updateUnreadMessageDetails(messagesData, unMessageData[0].id);
                    console.log('Message updated successfully..!')

                } else {
                    console.log('Message updated successfully..!')
                }
                if (type == 'create') {
                    const userIds = JSON.parse(unMessageData[0].user_id);
                    console.log('userIds--->', userIds);
                    console.log('getUserIds--->', getUserIds);
                    const filterUserIds = userIds.concat(getUserIds);
                    console.log('filterUserIds--->', filterUserIds);
                    let uniqueArray = [...new Set(filterUserIds)];
                    console.log('uniqueArray--->', uniqueArray);
                    const messagesData = {
                        user_id: uniqueArray,
                        group_type,
                        project_id,
                        team_id
                    }
                    console.log('messagesData1-->', messagesData)
                    const [unMessageData12] = await chatModel.updateUnreadMessageDetails(messagesData, unMessageData[0].id);
                }

            }
        }
        catch (error) {
            logger.error('group create access for particular user  error is --->', error);
        }

    },

    async getunreadMessageDetail(req, res) {
        try {
            //----------------getting un read message details --------------//
            const { group_type, project_id, team_id, user_id, type, group_id } = req.query;
            logger.info('User Details--->', user_id);
            const groupData = {
                user_id,
                group_type,
                project_id,
                team_id,
                type
            }
            console.log('unMessageData--->1212')
            const [unMessageData] = await chatModel.getUnreadMessageDetails(groupData);
            let getUserIds;
            if (group_type == Group_type.Type_1) {
                const [getUsers] = await chatModel.getUsersByProjectId(project_id, group_id);
                console.log('Project Users-->', getUsers);
                getUserIds = getUsers.map((item) => item.user_id).filter((element) => element != user_id)
                console.log('Project UserIds-->', getUserIds);
            } else if (group_type == Group_type.Type_2) {
                const [getUsers] = await chatModel.getUsersByTeamId(team_id, group_id);
                console.log('Team Users-->', getUsers);
                getUserIds = getUsers.map((item) => item.user_id).filter((element) => element != user_id)
                console.log('Team UserIds-->', getUserIds);
            }
            if (unMessageData.length == 0) {
                console.log('getGroupAccessData1-->');
                const messagesData = {
                    user_id: getUserIds,
                    group_type,
                    project_id,
                    team_id
                }
                if (type == 'create') {
                    const [unMessageData1] = await chatModel.addUnreadMessageDetails(messagesData);
                }
                console.log('Message added successfully..!')
            } else {
                console.log('getGroupAccessData1-->update');
                const [getTotalUnReadMessageCount] = await chatModel.getTotalUnReadMessageCount(groupData);
                console.log('getGroupAccessData-->', getTotalUnReadMessageCount);
                if (getTotalUnReadMessageCount[0].totalUnReadMessageCount == 0) {
                    const count = getTotalUnReadMessageCount[0].totalUnReadMessageCount == null
                        || getTotalUnReadMessageCount[0].totalUnReadMessageCount == 0 ? 0 : getTotalUnReadMessageCount[0].totalUnReadMessageCount;
                    logger.info('Unread Message count fetched successfully');
                    getTotalUnReadMessageCount[0].totalUnReadMessageCount = parseInt(count);
                    const user_ids = JSON.parse(unMessageData[0].user_id);
                    console.log('user_ids-->', user_ids)
                    console.log('givenUserId-->', user_id)
                    let newArray = user_ids.filter(element => element != user_id);
                    // user_ids.push(user_id);
                    const messagesData = {
                        user_id: newArray,
                        group_type,
                        project_id,
                        team_id
                    }
                    console.log('messagesData-->', messagesData)
                    const [unMessageData12] = await chatModel.updateUnreadMessageDetails(messagesData, unMessageData[0].id);
                    console.log('Message updated successfully..!')

                } else {
                    console.log('Message updated successfully..!')
                }
                if (type == 'create') {
                    const userIds = JSON.parse(unMessageData[0].user_id);
                    console.log('userIds--->', userIds);
                    console.log('getUserIds--->', getUserIds);
                    const filterUserIds = userIds.concat(getUserIds);
                    console.log('filterUserIds--->', filterUserIds);
                    let uniqueArray = [...new Set(filterUserIds)];
                    console.log('uniqueArray--->', uniqueArray);
                    const messagesData = {
                        user_id: uniqueArray,
                        group_type,
                        project_id,
                        team_id
                    }
                    console.log('messagesData1-->', messagesData)
                    const [unMessageData12] = await chatModel.updateUnreadMessageDetails(messagesData, unMessageData[0].id);
                }

            }
        }
        catch (error) {
            logger.error('group create access for particular user  error is --->', error);
        }

    },

    // Delete the Message

    async deleteMessage(req, res) {
        try {
            const { message_id, group_id } = req.query;
            if (message_id != '' && message_id != null) {
                logger.info('Body Data --->', message_id);
                const [deleteMessage] = await chatModel.deleteMessage(message_id);
                const [getGroupUsers] = await chatModel.getUsersByGroupId(group_id);
                const [getGroupDetails] = await chatModel.getGroupDetailsByGroupId(group_id);
                const getGroupUserIds = getGroupUsers.map((item) => { return item.user_id });
                console.log('deleteMessage-->', deleteMessage)
                if (deleteMessage.affectedRows > 0) {
                    const { group_type, project_id, team_id } = getGroupDetails[0];
                    for (let i = 0; i < getGroupUserIds.length; i++) {
                        const connect_userId = getGroupUserIds[i];
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
                    logger.info("Message deleted successfully")
                    new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Message"));
                } else {
                    logger.error('Message deletion failed');
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Deletion("Message"));
                }
            } else {
                logger.error('Delete message required data some missing');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.RequiredDataNotFound("Delete Message"));
            }
        } catch (error) {
            logger.error('Delete message error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },


    async forwardmessage(data) {
        try {
            let { document_id, receiver_group_id, user_id, sender_group_id, project_id, grouptype, team_id } = data

            const multiple_doc_id = data.document_id
            const multiple_receiver_id = data.receiver_group_id

            for (let i = 0; i < multiple_doc_id.length; i++) {
                for (let j = 0; j < multiple_receiver_id.length; j++) {
                    group_id = multiple_receiver_id[j]
                    const [getDocument] = await chatModel.getDocumentId(multiple_doc_id[i])
                    console.log("---------", getDocument)
                    if (getDocument.length > 0 && getDocument[0].files != null) {
                        console.log('workimg1')
                        const document_file = getDocument[0].files
                        const filePath = document_file.replace('chat/', '');
                        const sourceFilePath = path.join('./public/uploads/chat', filePath);
                        // Extract filename and extension
                        const extname = path.extname(filePath);

                        const basename = path.basename(filePath, extname);


                        // Create new filename by appending 'copy'
                        const newFileName = `${basename}_copy${extname}`;

                        const destinationFilePath = path.join('./public/uploads/chat', newFileName);
                        //fs.copyFile(sourceFilePath, destinationFilePath, (async (err) => {
                        // if (!err) {
                        //     console.log('File copied successfully', destinationFilePath);

                        await copyFile(sourceFilePath, destinationFilePath);

                        if (multiple_doc_id != "") {
                            console.log('working')
                            const [document_message_data] = await chatModel.forwardMessage(multiple_doc_id[i]);
                            console.log('parent_message_data-->', document_message_data);
                            parent_message = document_message_data[0].document_message;
                            //parent_message_user_id = document_message_data[0].parent_message_user_id;
                            //parent_message_user_name = document_message_data[0].parent_message_user_name;
                            parent_files = document_message_data[0].document_files;
                            parent_file_name = document_message_data[0].document_file_name;
                            parent_file_original_name = document_message_data[0].document_file_original_name;
                            parent_file_size = document_message_data[0].file_size;
                            parent_file_type = document_message_data[0].file_type;
                        }
                        const messageData = {
                            message: 'forward-file-uploaded',
                            files: parent_files,
                            file_name: parent_file_name,
                            file_original_name: parent_file_original_name,
                            file_size: parent_file_size,
                            file_type: parent_file_type,
                            group_id: group_id,
                            user_id: user_id,
                            //parent_message_id: multiple_doc_id[i],
                            // parent_message,
                            // parent_files,
                            // parent_file_name,
                            // parent_file_original_name,
                            // parent_message_user_name,
                            // parent_message_user_id,
                            message_readed_users: '[]',
                            file_downloaded_users: '[]'
                        }
                        const [createMessage] = await chatModel.createMessage(messageData);
                        if (createMessage.affectedRows > 0) {
                            const message_id = createMessage.insertId;
                            // console.log("message---", message_id)
                            const [getConnectedUsers] = await chatModel.getConnectedUsers(group_id);
                            const { user_ids } = getConnectedUsers[0];
                            console.log("userids----", user_ids)
                            let message_readed_users = JSON.parse(user_ids);
                            console.log('message_readed_users-->', message_readed_users);
                            const [readStatusUpdated] = await chatModel.updateReadedUserId(message_id, message_readed_users);
                            const [getGroupDetails] = await chatModel.getGroupDetailsByGroupId(group_id);
                            const { group_type, project_id, team_id } = getGroupDetails[0];
                            const data = {
                                group_type,
                                project_id,
                                team_id,
                                user_id,
                                type: 'create',
                                group_id
                            }
                            const getUnreadMessage = await chatController.getunreadMessageDetails(data);
                            chatNotification(group_id, message_id, user_id);
                            for (let k = 0; k < message_readed_users.length; k++) {
                                const connect_userId = message_readed_users[k];
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
                        // } else {
                        //     console.error('Error copying the file:', err);
                        // }
                        // }));

                    } else {
                        console.log('working message')
                        if (multiple_doc_id != "") {
                            console.log('working')
                            const [document_message_data] = await chatModel.forwardMessage(multiple_doc_id[i]);
                            console.log('parent_message_data-->', document_message_data);
                            parent_message = document_message_data[0].document_message;
                            parent_message_user_id = user_id
                            // parent_message_user_name = document_message_data[0].parent_message_user_name;
                            // parent_files = document_message_data[0].document_files;
                            // parent_file_name = document_message_data[0].document_file_name;
                            // parent_file_original_name = document_message_data[0].document_file_original_name;
                            // parent_file_size = document_message_data[0].file_size;
                            // parent_file_type = document_message_data[0].file_type;
                        }
                        const messageData = {
                            message: parent_message,
                            // files: parent_files,
                            // file_name: parent_file_name,
                            // file_original_name: parent_file_original_name,
                            // file_size: parent_file_size,
                            // file_type: parent_file_type,
                            group_id: group_id,
                            user_id: user_id,
                            //parent_message_id: multiple_doc_id[i],
                            // parent_message,
                            // parent_files,
                            // parent_file_name,
                            // parent_file_original_name,
                            // parent_message_user_name,
                            // parent_message_user_id,
                            message_readed_users: '[]',
                            file_downloaded_users: '[]'
                        }
                        const [createMessage] = await chatModel.createMessage(messageData);
                        if (createMessage.affectedRows > 0) {
                            const message_id = createMessage.insertId;
                            // console.log("message---", message_id)
                            const [getConnectedUsers] = await chatModel.getConnectedUsers(group_id);
                            const { user_ids } = getConnectedUsers[0];
                            console.log("userids-------", user_ids)
                            let message_readed_users = JSON.parse(user_ids);
                            console.log('message_readed_users-->', message_readed_users);
                            const [readStatusUpdated] = await chatModel.updateReadedUserId(message_id, message_readed_users);
                            console.log('reded-----', readStatusUpdated)
                            const [getGroupDetails] = await chatModel.getGroupDetailsByGroupId(group_id);
                            const { group_type, project_id, team_id } = getGroupDetails[0];
                            const data = {
                                group_type,
                                project_id,
                                team_id,
                                user_id,
                                type: 'create',
                                group_id
                            }
                            const getUnreadMessage = await chatController.getunreadMessageDetails(data);
                            chatNotification(group_id, message_id, user_id);
                            for (let k = 0; k < message_readed_users.length; k++) {
                                const connect_userId = message_readed_users[k];
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


                        //new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Documents"));
                    }
                }
                // if (i === multiple_doc_id.length - 1) {
                //     return multiple_doc_id;
                // }

            }
        }
        catch (error) {
            logger.error('forward message error is --->', error);
            // new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)

        }
    },

    async getgroupdetails(req, res) {
        try {
            const { user_id, project_type, project_id, team_id, group_id } = req.body
            const data = {
                user_id,
                project_type,
                project_id,
                team_id,
                group_id
            }

            const [group_member_list] = await chatModel.getGroupdetails(data)
            if (group_member_list.length > 0) {
                logger.info('Group details fetch successfully')
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Group details"), group_member_list);
            } else {
                new Response(res, StatusCodes.BAD_REQUEST)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Group details"), group_member_list);
            }
        }
        catch (error) {
            logger.error('get group details  error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)


        }
    },
    async getTeamprojectUsers(req, res) {
        try {
            const { group_type, team_id, project_id } = req.query
            const user_id = req.user.user_id
            const data = {
                project_id,
                team_id,
                group_type,
                user_id
            }


            const [group_member_list] = await chatModel.getTeamProjectUsers(data)
            console.log(group_member_list)
            const results = []
            if (group_member_list.length > 0) {
                for (let i = 0; i < group_member_list.length; i++) {

                    const result = {
                        id: group_member_list[i].id,
                        user_id: group_member_list[i].user_id,
                        team_id: group_member_list[i].team_id,
                        user_name: group_member_list[i].user_name,
                        project_id: group_member_list[i].project_id,
                        user_email: group_member_list[i].user_email,
                        user_mobile_no: group_member_list[i].user_mobile,
                        user_image: group_member_list[i].user_image,
                        group_type: group_type,
                        alreadyLinked: false,
                        group_name: null,
                        group_id: null

                    }
                    results.push(result)
                }
                logger.info('Group to be added users fetch successfully')
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("users "), results);
            } else {
                new Response(res, StatusCodes.BAD_REQUEST)._SuccessResponse(Message.Common.SuccessMessage.Fetch("users"), results);
            }
        }
        catch (error) {
            logger.error('get group users error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)


        }
    },

    async checkGroupexists(req, res) {
        try {
            const { group_name } = req.params
            console.log("------", group_name)
            const [getGroupName] = await chatModel.checkGroupExists(group_name);
            if (getGroupName.length === 0) {
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Group Name"), getGroupName);

            } else {
                logger.error('group name already exists');
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.AlreadyExists("Group Name"));
            }
        }
        catch (error) {
            logger.error('get group details  error is --->', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)


        }
    },







}
async function copyFile(sourceFilePath, destinationFilePath) {
    return new Promise((resolve, reject) => {
        fs.copyFile(sourceFilePath, destinationFilePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(destinationFilePath);
            }
        });
    });
}

module.exports = chatController;