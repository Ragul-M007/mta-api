const { database } = require("../config/database")
const QueryGenerator = require("../generators/query.generator")

const TeamModel = {
    async create(cat) {
        // Query generator can generate a insert query based on object we passed
        return await database.connection.promise().query(QueryGenerator.insert("teams", cat))
      },

    async getAllteams(created_by,user_id){
      let query;
      if(user_id){
        query = QueryGenerator.format(`select DISTINCT t.team_id,t.team_name,t.description,t.created_by, (select count(*) from teams_users 
        where team_id = t.team_id and project_id is null) as users, 
        (select count(*) from teams_project where team_id = t.team_id) as projects,unmc.user_id as un_readed_user_id 
        from teams_users u inner join teams t on u.team_id = t.team_id 
        left join un_read_message_details unmc on unmc.team_id = t.team_id
        where u.user_id = ${user_id} order by team_name ASC`)
      }else{
        query = QueryGenerator.format(`select DISTINCT t.team_id,team_name,description,created_by,(select count(*) from teams_users 
        where team_id = t.team_id and project_id is null) as users, (select count(*) from teams_project 
        where team_id = t.team_id) as projects,unmc.user_id as un_readed_user_id from teams t 
        left join un_read_message_details unmc on unmc.team_id = t.team_id
        where created_by = '${created_by}' order by team_name ASC`);
      }
      console.log("====>",query)
      return await database.connection.promise().query(query)
    },

    async getTeamsById(team_id,created_by){
      let query = QueryGenerator.format(`select * from teams_users where team_id = ${team_id}`);
      return await database.connection.promise().query(query)
    },

    async checkTeam(team_name){
      let query = QueryGenerator.format(`select * from teams where team_name = '${team_name}'`);
      return await database.connection.promise().query(query)
    },

    async UpdateTeams(teamId,data){
      let query = QueryGenerator.format(`update teams set team_name = '${data.team_name}', description = '${data.description}' where team_id in (${teamId})`);
      return await database.connection.promise().query(query)
    },

    async deleteTeams(teamId){
      let query = QueryGenerator.format(`DELETE FROM teams where team_id =${teamId}`);
      return await database.connection.promise().query(query)
    },
    async teamUsers(teamId){
      let query = QueryGenerator.format(`SELECT * FROM teams_users where team_id =${teamId}`);
      return await database.connection.promise().query(query)
    },
    async teamProjects(teamId){
      let query = QueryGenerator.format(`SELECT * FROM teams_project where team_id =${teamId}`);
      return await database.connection.promise().query(query)
    },

    async deleteTeamLinkProject(team_id){
      let query = QueryGenerator.format(`delete from teams_project where team_id = ${team_id}`);
      return await database.connection.promise().query(query)
    },

    async getProjectsByTeamId(teamId){
      let query = QueryGenerator.format(`Select * FROM teams_project where team_id =${teamId}`);
      return await database.connection.promise().query(query)
    },

    async addUsersinTeams(cat){
      return await database.connection.promise().query(QueryGenerator.insert("teams_users", cat))
    },

    async getTeamUsers(users_id){
      let query = QueryGenerator.format(`select t.id, t.user_id, t.team_id, u.name, u.email,u.mobile_no,u.user_img from teams_users t inner join users u on t.user_id = u.user_id where team_id = ${users_id} and t.project_id is null`);
      return await database.connection.promise().query(query)
    },

    async checkTeamDuplication(teamData) {
      let query = `Select * from teams where team_name = '${teamData.team_name}' and team_id = ${teamData.team_id}`
      return await database.connection.promise().query(QueryGenerator.format(query))
    },

    async checkTeamDuplication1(teamData) {
      let query = `Select * from teams where team_name = '${teamData.team_name}'`
      return await database.connection.promise().query(QueryGenerator.format(query))
    },

    async getTeamProject(project_id,users_id){
      let query = QueryGenerator.format(`select t.id, t.user_id, t.team_id, u.name, u.email,u.mobile_no,u.user_img,t.project_id from teams_users t inner join users u on t.user_id = u.user_id where project_id = ${project_id} and u.user_id = ${users_id}`);
      return await database.connection.promise().query(query)
    },

    async deleteTeamUsersbyTeamId(team_id,user_id){
      let query = QueryGenerator.format(`delete from teams_users where team_id = ${team_id} and user_id = ${user_id}`);
      return await database.connection.promise().query(query)
    },

    async deleteTeamProjectsbyTeamId(team_id,user_id){
      let query = QueryGenerator.format(`delete from teams_users where team_id = ${team_id} and user_id = ${user_id}`);
      console.log("1--->",query);
      return await database.connection.promise().query(query)
    },

    async deleteProjectsbyTeamIdAndProjectId(team_id,user_id,project_id){
      let query = QueryGenerator.format(`delete from teams_users where team_id = ${team_id} and user_id = ${user_id} and project_id = ${project_id}`);
      console.log("1--->",query);
      return await database.connection.promise().query(query)
    },

    async deleteTeamProjectbyTeamId(team_id,project_id){
      let query = QueryGenerator.format(`delete from teams_project where team_id = ${team_id} and project_id = ${project_id}`);
      console.log("2--->",query);
      return await database.connection.promise().query(query)
    },

    async getTeamsUsersByUserId(user_id,team_id){
      let query = QueryGenerator.format(`select * from teams_users where user_id in (${user_id}) and team_id = ${team_id}`);
      return await database.connection.promise().query(query)
    },
    async getTeamsByUserId(user_id){
      let query = QueryGenerator.format(`select * from teams_users where user_id = ${user_id}`);
      return await database.connection.promise().query(query)
    },
    async deleteTeamProjects(team_id,project_id){
      let query = QueryGenerator.format(`delete from teams_users where team_id = ${team_id} and project_id = ${project_id}`);
      console.log("1--->",query);
      return await database.connection.promise().query(query)
    },
    async deleteProjectTeamUser(project_id){
      let query = QueryGenerator.format(`delete from teams_users where project_id = ${project_id}`);
      console.log("1--->",query);
      return await database.connection.promise().query(query)
    },
}

module.exports = TeamModel