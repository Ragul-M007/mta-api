/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-01-22 12:07:11
 * @desc [description]
 */
 const { database } = require("../config/database")
 const QueryGenerator = require("../generators/query.generator")
 
 
 const newsfeedModel = {
 
 
   // Create Customer machine
   async create(feed) {
 
     // Query generator can generate a insert query based on object we passed
     return await database.connection.promise().query(QueryGenerator.insert("newsfeed", feed))
   },
 
 

   /* ---------------------------- Get Customer Details starts ---------------------------- */
 
   async find(
     {  }
   ) {
 
 
    query= `SELECT id,title_text,description,img_url,feed_type,created_at,updated_at FROM newsfeed`
 
 
     // Query generator can generate a insert query based on object we passed
 
     return await database.connection.promise().query(QueryGenerator.format(query, {  }))
 
   },
 
   /* --------------------------- Get Customer ends here -------------------------- */
 
 
 
 
 
   // update
 
   async findByIdAndUpdate(id, feed) {
 
     let query = QueryGenerator.update('newsfeed', feed, { id: id })
 
     return await database.connection.promise().query(query)
 
   },
   // delete
   async findByIdAndDelete(id) {
 
     let query = QueryGenerator.format(`DELETE FROM newsfeed where id =? `, [id])
 
     return await database.connection.promise().query(query)
 
   },
 
 
 }
 
 
 module.exports = newsfeedModel
 