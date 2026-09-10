/**
 * @author Sameena Begum S
 * @email sameenabegum.s@skeintech.com
 * @create date 2024-08-21
 * @desc [description]
 */

const express = require('express');
const { Message } = require("../utils/messages");
const Response = require("../utils/response");
const AppErrorHandler = require("../utils/error-handler");
const { StatusCodes } = require("http-status-codes");
const logger = require('../utils/winston');
const meetingModel = require('../models/meeting.model');
const path = require('path');
const { toLower } = require('lodash');

const UserModel = require('../models/user.model');
const { Chat_message_limit, Group_type } = require('../utils/chat');
const { log, group, error } = require('console');
const { type } = require('os');
const { json } = require('body-parser');
const { chatNotification, forwardNotification, meetingNotification } = require("../utils/push-notification");
const fs = require('fs');
const { getMaxListeners } = require('process');
const axios = require('axios');
const { request } = require('http');
require('dotenv').config();



const chatController = {
    async createMeeting(req, res) {
        try {
            logger.info('createMeeting method called')
            let { title, description, start, end, type, invitee_timezone, provider, location, guests_email, meeting_type, meeting_type_id } = req.body;
            const userDetails = req.user
            const user_ids = userDetails.user_id


            const [calendardetails] = await meetingModel.calendarDetails(type, user_ids, provider)

            //const user_id = calendardetails[0].user_id
            const guest_email = [...new Set(guests_email)]
            let guest = {};
            guest_email.forEach((email, index) => {
                guest[`guest[${index}][email]`] = email;
            })

            //const nameParts = calendardetails[0].name.split(' ');
            const firstName = calendardetails[0].name
            const lastName = "Mta"


            // const calendarType = JSON.parse(calendardetails[0].calendar_type);
            // console.log("-----",calendarType)

            // if (calendarType.calendarType === 'Online' ||calendarType.calendarType ==='In person') {
            //     provider = 2;
            // } else {
            //     console.log('provider else working')
            //     provider = 2;
            // }

            if (req.body.type === "2") {
                location = 'location'
            } else {
                location = req.body.location
            }
            const value = {
                "title": title,
                "description": description,
                "start": start,
                "end": end,
                "type": calendardetails[0].type,
                "invitee_timezone": invitee_timezone,
                "provider": provider,
                "location": location,
                "calendar": calendardetails[0].imeetify_calendar_id,
                "invitee[mobile]": `91-${calendardetails[0].mobile_no}`,
                "invitee[first_name]": firstName,
                "invitee[last_name]": lastName,
                "invitee[email]": calendardetails[0].email,
                ...guest
            }

            //console.log(value)
            // const imeetifyResponse = await axios.post('https://imeetify.com/api/v1/appointment/create', {
            //     params:
            //         // title: title,
            //         // description: description,
            //         // start: start,
            //         // end: end,
            //         // type: calendardetails[0].type,
            //         // invitee_timezone: invitee_timezone,
            //         // provider: provider,
            //         // location: location,
            //         // calendar: calendardetails[0].imeetify_calendar_id,
            //         // "invitee[mobile]":`91-${calendardetails[0].mobile_no}`,
            //         // "invitee[first_name]": firstName,
            //         // "invitee[last_name]": lastName,
            //         // "invitee[email]": calendardetails[0].email,
            //         // ...guest
            //         value,
            //     headers: {
            //         'api': "kfj84nDFgKDm9nks93Kndf9SD8fjksla93jkDFkj",
            //         'Content-Type': 'application/json',
            //         'Accept': 'application/json'
            //     },



            // })

            const imeetifyResponse = await axios.post('https://imeetify.com/api/v1/appointment/create', null, {
                params: value,
                headers: {
                    'api': calendardetails[0].api_key,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36'
                }
            }).then(async (imeetifyResponse) => {
                if (imeetifyResponse.data.status === 'success') {
                    const imeetify_meeting_id = imeetifyResponse.data.data.meeting
                    const meeting_link = imeetifyResponse.data.data.location



                    // //const { title, description, start, end, type, invitee_timezone, provider, location, calendar_id, invitee_mobile, invitee_first_name, invitee_last_name, invitee_email, guest_email,meeting_type } = req.body;
                    const data = {
                        title, description, start, end, type,
                        invitee_timezone, provider, location, calendar_id: value.calendar,
                        invitee_mobile: calendardetails[0].mobile_no, invitee_first_name: firstName, invitee_last_name: lastName,
                        invitee_email: calendardetails[0].email, guest_email: JSON.stringify(guests_email),
                        meeting_type, meeting_type_id: JSON.stringify(meeting_type_id), user_id: calendardetails[0].user_id, meeting_link,
                        imeetify_meeting_id
                    }
                    // console.log("data----", data)


                    const [createMeeting] = await meetingModel.createMeeting(data)
                    if (createMeeting.affectedRows > 0) {
                        const meeting_id = createMeeting.insertId
                        const createNotification = await meetingNotification({ meeting_id, title, "action": "create", user_ids })
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Creation("Meeting"));
                    } else {
                        new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Creation("Meeting"));
                    }
                } else {
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Creation("Meeting"));
                }
            }).catch((error) => {
                console.error("Error creating appointment:", error);
                if (error.response) {
                    const { status, data } = error.response;
                    res.status(status).json({
                        status: false,
                        message: "Selected date and time has already scheduled for another meeting",

                    });
                } else if (error.request) {
                    res.status(500).json({
                        status: false,
                        message: "No response received from Imeetify API",
                        error: error.message,
                    });
                } else {
                    res.status(500).json({
                        status: false,
                        message: "Error in setting up the API request",
                        error: error.message,
                    });
                }
            });
        }
        catch (error) {
            logger.error('meeting creation is failed', error);
            //new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },


    async updateMeeting(req, res) {
        try {
            logger.info('updateMeeting method called')
            //const { meeting_id } = req.params
            const { start, end, meeting_id, meeting, type } = req.body;
            const userDetails = req.user
            const user_ids = userDetails.user_id
            const updateData = { start: start, end: end, meeting: meeting }

            const [meetingdetails] = await meetingModel.fetchMeeting(meeting_id)
            console.log(meetingdetails)
            if (meetingdetails[0].start != start || meetingdetails[0].end != end) {
                const provider = meetingdetails[0].provider
                const [calendarApiKey] = await meetingModel.calendarDetails(type, user_ids, provider)

                const updateScheduling = await axios.post(' https://imeetify.com/api/v1/appointment/update', null, {
                    headers: {
                        'api': calendarApiKey[0].api_key,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    params: updateData
                }).then(async (updateScheduling) => {
                    if (updateScheduling.data.status === 'success') {
                        const [updateMeeting] = await meetingModel.updateMeeting(updateData, meeting_id)
                        const updateNotification = await meetingNotification({ meeting_id, title: meetingdetails[0].title, "action": "update", user_ids })
                        if (updateMeeting.affectedRows > 0) {
                            new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Updation("Meeting"));
                        } else {
                            new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Updation("Meeting"));
                        }
                    } else {
                        new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Updation("Meeting"));

                    }
                }).catch((error) => {
                    console.error("Error creating appointment:", error);
                    if (error.response) {
                        const { status, data } = error.response;
                        res.status(status).json({
                            status: false,
                            message: "Selected date and time has already scheduled for another meeting",

                        });
                    } else if (error.request) {
                        res.status(500).json({
                            success: false,
                            message: "No response received from Imeetify API",
                            error: error.message,
                        });
                    } else {
                        res.status(500).json({
                            status: false,
                            message: "Error in setting up the API request",
                            error: error.message,
                        });
                    }
                });
            } else {
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.invalidtime);


            }
        }
        catch (error) {
            logger.error('meeting updation is failed', error);
            // new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)

        }
    },
    async fetchMeeting(req, res) {
        try {
            logger.info('fetch meeting sample working')
            const { meeting_id } = req.params
            const [fetchmeetings] = await meetingModel.fetchMeeting(meeting_id)
            const response = []
            if (fetchmeetings.length > 0) {
                const meetingType = fetchmeetings[0].meeting_type
                const meetingTypeId = fetchmeetings[0].meeting_type_id
                if (meetingType && meetingTypeId.length > 0) {
                    console.log('working type')
                    for (let i = 0; i < meetingTypeId.length; i++) {
                        const [meetingdetails] = await meetingModel.meetingDetails(meetingType, meetingTypeId[i])
                        if (meetingdetails.length > 0) {
                            const responses = {
                                title: fetchmeetings[0].title,
                                description: fetchmeetings[0].description,
                                start: fetchmeetings[0].start,
                                end: fetchmeetings[0].end,
                                type: fetchmeetings[0].type,
                                invitee_timezone: fetchmeetings[0].invitee_timezone,
                                provider: fetchmeetings[0].provider,
                                location: fetchmeetings[0].location,
                                calender_id: fetchmeetings[0].calendar_id,
                                invitee_mobile: fetchmeetings[0].invitee_mobile,
                                invitee_first_name: fetchmeetings[0].invitee_first_name,
                                invitee_last_name: fetchmeetings[0].invitee_last_name,
                                invitee_email: fetchmeetings[0].invitee_email,
                                invitee_guest: fetchmeetings[0].invitee_guest,
                                guest_email: fetchmeetings[0].guest_email,
                                // project_name: meetingdetails[0].project_name,
                                // project_id: meetingdetails[0].project_id,
                                meeting_id: fetchmeetings[0].meeting_id,
                                meeting_link: fetchmeetings[0].meeting_link,
                                user_id: fetchmeetings[0].user_id,
                                imeetify_meeting_id: fetchmeetings[0].imeetify_meeting_id
                            }
                            response.push(responses)
                            if (i === meetingTypeId.length - 1) {
                                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Meeting"), response[0]);
                            }

                        } else {
                            new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Meeting Details"));
                        }
                    }

                } else {
                    const responses = {
                        title: fetchmeetings[0].title,
                        description: fetchmeetings[0].description,
                        start: fetchmeetings[0].start,
                        end: fetchmeetings[0].end,
                        type: fetchmeetings[0].type,
                        invitee_timezone: fetchmeetings[0].invitee_timezone,
                        provider: fetchmeetings[0].provider,
                        location: fetchmeetings[0].location,
                        calender_id: fetchmeetings[0].calendar_id,
                        invitee_mobile: fetchmeetings[0].invitee_mobile,
                        invitee_first_name: fetchmeetings[0].invitee_first_name,
                        invitee_last_name: fetchmeetings[0].invitee_last_name,
                        invitee_email: fetchmeetings[0].invitee_email,
                        invitee_guest: fetchmeetings[0].invitee_guest,
                        guest_email: fetchmeetings[0].guest_email,
                        // project_name: meetingdetails[0].project_name,
                        // project_id: meetingdetails[0].project_id,
                        meeting_id: fetchmeetings[0].meeting_id,
                        meeting_link: fetchmeetings[0].meeting_link,
                        user_id: fetchmeetings[0].user_id,
                        imeetify_meeting_id: fetchmeetings[0].imeetify_meeting_id
                    }

                    new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Meeting"), responses);
                }
            }
            else {
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Meeting"));
            }
        }
        catch (error) {
            logger.error('fetch meeting sample working error')
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)

        }
    },
    async upcomingMeeting(req, res) {
        try {
            logger.info('upcoming meeting details fetch');
            const { date, dates } = req.query;
            const { user_id, email_id } = req.user

            const [upcomingmeeting] = await meetingModel.upcomingMeeting(date, dates, email_id);


            if (upcomingmeeting.length > 0) {
                const promises = upcomingmeeting.map(async (meeting) => {
                    const meetingType = meeting.meeting_type;
                    const meetingTypeIds = meeting.meeting_type_id;

                    if (meetingType && meetingTypeIds) {
                        const projectNames = [];
                        const projectIds = [];
                        const teamNames = []
                        const teamIds = []


                        for (let j = 0; j < meetingTypeIds.length; j++) {
                            const meetingTypeId = meetingTypeIds[j];
                            const [upcomingHistoryDetails] = await meetingModel.upcomingHistory(meetingType, meetingTypeId);

                            if (upcomingHistoryDetails.length > 0) {
                                projectNames.push(upcomingHistoryDetails[0].project_name);
                                projectIds.push(upcomingHistoryDetails[0].project_id);
                                teamNames.push(upcomingHistoryDetails[0].team_name)
                                teamIds.push(upcomingHistoryDetails[0].team_id)

                            } else {
                                throw new Error("No Upcoming and History Details found");
                            }
                        }

                        return {
                            title: meeting.title,
                            description: meeting.description,
                            start: meeting.start,
                            end: meeting.end,
                            type: meeting.type,
                            invitee_timezone: meeting.invitee_timezone,
                            provider: meeting.provider,
                            location: meeting.location,
                            calendar_id: meeting.calendar_id,
                            invitee_mobile: meeting.invitee_mobile,
                            invitee_first_name: meeting.invitee_first_name,
                            invitee_last_name: meeting.invitee_last_name,
                            invitee_email: meeting.invitee_email,
                            invitee_guest: meeting.invitee_guest,
                            guest_email: meeting.guest_email,
                            // project_names: projectNames,  // Array of project names
                            // project_ids: projectIds,      // Array of project IDs
                            // team_names: teamNames,
                            // team_ids: teamIds,
                            meeting_id: meeting.meeting_id,
                            meeting_link: meeting.meeting_link,
                            imeetify_meeting_id: meeting.imeetify_meeting_id
                        };
                    } else {
                        throw new Error("Meeting Type or Meeting Type IDs are missing");
                    }
                });

                // Wait for all promises to complete
                Promise.all(promises)
                    .then((results) => {
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Upcoming and History Meeting"), results);
                    })
                    .catch((error) => {
                        logger.error('upcoming meeting details fetch error', error);
                        new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
                    });

            } else {
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.NoData);
            }
        } catch (error) {
            logger.error('upcoming meeting details fetch error', error);
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError);
        }
    },
    async deleteMeeting(req, res) {
        try {
            logger.info('delete meeting')
            const userDetails = req.user
            const user_ids = userDetails.user_id
            const { meeting, type } = req.body
            const deleteData = { meeting }

            const [meetingdetails] = await meetingModel.fetchMeetings(meeting)

            const provider = meetingdetails[0].provider
            const meeting_id = meetingdetails[0].meeting_id
            const [deleteCalendarApiKey] = await meetingModel.calendarDetails(type, user_ids, provider)

            const deleteScheduling = await axios.post('https://imeetify.com/api/v1/appointment/cancel', null, {
                headers: {
                    'api': deleteCalendarApiKey[0].api_key,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                params: deleteData

            }).then(async (deleteScheduling) => {
                if (deleteScheduling.data.status === 'success') {
                    const createNotification = await meetingNotification({ meeting_id, title: meetingdetails[0].title, "action": "delete", user_ids })
                    const [deletemeeting] = await meetingModel.deleteMeeting(meeting)
                    if (deletemeeting.affectedRows > 0) {
                        new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Deletion("Meeting"));

                    } else {
                        new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Deletion("Meeting"));

                    }
                } else {
                    new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Deletion("Meeting"));
                }
            }).catch((error) => {
                console.error("Error creating appointment:", error);
                if (error.response) {
                    const { status, data } = error.response;
                    res.status(status).json({
                        status: false,
                        message: data.errors,

                    });
                } else if (error.request) {
                    res.status(500).json({
                        success: false,
                        message: "No response received from Imeetify API",
                        error: error.message,
                    });
                } else {
                    res.status(500).json({
                        status: false,
                        message: "Error in setting up the API request",
                        error: error.message,
                    });
                }
            })
        }
        catch (error) {
            logger.error('delete meeting error', error)
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },
    async acessDetails(req, res) {
        try {
            const { user_id } = req.params
            const [accessdetails] = await meetingModel.accessDetails(user_id)
            if (accessdetails.length > 0) {
                const response = { access: true }
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Meeting Access"), response);
            } else {
                const response = { access: false }
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Meeting Access"), response);
            }

        }
        catch (error) {
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },

    async getCalendarDetails(req, res) {
        try {
            console.log('imeetifyCalender details--->')
            const imeetifyCalender = await axios.get('https://imeetify.com/api/v1/calendars/all', {
                headers: {
                    'api': 'kfj84nDFgKDm9nks93Kndf9SD8fjksla93jkDFkj',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36'
                }
            });

            console.log('imeetifyCalender--->', imeetifyCalender.data)
            new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Calendar"), imeetifyCalender.data);
        } catch (error) {

        }
    },
    async fetchAllTeams(req, res) {
        try {
            const { created_by } = req.user
            const [fetchTeams] = await meetingModel.fetchAllTeams(created_by)
            if (fetchTeams.length > 0) {
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Teams"), fetchTeams);
            } else {
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Teams"));

            }
        }
        catch (error) {
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },
    async fetchAllProjects(req, res) {
        try {
            const { created_by } = req.user
            const [fetchProjects] = await meetingModel.fetchAllProjects(created_by)
            if (fetchProjects.length > 0) {
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Teams"), fetchProjects);

            } else {
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Teams"));
            }

        }
        catch (error) {
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    },
    async fetchImeetifyIntegration(req, res) {
        try {
            const { user_id } = req.user
            const [fetchList] = await meetingModel.getImeetifyIntegration(user_id);
            console.log('saa-->',fetchList)
            if (fetchList.length > 0) {
                new Response(res, StatusCodes.OK)._SuccessResponse(Message.Common.SuccessMessage.Fetch("Imeetify Integration list"), fetchList);
            } else {
                new Response(res, StatusCodes.BAD_REQUEST)._ErrorMessage(Message.Common.FailureMessage.Fetch("Imeetify Integration list"));
            }
        }
        catch (error) {
            new Response(res, StatusCodes.INTERNAL_SERVER_ERROR)._ErrorMessage(Message.Common.FailureMessage.InternalServerError)
        }
    }

}


module.exports = chatController;