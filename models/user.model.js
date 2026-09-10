/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-01-22 12:07:11
 * @desc [description]
 */
const { database } = require("../config/database")
const QueryGenerator = require("../generators/query.generator")
const { Group_access } = require('../utils/chat')


const UserModel = {


  // Create Customer machine
  async create(profile) {

    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.insert("users", profile))
  },
  async createOTP(otp) {

    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.insert("otp_verification", otp))
  },
  async updateDeviceId(profile) {

    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.insert("user_devices", profile))
  },

  async getLogin({
    email_id,
    password,
    loginpin
  }) {
    if (password) {
      return await database.connection.promise().query(
        QueryGenerator.format(`SELECT user_id , email , mobile_no, name , user_img,city,
      area,
      state,created_by,
      (SELECT role FROM user_roles WHERE role_id = users.role_id) as role
      FROM users WHERE email = :email_id AND password = :password`, {
          email_id, password
        })
      )
    } else {
      return await database.connection.promise().query(
        QueryGenerator.format(`SELECT user_id , email , mobile_no, name , user_img,city,
        area,
        state,created_by,
        (SELECT role FROM user_roles WHERE role_id = users.role_id) as role
        FROM users WHERE email = :email_id AND loginpin = :loginpin`, {
          email_id, loginpin
        })
      )
    }
  },
  async getUserRoles() {
    return await database.connection.promise().query(
      QueryGenerator.format(`SELECT role_id , role FROM user_roles`)
    )
  },
  /* ---------------------------- Get Customer Details starts ---------------------------- */

  async find(
    { user_id, name, email, created_by }
  ) {
    /* ------------------------ Setting initial variables ----------------------- */

    if (user_id == undefined) {
      // where created_by = "${created_by}"
      query = `SELECT user_id,
         role_id,
         name,
         email,
         mobile_no,
         status,
         user_img,
         dob,
         city,
         area,
         (select category_name from available_categories where category_id = users.prof) as prof,
         state,
         anniver_date,
         device_token,
         created_at,
         created_by,
         counts as new_user,
         (select count(user_id) from user_attendances where user_id = users.user_id and counts is null) as attendance_status,
         updated_at FROM users where created_by = '${created_by}' OR created_by is null order by name ASC`
    } else {
      query = `SELECT user_id,
         role_id,
         name,
         email,
         mobile_no,
         status,
         user_img,
         dob,
         city,
         area,
         state,
         anniver_date,
         created_by,
         created_at,
         counts as new_user,
         updated_at FROM users WHERE user_id in (${user_id})`
    }

    if (name) {
      query = `Select * from users where name = '${name}'`
    }

    if (email) {
      query = `Select * from users where email = '${email}'`
    }
    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.format(query, { user_id }))

  },


  async findEmail(
    { email_id }
  ) {


    /* ------------------------ Setting initial variables ----------------------- */

    query = `SELECT user_id,
         name,
         email,
         mobile_no,
         status,
         user_img,
         password,
         dob,
         anniver_date,
         created_at,
         updated_at FROM users WHERE email= '${email_id}'`


    // Query generator can generate a insert query based on object we passed

    return await database.connection.promise().query(QueryGenerator.format(query, { email_id }))

  },
  /* --------------------------- Get Customer ends here -------------------------- */

  async validateOTP(
    { email_id, otp }
  ) {

    /* ------------------------ Setting initial variables ----------------------- */

    query = `SELECT email_id,otp,isVerified FROM otp_verification WHERE email_id= '${email_id}' AND otp=${otp}`


    // Query generator can generate a insert query based on object we passed

    return await database.connection.promise().query(QueryGenerator.format(query, { email_id, otp }))

  },

  async checkValidOTP(email) {
    query = `SELECT email_id,otp,isVerified FROM otp_verification WHERE email_id = '${email}'`


    return await database.connection.promise().query(query)
  },

  // Query generator can generate a insert query based on object we passed


  // update
  async UpdateStatus(email_id, otp, isVerified) {

    let query = QueryGenerator.update('otp_verification', { email_id, otp, isVerified }, { email_id: email_id })

    return await database.connection.promise().query(query)

  },

  async findByIdAndUpdate(user_id, user) {

    //console.log("updated data --------------------------->",user)

    let query = QueryGenerator.update('users', user, { user_id: user_id })

    //console.log(query);

    return await database.connection.promise().query(query)

  },

    async findByIdAndUpdateUser(user_id, user) {
    console.log("updated data --------------------------->", user);

    let isCreatedByNull = user.created_by === null;

    // ✅ remove created_by from main update (to avoid skipping issue)
    if (isCreatedByNull) {
      delete user.created_by;
    }

    let query = QueryGenerator.update("users", user, { user_id });

    console.log("MAIN QUERY:", query);

    let result = await database.connection.promise().query(query);

    // ✅ force NULL update separately
    if (isCreatedByNull) {
      await database.connection
        .promise()
        .query("UPDATE users SET created_by = NULL WHERE user_id = ?", [user_id]);

      console.log("created_by set to NULL manually");
    }

    return result;
  },

  async updateOTPVerification(email_id, user) {

    //console.log("updated data --------------------------->",user)

    let query = QueryGenerator.update('otp_verification', user, { email_id: email_id })

    //console.log(query);

    return await database.connection.promise().query(query)

  },

  // delete
  async findByIdAndDelete(user_id) {

    let query = QueryGenerator.format(`DELETE FROM users where user_id =? `, [user_id])

    return await database.connection.promise().query(query)

  },

  async getNotify_user() {
    let query = QueryGenerator.format(`select * from users where role_id in(1,2,5)`)
    return await database.connection.promise().query(query)
  },

  async GetMailforId(user_id) {
    let query = QueryGenerator.format(`select email from users where user_id = ${user_id}`)
    return await database.connection.promise().query(query)
  },

  async GetAllAdmin(created_by='A') {
    let query = QueryGenerator.format(`select * from users where role_id in(1) and created_by = '${created_by}'`)
    return await database.connection.promise().query(query)
  },

  async specialFileAccessUsers(category_id) {
    let query = `select distinct u.* from users u
      join special_file_access sfa on sfa.user_id = u.user_id
      where sfa.is_active = 1`;

    if (category_id) {
      query += ` and sfa.category_id = ${category_id}`;
    }

    query = QueryGenerator.format(query)
    return await database.connection.promise().query(query)
  },

  async hasSpecialCategoryAccessUser(user_id, category_id) {
    let query = `select user_id from special_file_access
      where user_id = ${user_id} and is_active = 1`;

    if (category_id) {
      query += ` and category_id = ${category_id}`;
    }

    query += ' limit 1';
    query = QueryGenerator.format(query)
    return await database.connection.promise().query(query)
  },

  async GetUsers(data) {
    //console.log("module come data--------------->",data)
    let query = QueryGenerator.format(`select * from users where user_id in (${data})`)
    return await database.connection.promise().query(query)
  },
  async addLoginTime(userDetails) {
    return await database.connection.promise().query(QueryGenerator.insert("user_login_details", userDetails))
  },
  async getLoginTime(user_id) {
    //console.log("module come data--------------->",data)
    let query = QueryGenerator.format(`select * from user_login_details where user_id = ${user_id}`)
    return await database.connection.promise().query(query)
  },
  async updateLoginTime(userDetails, id) {
    let query = QueryGenerator.update('user_login_details', userDetails, { id: id })
    return await database.connection.promise().query(query)
  },
  async userDetails(data) {
    //console.log("module come data--------------->",data)
    let query = QueryGenerator.format(`select * from users u inner JOIN user_roles ur on u.role_id = ur.role_id where user_id = (${data}) order by u.name ASC`)
    return await database.connection.promise().query(query)
  },
  async deleteUser(data) {
    //console.log("module come data--------------->",data)
    let query = QueryGenerator.format(`update users set user_img = null where user_id = (${data})`)
    return await database.connection.promise().query(query)
  },
  async getCommentsId(commentId) {
    let query = QueryGenerator.format(`select * from comments where comment_id = ${commentId}`)
    return await database.connection.promise().query(query)
  },
  async deleteDeviceId(user_id) {
    //console.log("data-->",user_id);
    let query = QueryGenerator.format(`update users set device_token = NULL where user_id = ${user_id}`)
    return await database.connection.promise().query(query)
  },

  async updateuserData(userData, user_id) {
    //console.log("data-->",user_id);
    let query = QueryGenerator.format(`update users set group_create_access=${userData.group_create_access} where user_id IN (${user_id})`)
    return await database.connection.promise().query(query)
  },
  async GetGroupAccessUserList(status) {
    let query;
    if (status == Group_access.Type_1) {
      query = QueryGenerator.format(`select u.user_id,u.name,u.role_id,u.user_img,u.group_create_access,ac.category_name from users u JOIN 
      user_roles ur on u.role_id = ur.role_id 
      join available_categories ac on ac.role_id = ur.role_id
      where ur.role_id in (2)
      and u.group_create_access = 0
      and u.role_id = ac.role_id
      and ac.category_id = u.prof
      and ac.category_name IN ('ARCHITECT','PROJECT MANAGER','CHIEF ARCHITECT')`)
    } else if (status == Group_access.Type_2) {
      query = QueryGenerator.format(`select u.user_id,u.name,u.role_id,u.user_img,u.group_create_access,ac.category_name from users u JOIN 
      user_roles ur on u.role_id = ur.role_id 
      join available_categories ac on ac.role_id = ur.role_id
      where ur.role_id in (2)
      and u.group_create_access = 1
      and u.role_id = ac.role_id
      and ac.category_id = u.prof
      and ac.category_name IN ('ARCHITECT','PROJECT MANAGER','CHIEF ARCHITECT')`)
    }
    return await database.connection.promise().query(query)
  },

  async getProjectUsers(
    { project_id }
  ) {
    /* ------------------------ Setting initial variables ----------------------- */
    query = `SELECT 
 DISTINCT i.name,
 i.user_id,
 i.user_img,
 i.mobile_no,
 i.email,
 i.role_id,
 (select category_name from available_categories where category_id = i.prof) as prof,
 xcat.vw_rights
 FROM category_project_xref xcat
 JOIN users i ON i.user_id = xcat.user_id  
 JOIN projects p ON  p.project_id = xcat.project_id
 WHERE xcat.project_id = ${project_id} AND i.role_id != 1
 Order BY i.name ASC`

    // Query generator can generate a insert query based on object we passed

    return await database.connection.promise().query(QueryGenerator.format(query, { project_id }))

  },

  async getUserCounts() {
    query = `select * from users where counts is null`;
    return await database.connection.promise().query(QueryGenerator.format(query))
  },

  async updateUserCount() {
    query = `update users set counts = 1 where counts is null`;
    return await database.connection.promise().query(QueryGenerator.format(query))
  },
  async getUserList(created_by) {
    let query = QueryGenerator.format(`select * from users u inner JOIN user_roles ur on u.role_id = ur.role_id where u.created_by = '${created_by}' and ur.role_id in (2,5)`)
    return await database.connection.promise().query(QueryGenerator.format(query))
  },

  async getUserwithPagination(userData,created_by) {

    let query;

    if (userData.search != null || userData.search != 'null' ||
      userData.search != undefined || userData.search != '') {
      if (userData.status != '' && userData.status != undefined) {
        query = QueryGenerator.format(`select u.user_id,u.name,u.role_id,u.user_img,u.group_create_access,ac.category_name from users
          u JOIN user_roles ur on u.role_id = ur.role_id 
          join available_categories ac on ac.role_id = ur.role_id
          where ur.role_id in (2)
          and u.group_create_access = 1
          and u.created_by = '${created_by}'
          and u.role_id = ac.role_id
          and ac.category_id = u.prof
          and ac.category_name IN ('ARCHITECT','PROJECT MANAGER','CHIEF ARCHITECT')
          and u.name LIKE '%${userData.search}%'
          order by u.user_id desc
          LIMIT ${userData.page_count} OFFSET ${userData.user_offset_value};`)
      } else {
        query = QueryGenerator.format(`select u.*,(select category_name from available_categories where category_id = u.prof) as prof from users u,user_roles ur 
          where u.role_id = ur.role_id 
          and ur.role_id = ${userData.role_id}
          and u.name LIKE '%${userData.search}%'
          and (u.created_by = '${created_by}' OR u.created_by IS NULL OR u.created_by = '' OR u.created_by = 'null')
          order by user_id desc
          LIMIT ${userData.page_count} OFFSET ${userData.user_offset_value};`)
      }
    } else {
      if (userData.status != '' && userData.status != undefined) {
        query = QueryGenerator.format(`select u.user_id,u.name,u.role_id,u.user_img,u.group_create_access,ac.category_name from users
          u JOIN user_roles ur on u.role_id = ur.role_id 
          join available_categories ac on ac.role_id = ur.role_id
          where ur.role_id in (2)
          and u.group_create_access = 1
          and u.created_by = '${created_by}'
          and u.role_id = ac.role_id
          and ac.category_id = u.prof
          and ac.category_name IN ('ARCHITECT','PROJECT MANAGER','CHIEF ARCHITECT')
          order by u.user_id desc
          LIMIT ${userData.page_count} OFFSET ${userData.user_offset_value};`)
      } else {
        query = QueryGenerator.format(`select u.*,(select category_name from available_categories where category_id = u.prof) as prof from users u,user_roles ur 
        where u.role_id = ur.role_id 
        and ur.role_id = ${userData.role_id}
        and (u.created_by = '${created_by}' OR u.created_by IS NULL OR u.created_by = '' OR u.created_by = 'null')
        order by user_id desc
        LIMIT ${userData.page_count} OFFSET ${userData.user_offset_value};`)
      }
    }

    return await database.connection.promise().query(query)
  },
  async user_total_count(userData,created_by) {
    let query;
    console.log('created_by--->',created_by)
    if (userData.search != null || userData.search != 'null' ||
      userData.search != undefined || userData.search != '') {
      if (userData.status != '' && userData.status != undefined) {
        query = QueryGenerator.format(`select count(u.user_id) as total_count from users
          u JOIN user_roles ur on u.role_id = ur.role_id 
          join available_categories ac on ac.role_id = ur.role_id
          where ur.role_id in (2)
          and u.group_create_access = 1
          and u.created_by = '${created_by}'
          and u.role_id = ac.role_id
          and ac.category_id = u.prof
          and ac.category_name IN ('ARCHITECT','PROJECT MANAGER','CHIEF ARCHITECT')
          and u.name LIKE '%${userData.search}%'
          order by u.user_id desc;`)
      } else {
        query = QueryGenerator.format(`select count(u.user_id) as total_count from users u,user_roles ur 
          where u.role_id = ur.role_id 
          and (u.created_by = '${created_by}' OR u.created_by IS NULL OR u.created_by = '' OR u.created_by = 'null')
          and ur.role_id = ${userData.role_id}
          and u.name LIKE '%${userData.search}%'`)
      }
    } else {
      if (userData.status != '' && userData.status != undefined) {
        query = QueryGenerator.format(`select count(u.user_id) as total_count from users
          u JOIN user_roles ur on u.role_id = ur.role_id 
          join available_categories ac on ac.role_id = ur.role_id
          where ur.role_id in (2)
          and u.group_create_access = 1
          and u.created_by = '${created_by}'
          and u.role_id = ac.role_id
          and ac.category_id = u.prof
          and ac.category_name IN ('ARCHITECT','PROJECT MANAGER','CHIEF ARCHITECT')
          order by u.user_id desc`)
      } else {
        query = QueryGenerator.format(`select count(u.user_id) as total_count from users u,user_roles ur 
          where u.role_id = ur.role_id 
          and (u.created_by = '${created_by}' OR u.created_by IS NULL OR u.created_by = '' OR u.created_by = 'null')
          and ur.role_id = ${userData.role_id}'`)
      }

    }
    return await database.connection.promise().query(query)
  },
  async getBackLink() {
    query = `select * from backlink`;
    return await database.connection.promise().query(QueryGenerator.format(query))
  },

}


module.exports = UserModel
