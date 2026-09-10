const { StatusCodes } = require("http-status-codes")
const CommentsModel = require("../models/comments.model")
const { Role } = require("../user-management/dist/utils/roles")
const SpErrorHandler = require("../utils/error-handler")
const { Message } = require("../utils/messages")
const Response = require("../utils/response")
const jwt = require('jsonwebtoken')

const CommentsController = {
    async getConversations(req, res) {
        try {
            let {
                user_id,
            } = req.query

            let {
                user_id, role
            } = req.user

            if (role != Role.ADMIN) {
                user_id = id
            }

            let [messages] = await CommentsModel.findConversations({
                user_id
            })

            messages = messages.map(item => {
                if (item.replies)
                    item.replies = item.replies.filter(item => item.reply_message_id)

                return item
            })


            if (messages.length) {
                new Response(
                    res,
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Fetch("Conversations"),
                    messages
                )
            }
            else {
                new Response(
                    res,
                    StatusCodes.BAD_REQUEST
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoData,
                )
            }
        }
        catch (err) {
            new SpErrorHandler(res, err)
        }
    },
    async updateConversationToCompleted(req, res) {
        try {
            let {
                message_id,
            } = req.params




            let [messages] = await CommentsModel.updateById(message_id, {
                status: "COMPLETED"
            })

            if (messages.affectedRows) {
                new Response(
                    res,
                )._SuccessResponse(
                    Message.Common.SuccessMessage.Updation("Conversation"),
                    messages
                )
            }
            else {
                new Response(
                    res,
                    StatusCodes.BAD_REQUEST
                )._ErrorMessage(
                    Message.Common.FailureMessage.NoData,
                )
            }
        }
        catch (err) {
            new SpErrorHandler(res, err)
        }
    },
    MessageSocket: (io) => {



        io.use(function (socket, next) {
            // console.log(socket.handshake)
            if (socket.handshake.query && socket.handshake.query.token) {

                let user = jwt.decode(socket.handshake.query.token)


                socket.decoded = user
                console.log(user)
                if (user) {
                    // if (user.role == Role.ADMIN) {
                    //     socket.decoded = {
                    //         ...user,
                    //         ...{
                    //             chat_user_id: socket.handshake.query.user_id,
                    //             message_id: socket.handshake.query.message_id
                    //         }
                    //     }

                    // }
                    // else {
                    //     socket.decoded = {
                    //         ...user,
                    //         ...{
                    //             chat_user_id: user.id,
                    //             message_id: socket.handshake.query.message_id
                    //         }
                    //     }
                    //     // socket.decoded['chat_user_id'] = user.id
                    // }
                    socket.decoded = user

                    next();
                }
                else {
                    console.log("Authentication error")
                    next(new Error('Authentication error'));
                }

            }
            else {
                console.log("Authentication error")

                next(new Error('Authentication error'));
            }
        })


        io.on('connection', async function (socket) {

            console.log("Socket connected")
            try {


                let { id, role } = socket.decoded

                let message_id = null

                let chat_user_id = null
                if (role != Role.ADMIN) {
                    chat_user_id = id
                }

                var getConversations = async () => {


                    let [messages] = await CommentsModel.findConversations({
                        user_id: chat_user_id,
                        status: "IN_PROGRESS"
                    })

                    messages = messages.filter(item => {
                        if (item.replies)
                            item.replies = item.replies.filter(item => item.reply_message_id)
                        return item
                    })

                    if (messages) {
                        io.emit(`message`, {
                            status: true,
                            message: Message.Common.SuccessMessage.Fetch("Messages"),
                            data: messages,

                        })
                    }


                }
                getConversations()


                socket.on(`send-message`, async (data) => {

                    if (typeof data == 'string')
                        data = JSON.parse(data)

                    console.log(139, role, data)
                    try {

                        if (data.message_id) {
                            message_id = data.message_id
                        }

                        let message;

                        if (role == Role.ADMIN) {
                            [message] = await CommentsModel.createReply({
                                message: data.message,
                                user_read: 0,
                                admin_read: 1,
                                message_by: "ADMIN",
                                message_id: message_id
                            });

                            await CommentsModel.updateById(message_id, {
                                admin_read: 1,
                            })
                        }
                        else {
                            if (message_id) {
                                [message] = await CommentsModel.createReply({
                                    message: data.message,
                                    admin_read: 0,
                                    user_read: 1,
                                    message_by: "USER",
                                    message_id: message_id
                                })
                            }
                            else {
                                [message] = await CommentsModel.create({
                                    message: data.message,
                                    admin_read: 0,
                                    user_id: chat_user_id,
                                })
                            }

                            await CommentsModel.updateReplyByUserId(chat_user_id, {
                                user_read: 1,
                            })

                        }
                        if (role == Role.ADMIN) {
                            await CommentsModel.updateById(message_id, {
                                admin_read: 1
                            })
                        }
                        else {
                            await CommentsModel.updateReplyByUserId(chat_user_id)
                        }


                        if (message.affectedRows) {
                            getConversations()
                        }
                        else {
                            throw new Error(Message.Common.SuccessMessage.Send("Message"))
                        }
                    }

                    catch (err) {
                        console.log(err)
                        io.emit('message-error', {
                            status: false,
                            message: err.message
                        })
                    }

                })

                socket.on('update-message', async (data) => {
                    if (typeof data == 'string')
                        data = JSON.parse(data)


                    if (role == Role.ADMIN && data.message_id) {
                        await CommentsModel.updateById(data.message_id, {
                            status: "COMPLETED"
                        })
                        getConversations()
                    }
                })


                // socket.on(`read-message`, async () => {
                //     if (role == Role.ADMIN) {
                //         await CommentsModel.updateById(message_id, {
                //             admin_read: 1
                //         })
                //     }
                //     else {
                //         await CommentsModel.updateReplyByUserId(chat_user_id)
                //     }
                // })

                // socket.on(`read-reply`, async () => {
                //     if (role == Role.ADMIN) {
                //         await CommentsModel.updateReplyByMessageId(message_id)
                //     }
                //     else {
                //         await CommentsModel.updateReplyByUserId(chat_user_id)
                //     }
                // })

                socket.on('error', (data) => {
                    console.log(data)
                })




            }
            catch (err) {
                console.log(err)
                io.emit('message-error', Response.failureResponse(err.message))
            }


        });

    }
}





module.exports = CommentsController