/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-01-22 12:07:11
 * @desc [description]
 */
 const { database } = require("../config/database")
 const QueryGenerator = require("../generators/query.generator")
 
 
 const attendanceModel = {
 
 
   // Create Customer machine
async create(attend) {
 
     // Query generator can generate a insert query based on object we passed
     return await database.connection.promise().query(QueryGenerator.insert(`user_attendances`, attend))
   },
 
 
   async getavailableCats() {
     return await database.connection.promise().query(
       QueryGenerator.format(`SELECT category_id , category_name, description FROM available_categories`)
     )
   },
   /* ---------------------------- Get Customer Details starts ---------------------------- */
 
   async find(
     {user_id,date,created_by="A" }
   ) {
 
 
     /* ------------------------ Setting initial variables ----------------------- */
     let cond = []
 
    //  if (user_id) {
    //    cond.push(`u.user_id = :user_id`)
    //  }
    
 
    //  cond = cond.length ? ` WHERE ${cond.join(' AND ')}` : ''
 
 
    //  query = `SELECT u.user_id,
    //  DATE(u.created_at) as date,
    //  MAX(CASE WHEN u.checkType = 'IN' THEN u.checkTime END) check_in_time,
    //  MAX(CASE WHEN u.checkType = 'OUT' THEN u.checkTime END) check_out_time,
    //  MAX(CASE WHEN u.checkType = 'IN' THEN u.location_name END) check_in_location,
    //  MAX(CASE WHEN u.checkType = 'OUT' THEN u.location_name END) check_out_location
    //  FROM user_attendances u ${cond} GROUP BY u.user_id , DATE(u.created_at)`
    console.log('date-->',date)
    var dat = (date || '').split("-").reverse().join("-");
    console.log("DDDD",dat)
    console.log("UUUU",user_id)
    const createdByFilter = `(u.created_by = '${created_by}' OR u.created_by IS NULL)`;
    if(user_id == undefined){
      query = `SELECT a.checkType,a.checkTime,a.location_name,u.name,a.user_id,a.project_id,p.project_name,p.project_img FROM user_attendances a 
      inner join users u on a.user_id = u.user_id 
      left join projects p on p.project_id = a.project_id 
      WHERE ${createdByFilter} and a.created_at LIKE '${dat}%'`
    }else{
      query = `SELECT a.checkType,a.checkTime,a.location_name,u.name,a.user_id,a.project_id,p.project_name,p.project_img FROM user_attendances a 
      inner join users u on a.user_id = u.user_id 
      left join projects p on p.project_id = a.project_id
      WHERE a.user_id = ${user_id} and ${createdByFilter} AND a.created_at LIKE '${dat}%'`
     // Query generator can generate a insert query based on object we passed
    }
    console.log("query---",query)
     return await database.connection.promise().query(QueryGenerator.format(query))
 
   },
 
   /* --------------------------- Get Customer ends here -------------------------- */
 
 
 
 
 
   // update
 
   async findByIdAndUpdate(customer_id, customer) {
 
     let query = QueryGenerator.update('customer_details', customer, { customer_id: customer_id })
 
     return await database.connection.promise().query(query)
 
   },
   // delete
   async findByIdAndDelete(customer_id) {
 
     let query = QueryGenerator.format(`DELETE FROM customer_details where customer_id =? `, [customer_id])
 
     return await database.connection.promise().query(query)
 
   },

   async getAttendanceCounts(){
    query = `select * from user_attendances where counts is null`;
    return await database.connection.promise().query(QueryGenerator.format(query))
  },

   async updateAttendanceCounts(){
    query=`update user_attendances set counts = 1 where counts is null`;
    return await database.connection.promise().query(QueryGenerator.format(query))
   },

  async getAttendanceData({user_id,project_id,date}) {
    console.log('givennn date --->',date)
  //  const given_date = date.split("-").reverse().join("-");
    query =`SELECT a.checkType,a.checkTime,a.location_name,u.name,a.latLng,a.created_at
            FROM user_attendances a 
            inner join users u on a.user_id = u.user_id  
            WHERE a.project_id = ${project_id}
            and a.user_id = ${user_id} 
            and a.created_at LIKE '${date}%'`
    return await database.connection.promise().query(QueryGenerator.format(query))

  },
  async getProjects({date}) {
    console.log('givennn date --->',date)
  //  const given_date = date.split("-").reverse().join("-");
    query =`SELECT a.project_id,a.user_id
            FROM user_attendances a 
            inner join users u on a.user_id = u.user_id  
            WHERE a.created_at LIKE '${date}%'`
    return await database.connection.promise().query(QueryGenerator.format(query))

  },
  async getUsers({project_id,date}) {
  //  const given_date = date.split("-").reverse().join("-");
    query =`SELECT a.project_id,a.user_id
            FROM user_attendances a 
            inner join users u on a.user_id = u.user_id  
            WHERE a.project_id = ${project_id}
            AND a.created_at LIKE '${date}%'`
    return await database.connection.promise().query(QueryGenerator.format(query))

  },
 }


 
 
 module.exports = attendanceModel
 