/**
 * @author Ramesh sankar S
 * @email rameshsankar.s@skeintech.com
 * @create date 2023-11-01
 * @desc [description]
 */

const { database } = require('../config/database');
const QueryGenerator = require('../generators/query.generator');
const { Group_type, Group_file_type } = require('../utils/chat');

const meetingModel = {
    async createMeeting(data) {
        return await database.connection.promise().query(QueryGenerator.insert("meetings", data))
    },
    async updateMeeting(updateData, meeting_id) {

        let query = `update meetings set start='${updateData.start}',end='${updateData.end}' where meeting_id = ${meeting_id}`
        return await database.connection.promise().query(query)
    },
    async fetchMeeting(meeting_id) {
        const query = `select * from meetings WHERE meeting_id = ${meeting_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async upcomingMeeting(date, dates, email_id) {
        console.log('work')
        if (dates) {
            console.log('working1')
            const query = `SELECT 
            * 
        FROM 
            meetings 
        WHERE 
            end >= CONCAT('${dates}',' ' ,TIME(Now()))
            AND ('${email_id}' = invitee_email OR JSON_CONTAINS(guest_email, '\"${email_id}\"'))
        ORDER BY 
            start ASC;`

            return await database.connection.promise().query(QueryGenerator.format(query))
        } else {
            const currentDate = new Date();
            const targetDate = new Date(date);
            if(  currentDate.getFullYear() === targetDate.getFullYear() &&
            currentDate.getMonth() === targetDate.getMonth() && // getMonth() returns 0-based index, so September is 8
            currentDate.getDate() === targetDate.getDate() ){
                console.log("current Date")
                const query = `SELECT * FROM meetings WHERE DATE(end) = '${date}'
                AND end < CONCAT('${date}',' ' ,TIME(Now()))
                AND ('${email_id}' = invitee_email OR JSON_CONTAINS(guest_email, '\"${email_id}\"'))
                ORDER BY start ASC;`
                return await database.connection.promise().query(QueryGenerator.format(query))
            }else{
                console.log("Not current Date")
                const query = `SELECT * FROM meetings WHERE DATE(end) = '${date}'
                AND ('${email_id}' = invitee_email OR JSON_CONTAINS(guest_email, '\"${email_id}\"'))
                ORDER BY start ASC;`
                return await database.connection.promise().query(QueryGenerator.format(query))
            }
        }
    },
    async meetingDetails(meeting_type, meeting_type_id) {

        if (meeting_type == 'Project' || meeting_type == 'project') {
            const query = `select * FROM projects where project_id = ${meeting_type_id}`
            return await database.connection.promise().query(QueryGenerator.format(query))
        } else {
            const query = `select * FROM teams where team_id = ${meeting_type_id}`
            return await database.connection.promise().query(QueryGenerator.format(query))
        }
    },
    async upcomingHistory(meetingType, meetingTypeId) {
        console.log("-----type", meetingType, meetingTypeId)
        if (meetingType == 'Project' || meetingType == 'project') {
            const query = `select * FROM projects where project_id = ${meetingTypeId}`
            return await database.connection.promise().query(QueryGenerator.format(query))
        } else {
            const query = `select * FROM teams where team_id = ${meetingTypeId}`
            return await database.connection.promise().query(QueryGenerator.format(query))
        }

    },
    async calendarDetails(type, user_ids, provider) {
        const query = `SELECT  t1.calendar_id, t1.imeetify_calendar_id, t1.type, t1.calendar_title, t1.calendar_description, 
        t1.calendar_duration, t1.calendar_type, t1.calendar_weekdays, t1.calendar_weekend, t1.calendar_link, 
        t1.calendar_timezone, t1.calendar_status, t1.configuration_id, t2.api_key, t2.user_id, t2.user_email,u.name,
        u.email,u.mobile_no,u.user_id
        
    FROM 
        imeetify_calendar t1
    JOIN 
        imeetify_configuration t2
    ON 
        t1.configuration_id = t2.configuration_id
        
        JOIN
        users u ON t2.user_id=u.user_id
        
        where type=${type} AND t2.user_id=${user_ids} AND provider=${provider}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async deleteMeeting(meeting) {
        const query = `delete from meetings where imeetify_meeting_id='${meeting}'`
        return await database.connection.promise().query(QueryGenerator.format(query))

    },
    async accessDetails(user_id) {
        const query = `select * FROM imeetify_configuration where user_id = ${user_id}`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async meetingUserDetails(data) {

        const query = `SELECT
       u.device_token,
       u.name,
       u.user_id
       
   FROM
       meetings m
   JOIN
       users u
   ON
       JSON_CONTAINS(m.guest_email, JSON_QUOTE(u.email)) = 1
   WHERE
       m.meeting_id =${data.meeting_id}`
        console.log(query)
        return await database.connection.promise().query(QueryGenerator.format(query));
    },
    async fetchMeetings(meeting) {
        const query = `select * FROM meetings where imeetify_meeting_id ='${meeting}'`
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async fetchAllTeams(created_by) {
        const query = `select DISTINCT t.team_id,team_name,description,created_by,(select count(*) from teams_users 
        where team_id = t.team_id and project_id is null) as users, (select count(*) from teams_project 
        where team_id = t.team_id) as projects,unmc.user_id as un_readed_user_id from teams t 
        left join un_read_message_details unmc on unmc.team_id = t.team_id
        where created_by = '${created_by}' order by team_name ASC`
        return await database.connection.promise().query(QueryGenerator.format(query))

    },
    async fetchAllProjects(created_by) {
        const query = `SELECT p.project_id,p.project_name,p.project_img,p.city,p.state,p.latitude,p.longitude,
        p.address,p.status,p.start_date,p.end_date,p.description,unmc.user_id as un_readed_user_id
        FROM projects p 
        LEFT JOIN un_read_message_details unmc on unmc.project_id = p.project_id
        where created_by = "${created_by}" ORDER by p.project_name ASC`
        return await database.connection.promise().query(QueryGenerator.format(query))

    },
    async getImeetifyIntegration(user_id) {
        const query = `select t1.provider_name,t1.provider,t1.user_id from imeetify_integration t1
	    JOIN imeetify_configuration t2
        ON t1.user_id = t2.user_id
        where t1.user_id = ${user_id};`
        return await database.connection.promise().query(QueryGenerator.format(query))

    }







}








module.exports = meetingModel;