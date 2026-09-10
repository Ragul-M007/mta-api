const QueryGenerator = require("../generators/query.generator")
const { Role } = require("../user-management/dist/utils/roles")
const database = require("../utils/database")


const HelpDeskModel = {
    create(help_desk) {
        return database.promise().query(QueryGenerator.insert('sp_help_desk_messages', help_desk))
    },

    updateById(id, help_desk) {
        return database.promise().query(QueryGenerator.update('sp_help_desk_messages', help_desk, {
            id: id
        }))
    },


    createReply(help_desk) {
        return database.promise().query(QueryGenerator.insert('sp_help_desk_replies', help_desk))
    },

    updateReplyByUserId(user_id) {
        return database.promise().query(QueryGenerator.format(`UPDATE sp_help_desk_replies SET user_read =1 WHERE message_id in (SELECT id FROM sp_help_desk_messages WHERE user_id = :user_id) `, {
            user_id
        }))
    },
    updateReplyByMessageId(message_id) {
        return database.promise().query(QueryGenerator.format(`UPDATE sp_help_desk_replies SET user_read =1 WHERE message_id = :message_id `, {
            message_id
        }))
    },
    findConversations({
        user_id,
        status
    }) {

        let group = [], order = [], cond = [], limit = [];

        if (user_id) {
            order.push(`ORDER BY am.message_on ASC, m.message_on DESC`)
            limit.push(`LIMIT 1`)
            group.push(`GROUP BY m.id`)
            cond.push(` m.user_id  = :user_id `)
        }
        else {
            order.push(`ORDER BY m.message_on DESC,am.message_on ASC`)
            group.push(`GROUP BY m.id`)
        }

        if (status) {
            cond.push(` m.status  = :status `)
        }


        group = group.length ? `  ${group.join()}` : ``
        order = order.length ? `  ${order.join()}` : ``
        limit = limit.length ? `  ${limit.join()}` : ``
        cond = cond.length ? `WHERE ${cond.join(' AND ')}` : ``
        return database.promise().query(QueryGenerator.format(`
        SELECT m.id as message_id , m.status , m.user_id , IFNULL(u.first_name, '') as name, IFNULL(up.picture , '')  as picture, (SELECT role_type from sp_roles WHERE id = u.role_id) as role , m.admin_read, m.message  , m.message_on,

        CASE WHEN (SELECT role_type from sp_roles WHERE id = u.role_id) = 'USER' THEN
        (SELECT    gym.first_name as gym_name   FROM sp_user_parent_xref 
        JOIN sp_users usr ON usr.id = sp_user_parent_xref.parent_id
        JOIN sp_vending_gym_xref xgym ON xgym.vending_machine_id = (SELECT id FROM sp_vending_machines WHERE vending_machine_id= usr.id)
        JOIN sp_users gym ON gym.id = xgym.gym_id
        JOIN sp_user_profile profile on profile.user_id = xgym.gym_id WHERE sp_user_parent_xref.user_id = u.id GROUP BY usr.id)
        ELSE 
        (SELECT first_name FROM sp_users WHERE id = (SELECT parent_id FROM sp_user_parent_xref WHERE user_id = u.id))  
        END as gym_name,
       CAST(
           CONCAT(
               '[',
               GROUP_CONCAT(
                JSON_OBJECT(
                    'reply_message_id',
                    am.id,
                    'user_read',
                    am.user_read,
                    'admin_read',
                    am.admin_read,
                    'message',
                    am.message,
                    'message_by',
                    am.message_by,
                    'message_on',
                    am.message_on
                   
                )
            ) ,
            ']'
           ) as JSON
       )  as replies
       FROM sp_help_desk_messages m
       LEFT JOIN sp_help_desk_replies am ON m.id = am.message_id
        JOIN sp_users  u ON u.id = m.user_id
        JOIN sp_user_profile   up ON u.id = up.user_id
        ${cond} ${group} ${order} ${limit} `, {
            user_id,
            status
        }))
    },
    findMessagesAndReplies({
        user_id,
    }) {

        let cond = [], group = [], order = []

        if (user_id) {
            cond.push(`m.user_id = :user_id`)
            order.push(`ORDER BY message_on ASC`)
        }
        else {
            order.push(`ORDER BY message_on DESC`)
        }
        group.push(`GROUP BY m.id`)





        cond = cond.length ? ` WHERE ${cond.join(' AND ')}` : ``
        group = group.length ? `  ${group.join()}` : ``
        order = order.length ? `  ${order.join()}` : ``

        return database.promise().query(QueryGenerator.format(`
        SELECT m.id as message_id , m.user_id , IFNULL(u.first_name, '') as name, IFNULL(up.picture , '')  as picture, 
        (SELECT role_type from sp_roles WHERE id = u.role_id) as role , m.admin_read, type, message  , message_on,
        GROUP_CONCAT(
            JSON_OBJECT(
                'admin_message_id',
                am.id,
                'user_read',
                am.user_read,
                'message',
                am.message
                'message_on',
                am.message_on
            )
        ) FROM sp_help_desk_messages m
        JOIN sp_help_desk_replies m ON m.id = am.message_id
        JOIN sp_users  u ON u.id = m.user_id
        JOIN sp_user_profile   up ON u.id = up.user_id
        ${cond} ${group} ${order} `, {
            user_id
        }))
    }
}

module.exports = HelpDeskModel