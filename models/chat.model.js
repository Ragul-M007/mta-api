/**
 * @author Ramesh sankar S
 * @email rameshsankar.s@skeintech.com
 * @create date 2023-11-01
 * @desc [description]
 */

const { database } = require('../config/database');
const QueryGenerator = require('../generators/query.generator');
const { Group_type, Group_file_type } = require('../utils/chat');

const chatModel = {
    async createGroup(groupData) {
        return await database.connection.promise().query(QueryGenerator.insert("group_details", groupData))
    },
    async getGroups(groupData) {
        let query;
        if (groupData.group_type === Group_type.Type_1) {
            query = `select * from group_details where project_id = ${groupData.project_id} order by group_id ASC`
        } else if (groupData.group_type === Group_type.Type_2) {
            query = `select * from group_details where team_id = ${groupData.team_id} order by group_id ASC`
        }
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getGroupDetails(groupData) {
        let query;
        if (groupData.group_type === Group_type.Type_1) {
            query = `select distinct gd.*,
            (SELECT COUNT(message_id) as unread_message_count FROM messages m WHERE NOT JSON_CONTAINS(m.message_readed_users, '${groupData.user_id}') and m.group_id = gd.group_id and m.all_users_readed IS NULL ) as unread_message_count
            from group_details gd 
            join group_members gm on gm.group_id = gd.group_id
            join users u on u.user_id = gm.user_id
            where project_id = ${groupData.project_id}
            and u.user_id = ${groupData.user_id}
            order by gd.group_id ASC;`
        } else if (groupData.group_type === Group_type.Type_2) {
            query = `select distinct gd.*,
            (SELECT COUNT(message_id) as unread_message_count FROM messages m WHERE NOT JSON_CONTAINS(m.message_readed_users, '${groupData.user_id}') and m.group_id = gd.group_id and m.all_users_readed IS NULL ) as unread_message_count
            from group_details gd 
            join group_members gm on gm.group_id = gd.group_id
            join users u on u.user_id = gm.user_id
            where team_id = ${groupData.team_id} 
            and u.user_id = ${groupData.user_id}
            order by gd.group_id ASC;`
        }
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getTotalUnReadMessageCount(groupData) {
        let query;
        if (groupData.group_type === Group_type.Type_1) {
            query = `select sum(unread_message_count) as totalUnReadMessageCount from (select distinct gd.group_id,
                (SELECT COUNT(message_id) as unread_message_count FROM messages m WHERE NOT JSON_CONTAINS(m.message_readed_users, '${groupData.user_id}') and m.group_id = gd.group_id ) as unread_message_count
                from group_details gd 
                join messages m on m.group_id = gd.group_id
                join group_members gm on gm.group_id = gd.group_id
                join users u on u.user_id = gm.user_id
                where project_id = ${groupData.project_id}
                and u.user_id = ${groupData.user_id}
                order by gd.group_id ASC ) as counts`
        } else if (groupData.group_type === Group_type.Type_2) {
            query = `select sum(unread_message_count) as totalUnReadMessageCount from (select distinct gd.group_id,
                (SELECT COUNT(message_id) as unread_message_count FROM messages m WHERE NOT JSON_CONTAINS(m.message_readed_users, '${groupData.user_id}') and m.group_id = gd.group_id ) as unread_message_count
                from group_details gd 
                join messages m on m.group_id = gd.group_id
                join group_members gm on gm.group_id = gd.group_id
                join users u on u.user_id = gm.user_id
                where team_id = ${groupData.team_id} 
                and u.user_id = ${groupData.user_id}
                order by gd.group_id ASC ) as counts`
        }
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async updateGroup(groupData, group_id) {
        let query = QueryGenerator.update('group_details', groupData, { group_id })
        return await database.connection.promise().query(query)
    },
    async getAllGroupDetails() {
        let query = `select * from group_details`;
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getGroupDetailsByGroupId(group_id) {
        let query = `select * from group_details where group_id = ${group_id}`;
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getUsersByGroupId(group_id) {
        let query = `select u.name as user_name,u.email as user_email,u.mobile_no as user_mobile_no,u.user_img as user_image,u.device_token as token,
                    gd.group_name,gd.group_id,u.user_id,gd.project_id,gd.team_id,gd.group_type,u.group_create_access
                    from group_details gd
                    join group_members gm on gm.group_id = gd.group_id
                    join users u on u.user_id = gm.user_id
                    where gd.group_id = ${group_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getUsersByProjectId(project_id, group_id) {
        let query = `select distinct u.user_id,u.name
        from group_details gd
        join group_members gm on gm.group_id = gd.group_id
        join users u on u.user_id = gm.user_id
        where gd.project_id = ${project_id}
        and gd.group_id = ${group_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getUsersByTeamId(team_id, group_id) {
        let query = `select distinct u.user_id,u.name
        from group_details gd
        join group_members gm on gm.group_id = gd.group_id
        join users u on u.user_id = gm.user_id
        where gd.team_id = ${team_id}
        and gd.group_id = ${group_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getUsers(groupData) {
        let query;
        if (groupData.group_type === Group_type.Type_1) {
            query = `select distinct u.name as user_name,u.email as user_email,u.mobile_no as user_mobile_no,u.user_img as user_image,
                    gd.group_name,gd.group_id,u.user_id,gd.project_id,gd.team_id,gd.group_type
                    from users u
                    join category_project_xref cpx on cpx.user_id = u.user_id
                    join group_details gd on gd.project_id = cpx.project_id
                    join projects p on p.project_id = gd.project_id
                    where gd.group_id = ${groupData.group_id} and u.role_id != 1 Order BY u.name ASC`
        } else if (groupData.group_type === Group_type.Type_2) {
            query = `select t.id, t.team_id, u.name as user_name, u.email as user_email,u.mobile_no as user_mobile_no,u.user_img  as user_image,
                    gd.group_name,gd.group_id,u.user_id,gd.project_id,gd.team_id,gd.group_type from teams_users t 
                    inner join users u on t.user_id = u.user_id 
                    join group_details gd on gd.team_id = t.team_id
                    where group_id = ${groupData.group_id}
                    and t.project_id is null Order by u.name ASC;`
        }
        return await database.connection.promise().query(QueryGenerator.format(query));
    },
    async getProjectManagerDetails(groupData) {
        let query;
        if (groupData.group_type === Group_type.Type_1) {
            query = `select distinct u.name as user_name,u.email as user_email,u.mobile_no as user_mobile_no,u.user_img as user_image,
                    gd.group_name,gd.group_id,u.user_id,gd.project_id,gd.team_id,gd.group_type
                    from users u
                    join category_project_xref cpx on cpx.user_id = u.user_id
                    join group_details gd on gd.project_id = cpx.project_id
                    join projects p on p.project_id = gd.project_id
                    join available_categories ac on ac.category_id = u.prof
                    where gd.group_id = ${groupData.group_id} and u.role_id != 1 
                    and ac.category_name IN ('PROJECT MANAGER')
                    Order BY u.name ASC;`
        } else if (groupData.group_type === Group_type.Type_2) {
            query = `select t.id, t.team_id, u.name as user_name, u.email as user_email,u.mobile_no as user_mobile_no,u.user_img  as user_image,
                    gd.group_name,gd.group_id,u.user_id,gd.project_id,gd.team_id,gd.group_type from teams_users t 
                    inner join users u on t.user_id = u.user_id 
                    join group_details gd on gd.team_id = t.team_id
                    join available_categories ac on ac.category_id = u.prof
                    where group_id = ${groupData.group_id}
                    and ac.category_name IN ('PROJECT MANAGER')
                    and t.project_id is null Order by u.name ASC;`
        }
        return await database.connection.promise().query(QueryGenerator.format(query));
    },
    async addUsersInGroup(userData) {
        return await database.connection.promise().query(QueryGenerator.insert("group_members", userData))
    },
    async checkUserInGroup(data) {
        let query = `select gm.user_id from group_members gm where gm.group_id = ${data.group_id} and gm.user_id = ${data.user_id}`
        return await database.connection.promise().query(QueryGenerator.format(query));
    },
    async GetAllAdmin() {
        let query = QueryGenerator.format(`select user_id from users where role_id in(1)`)
        return await database.connection.promise().query(query)
    },
    async GetChatDefaultUsers() {
        let query = QueryGenerator.format(`select u.user_id,u.name,u.role_id,u.user_img,u.group_create_access,ac.category_name from users u 
        JOIN user_roles ur on u.role_id = ur.role_id 
        join available_categories ac on ac.role_id = ur.role_id 
        where ur.role_id in (2) and u.group_create_access = 1 
        and u.role_id = ac.role_id and ac.category_id = u.prof 
        and ac.category_name IN ('ARCHITECT','CHIEF ARCHITECT');`)
        return await database.connection.promise().query(query)
    },
    async createMessage(messageData) {
        console.log('messageData-->', messageData)
        return await database.connection.promise().query(QueryGenerator.insert("messages", messageData))
    },
    async getMessagesByGroupId(messageData) {
        console.log('messageData-->', messageData)
        let query = `select m.message_id,m.message,m.files,m.file_name,m.file_original_name,m.file_size,m.file_type,m.group_id,u.user_id,u.name as user_name,m.parent_message_id,parent_message,parent_files,parent_file_name,parent_file_original_name,parent_message_user_name,parent_message_user_id,m.is_downloaded,m.message_readed_users,m.file_downloaded_users,m.created_at,m.updated_at 
                    from messages m 
                    join users u on u.user_id = m.user_id 
                    where group_id = ${messageData.group_id}
                    order by message_id DESC 
                    LIMIT ${messageData.message_limit};`
        return await database.connection.promise().query(QueryGenerator.format(query));
    },
    async getMessagesByGroupIdForUpdateUserId(messageData) {
        console.log('messageData-->', messageData)
        let query = `select m.message_id,m.message,gd.team_id,gd.project_id,gd.group_type,m.files,m.file_name,m.file_original_name,m.file_size,m.file_type,m.group_id,u.user_id,u.name as user_name,m.parent_message_id,parent_message,parent_files,parent_file_name,parent_file_original_name,parent_message_user_name,parent_message_user_id,m.is_downloaded,m.message_readed_users,m.file_downloaded_users,m.created_at,m.updated_at 
                    from messages m 
                    join users u on u.user_id = m.user_id 
                    join group_details gd on gd.group_id = m.group_id
                    where gd.group_id = ${messageData.group_id}
                    order by message_id DESC
                    LIMIT 200;`

        // let query =`select m.message_id,m.message,m.files,m.file_name,m.file_original_name,m.file_size,m.file_type,m.group_id,u.user_id,u.name as user_name,m.parent_message_id,parent_message,parent_files,parent_file_name,parent_file_original_name,parent_message_user_name,parent_message_user_id,m.is_downloaded,m.message_readed_users,m.file_downloaded_users,m.created_at,m.updated_at 
        // from messages m 
        // join users u on u.user_id = m.user_id 
        // where group_id = ${messageData.group_id}
        // order by message_id ASC
        // LIMIT ${messageData.message_limit};`
        return await database.connection.promise().query(QueryGenerator.format(query));
    },
    // Pagination added in get message by Group Id in only API
    async getMessagesByGroupIdInAPI(messageData) {
        console.log('messageData-->', messageData)
        let query = `select m.message_id,m.message,m.files,m.file_name,m.file_original_name,m.file_size,m.file_type,m.group_id,u.user_id,u.name as user_name,m.parent_message_id,parent_message,parent_files,parent_file_name,parent_file_original_name,parent_message_user_name,parent_message_user_id,m.is_downloaded,m.message_readed_users,m.file_downloaded_users,m.created_at,m.updated_at 
                    from messages m 
                    join users u on u.user_id = m.user_id 
                    where group_id = ${messageData.group_id}
                    order by message_id DESC 
                    LIMIT ${messageData.Chat_message_limit} OFFSET ${messageData.message_offset_value};`
        return await database.connection.promise().query(QueryGenerator.format(query));
    },
    async messageByMessageId(message_id) {
        let query = `select m.message_id,m.message,m.files,m.file_name,m.file_original_name,m.file_size,m.file_type,m.group_id,u.user_id,u.name as user_name,m.parent_message_id,parent_message,parent_files,parent_file_name,parent_file_original_name,parent_message_user_name,parent_message_user_id,m.is_downloaded,m.message_readed_users,m.file_downloaded_users,m.created_at,m.updated_at 
                    from messages m 
                    join users u on u.user_id = m.user_id 
                    where message_id = ${message_id}
                    order by message_id ASC`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async readerUserByMessageId(message_id) {
        let query = `select m.message_id,m.message,m.files,m.file_name,m.file_original_name,m.file_size,m.file_type,m.group_id,u.user_id,u.name as user_name,m.parent_message_id,parent_message,parent_files,parent_file_name,parent_file_original_name,parent_message_user_name,parent_message_user_id,m.is_downloaded,m.message_readed_users,m.file_downloaded_users,m.created_at,m.updated_at 
                    from messages m 
                    join users u on u.user_id = m.user_id 
                    where message_id = ${message_id}
                    order by message_id ASC`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async messageByParentMessageId(message_id) {
        let query = `select m.message_id as parent_message_id,m.message as parent_message,m.files as parent_files,m.file_name as parent_file_name,m.file_original_name as parent_file_original_name,m.file_size,m.file_type,m.group_id,u.user_id as parent_message_user_id,u.name as parent_message_user_name,m.is_downloaded,m.message_readed_users,m.created_at,m.updated_at 
                    from messages m 
                    join users u on u.user_id = m.user_id 
                    where message_id = ${message_id}
                    order by message_id ASC`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async updateFileDownloadStatus(message_id, file_downloded_user_ids) {
        let query = `update messages set file_downloaded_users='[${file_downloded_user_ids}]' where message_id = ${message_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async updateReadedUserId(message_id, message_readed_user) {
        console.log('message_readed_user-->model', message_readed_user)
        let query = `update messages set message_readed_users='[${message_readed_user}]' where message_id = ${message_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async updateAllUserReaded(message_id) {
        let query = `update messages set all_users_readed =1 where message_id = ${message_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getConnectedUsers(group_id) {
        let query = `select user_ids from socket_connected_users where group_id = ${group_id}`
        return await database.connection.promise().query(QueryGenerator.format(query));
    },
    async createConnectedUser(userData) {
        let query = `insert into socket_connected_users (group_id,user_ids) values (${userData.group_id},'[${userData.user_ids}]')`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async updateConnectedUser(userData) {
        let query = `update socket_connected_users set user_ids='[${userData.user_ids}]' where group_id = ${userData.group_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getMessageCount(group_id, user_id) {
        let query = `SELECT COUNT(message_id) as unread_message_count FROM messages WHERE group_id = ${group_id} AND NOT JSON_CONTAINS(message_readed_users, '${user_id}')`;
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getGroupFiles(groupData) {
        let query;
        if (groupData.file_type === Group_file_type.Type_1) {
            query = `select message_id,files,file_name,file_original_name,file_size,file_type,created_at from messages where group_id = ${groupData.group_id} and file_type = '${groupData.file_type}' and JSON_CONTAINS(file_downloaded_users,'${groupData.user_id}') order by message_id DESC`
        } else if (groupData.file_type === Group_file_type.Type_2) {
            query = `select message_id,files,file_name,file_original_name,file_size,file_type,created_at from messages where group_id = ${groupData.group_id} and file_type = '${groupData.file_type}' and JSON_CONTAINS(file_downloaded_users,'${groupData.user_id}') order by message_id DESC`
        } else if (groupData.file_type === Group_file_type.Type_3) {
            query = `select message_id,files,file_name,file_original_name,file_size,file_type,created_at from messages where group_id = ${groupData.group_id} and file_type IN ('${Group_file_type.Type_3}','${Group_file_type.Type_4}') and JSON_CONTAINS(file_downloaded_users,'${groupData.user_id}') order by message_id DESC`
        } else if (groupData.file_type === Group_file_type.Type_4) {
            query = `select message_id,files,file_name,file_original_name,file_size,file_type,created_at from messages where group_id = ${groupData.group_id} and file_type = '${groupData.file_type}' and JSON_CONTAINS(file_downloaded_users,'${groupData.user_id}') order by message_id DESC`
        } else {
            query = `select message_id,files,file_name,file_original_name,file_size,file_type,created_at from messages where group_id = ${groupData.group_id} and file_type = 'others' and JSON_CONTAINS(file_downloaded_users,'${groupData.user_id}') order by message_id DESC`
        }
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async groupCreateAccessDetails(user_id) {
        let query = `select user_id,group_create_access from users where user_id=${user_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async deleteGroup(group_id, user_id) {
        let query = `
        delete from messages where group_id=${group_id};
        delete from group_members where group_id=${group_id};
        delete  g from group_details g
        JOIN users u ON g.group_created_by = u.user_id
        where g.group_id = ${group_id}
        AND (g.group_created_by = ${user_id}
        OR u.group_create_access = 1)`;
        console.log(query)
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async deleteMessage(message_id) {
        let query = `delete from messages where message_id=${message_id};`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async removeUserInGroup(userData) {
        let query = `delete from group_members where user_id IN (${userData.user_id}) and group_id=${userData.group_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async addUnreadMessageDetails(messagesData) {
        console.log('messagesData-->', messagesData)
        let query = `insert into un_read_message_details (project_id,team_id,user_id,group_type) values (${messagesData.project_id},${messagesData.team_id},'[${messagesData.user_id}]','${messagesData.group_type}')`
        return await database.connection.promise().query(query)
    },
    async updateUnreadMessageDetails(messagesData, id) {
        let query = `update un_read_message_details set user_id='[${messagesData.user_id}]' where id = ${id}`
        return await database.connection.promise().query(query)
    },
    async getUnreadMessageDetails(messagesData) {
        let query;
        console.log('messagesData-->', messagesData)
        if (messagesData.group_type == Group_type.Type_1) {
            query = `select * from un_read_message_details WHERE project_id = ${messagesData.project_id}`
        } else if (messagesData.group_type == Group_type.Type_2) {
            query = `select * from un_read_message_details WHERE team_id = ${messagesData.team_id}`
        }
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getDocumentId(multiple_doc_id) {
        let query = `select * from messages where message_id=${multiple_doc_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async forwardMessage(multiple_doc_id) {
        let query = `select m.message_id as document_id,m.message as document_message,m.files as document_files,m.file_name as document_file_name,m.file_original_name as document_file_original_name,m.file_size,m.file_type,m.group_id,u.user_id as parent_message_user_id,u.name as parent_message_user_name,m.is_downloaded,m.message_readed_users,m.created_at,m.updated_at 
                    from messages m 
                    join users u on u.user_id = m.user_id 
                    where message_id = ${multiple_doc_id}
                    `
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getGroupdetails(data) {

        if (data.user_id && !data.project_id && !data.team_id) {
            console.log('working')
            const query = `SELECT gm.group_member_id,gm.group_id,gm.user_id,gm.created_at AS group_member_created_at,
        gm.updated_at AS group_member_updated_at,g.group_name,g.group_description,g.group_image,g.group_type,
        g.project_id,g.group_created_by,g.created_at AS group_created_at,g.updated_at AS group_updated_at,g.team_id
    FROM 
        group_members gm
    JOIN 
        group_details g ON gm.group_id = g.group_id
    WHERE 
        gm.user_id = ${data.user_id} AND NOT g.group_id=${data.group_id};`
            return await database.connection.promise().query(QueryGenerator.format(query))


        } else if (data.user_id && data.project_id) {
            console.log('working1')
            const query = `SELECT gm.group_member_id,gm.group_id,gm.user_id,gm.created_at AS group_member_created_at,gm.updated_at AS group_member_updated_at,
    g.group_name,g.group_description,g.group_image,g.group_type,g.project_id,g.group_created_by,g.created_at AS group_created_at,
    g.updated_at AS group_updated_at,
    g.team_id
FROM group_members gm
JOIN group_details g ON gm.group_id = g.group_id
WHERE g.project_id = ${data.project_id} AND gm.user_id = ${data.user_id} AND NOT g.group_id=${data.group_id};`
            return await database.connection.promise().query(QueryGenerator.format(query))

        } else {
            console.log(data.user_id)
            const query = `SELECT gm.group_member_id,gm.group_id,gm.user_id,gm.created_at AS group_member_created_at,gm.updated_at AS group_member_updated_at,
    g.group_name,g.group_description,g.group_image,g.group_type,g.project_id,g.group_created_by,g.created_at AS group_created_at,
    g.updated_at AS group_updated_at,
    g.team_id
FROM group_members gm
JOIN group_details g ON gm.group_id = g.group_id
WHERE g.team_id = ${data.team_id} AND gm.user_id = ${data.user_id} AND NOT g.group_id=${data.group_id} `
            return await database.connection.promise().query(QueryGenerator.format(query))
        }
    },
    async getTeamProjectUsers(data) {
        let query;
        if (data.group_type === Group_type.Type_1 && data.project_id) {
            query = QueryGenerator.format(`select distinct u.name as user_name,u.email as user_email,
            u.mobile_no as user_mobile_no,u.user_img as user_image,u.user_id,p.project_id,null as team_id
            from users u
            join category_project_xref cpx on cpx.user_id = u.user_id
            join projects p on p.project_id = cpx.project_id
            where p.project_id = ${data.project_id} and u.role_id != 1 and not u.user_id=${data.user_id} Order BY u.name ASC`);
        } else if (data.group_type === Group_type.Type_2 && data.team_id) {
            query = QueryGenerator.format(`select t.id, t.user_id, t.team_id, u.name as user_name,null as project_id, 
            u.email as user_email,u.mobile_no as user_mobile,u.user_img as user_image from teams_users t inner join users u
             on t.user_id = u.user_id where team_id = ${data.team_id} and t.project_id is null and not u.user_id=${data.user_id}`);
        }

        return await database.connection.promise().query(query)
    },
    async checkGroupExists(group_name) {
        let query = `select * from group_details where group_name ='${group_name}'`;
        return await database.connection.promise().query(QueryGenerator.format(query))
    },







}

module.exports = chatModel;