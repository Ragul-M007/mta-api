/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-01-22 12:07:11
 * @desc [description]
 */
const { database } = require("../config/database")
 const QueryGenerator = require("../generators/query.generator")
 
 
 const UtilsModel = {
 
 
   // Create Customer machine
async create(doc) {
    console.log("XXX--->",doc)
     // Query generator can generate a insert query based on object we passed
     return await database.connection.promise().query(QueryGenerator.insert(`utilities`, doc))
   },
   async createNoti(notific) {
    console.log("DATAQUERY",notific)
    // let query=`INSERT INTO notifications (title,description,user_type,img_url,user_id) VALUES ('${title}','${description}',${user_type},${img_url},${item})`

    //console.log("query",notific)
    
    // return await database.connection.promise().query(QueryGenerator.format(query))
    
    //  Query generator can generate a insert query based on object we passed
     return await database.connection.promise().query(QueryGenerator.insert(`notifications`, notific))
   },
   async getAudioUrl(data){
    console.log('getAudio URL-->',data)
     if(data.parent_comment_id){
      if(data.document_id){
        query = `INSERT INTO comments (document_id,parent_comment_id,comment,user_id,audio,recipient,category_id_list,category_list,recipient_id) VALUES (${data.document_id},${data.parent_comment_id},"${data.comment}",${data.user_id},'${data.audio}',"${data.recipient}","${data.category_id_list}",'${data.category_list}',"'${data.recipient_id}'")`
      }else{
        query = `INSERT INTO comments (project_id,parent_comment_id,comment,user_id,audio,recipient,category_id_list,category_list,recipient_id) VALUES (${data.project_id},${data.parent_comment_id},"${data.comment}",${data.user_id},'${data.audio}',"${data.recipient}","${data.category_id_list}",'${data.category_list}',"'${data.recipient_id}'")`
      }
     }else if(data.document_id){
     query = `INSERT INTO comments (document_id,comment,user_id,audio,recipient,category_id_list,category_list,recipient_id) VALUES (${data.document_id},"${data.comment}",${data.user_id},'${data.audio}',"${data.recipient}","${data.category_id_list}",'${data.category_list}',"'${data.recipient_id}'")`
     }
     else{
      query = `INSERT INTO comments (project_id,comment,user_id,audio,recipient,category_id_list,category_list,recipient_id) VALUES (${data.project_id},"${data.comment}",${data.user_id},'${data.audio}',"${data.recipient}","${data.category_id_list}",'${data.category_list}',"'${data.recipient_id}'")`
     }
     return await database.connection.promise().query(QueryGenerator.format(query, {}))
     //return await database.connection.promise().query(QueryGenerator.insert(`comments`,audio))
   },
   async createcomment(doc) {
    console.log('Socketio comments--->',doc)
    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.insert(`comments`, doc))
  },


  async getUser() {
    /* ------------------------ Setting initial variables ----------------------- */
    
    query = `SELECT user_id from users order by user_id`;

    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.format(query, {}))
  },




   /* ---------------------------- Get Customer Details starts ---------------------------- */
   async find() {
 
 
     /* ------------------------ Setting initial variables ----------------------- */
     let cond = []
 
 
     query = `SELECT c.util_id, c.delete_time, p.file FROM utilities c
     JOIN project_documents p ON p.document_id = c.document_id`;
 
 
     // Query generator can generate a insert query based on object we passed
 
     return await database.connection.promise().query(QueryGenerator.format(query, {}))
 
   },
 
   async fetchNoti(user_id) {
 
    var userData_id = user_id.user_id;
    /* ------------------------ Setting initial variables ----------------------- */
    query = `SELECT noti_id,title, description,doc_detail, img_url, created_at,read_status FROM notifications n WHERE n.user_id=${userData_id} and n.read_status is null order by created_at DESC`;
    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.format(query, {userData_id}))
  },
  // async checkNotificationData(notificationCheckData) {
  //   console.log("checkNotificationData--->",notificationCheckData);
  //   /* ------------------------ Setting initial variables ----------------------- */
  //   query = QueryGenerator.format(`SELECT * FROM notifications n WHERE n.user_id=${notificationCheckData.user_id} AND n.document_id=${notificationCheckData.document_id}`);
  //   // Query generator can generate a insert query based on object we passed
  //   console.log('query-->',query);
  //   return await database.connection.promise().query(query)
  // },
  async checkNotificationData(notificationCheckData) {
    console.log("checkNotificationData--->",notificationCheckData);
    let query = `SELECT * FROM notifications n WHERE n.user_id=${notificationCheckData.user_id} AND n.document_id=${notificationCheckData.document_id}`;
    return await database.connection.promise().query(QueryGenerator.format(query))
  },
   async findComments(doc) {
 
    /* ------------------------ Setting initial variables ----------------------- */
    let cond = ``;
    let {user_id,document_id,project_id}=doc;
    // if (user_id && document_id) {
    //   cond = `WHERE c.user_id = ${user_id} AND c.document_id = ${document_id}`
    // }
    if (user_id == 4 && project_id || user_id == 3 && project_id){ 
      query = `SELECT c.comment_id,c.parent_comment_id,c.comment,c.audio,c.date,c.recipient_id,IFNULL(c.recipient, '') as recipient,
      IFNULL(c.category_id_list, '') as category_id_list,
      IFNULL(c.category_list, '') as category_list,
      u.name,u.user_img, 
      u.user_id as comment_user_id,
      (SELECT CAST(
        IFNULL( CONCAT(
          '[',
          GROUP_CONCAT(
            JSON_OBJECT(
              'comment_id',
              com.comment_id,
              'parent_comment_id',
              com.parent_comment_id,
              'comment',
              com.comment,
              'audio',
              com.audio,
              'recipient_id',
              com.recipient_id,
              "recipient",
              com.recipient,
              'category_id_list',
              com.category_id_list,
              "category_list",
              com.category_list,
              'date',
             com.date,
             'comment_user_id',
              user.user_id,
              'comment_by',
              user.name,
              'user_img',
              user.user_img
    
            )
          ),
          ']'
          ) , '[]') AS JSON
      ) FROM comments com 
      JOIN users user ON user.user_id = com.user_id
      WHERE com.parent_comment_id is not null and com.parent_comment_id = c.comment_id) as replies
      FROM comments c 
      JOIN users u ON u.user_id = c.user_id WHERE c.project_id = ${project_id} AND c.parent_comment_id is null order by c.date DESC`;
           
    }
    else if(project_id){
              query = `SELECT c.comment_id,c.parent_comment_id,c.comment,c.audio,c.category_list,c.date,c.recipient_id,IFNULL(c.recipient, '') as recipient,
              u.name,u.user_img,
              u.user_id as comment_user_id,
              (SELECT CAST(
                IFNULL(CONCAT(
                  '[',
                  GROUP_CONCAT(
                    JSON_OBJECT(
                      'comment_id',
                      com.comment_id,
                      'parent_comment_id',
                      com.parent_comment_id,
                      'comment',
                      com.comment,
                      'audio',
                      com.audio,
                      'recipient_id',
                      com.recipient_id,
                      "recipient",
                      com.recipient,
                      'category_id_list',
                      com.category_id_list,
                      "category_list",
                      com.category_list,
                      'date',
                     com.date,
                     'comment_user_id',
                     user.user_id,
                      'comment_by',
                      user.name,
                      'user_img',
                      user.user_img
            
                    )
                  ),
                  ']'
                  ) , '[]') AS JSON
              ) FROM comments com 
              JOIN users user ON user.user_id = com.user_id
              WHERE com.parent_comment_id is not null and com.parent_comment_id = c.comment_id) as replies
              FROM comments c 
              JOIN users u ON u.user_id = c.user_id WHERE c.project_id = ${project_id} AND c.parent_comment_id is null order by c.date DESC`;
                      
            }
    else if (user_id == 4 && document_id || user_id == 3 && document_id){ 
    query = `SELECT c.comment_id,c.parent_comment_id,c.comment,c.audio,c.date,c.recipient_id,IFNULL(c.recipient, '') as recipient,
    IFNULL(c.category_id_list, '') as category_id_list,
    IFNULL(c.category_list, '') as category_list,
    u.name,u.user_img, 
    u.user_id as comment_user_id,
    (SELECT CAST(
      IFNULL( CONCAT(
        '[',
        GROUP_CONCAT(
          JSON_OBJECT(
            'comment_id',
            com.comment_id,
            'parent_comment_id',
            com.parent_comment_id,
            'comment',
            com.comment,
            'audio',
            com.audio,
            'recipient_id',
            com.recipient_id,
            "recipient",
            com.recipient,
            'category_id_list',
            com.category_id_list,
            "category_list",
            com.category_list,
            'date',
           com.date,
           'comment_user_id',
           user.user_id,
            'comment_by',
            user.name,
            'user_img',
            user.user_img
  
          )
        ),
        ']'
        ) , '[]') AS JSON
    ) FROM comments com  
    JOIN users user ON com.user_id = user.user_id
    WHERE com.parent_comment_id is not null and com.parent_comment_id = c.comment_id ) as replies
    FROM comments c 
    JOIN users u ON u.user_id = c.user_id WHERE c.document_id = ${document_id} AND c.parent_comment_id is null order by c.date DESC`;
         
  }
  else if(document_id){
            query = `SELECT c.comment_id,c.parent_comment_id,c.comment,c.audio,c.date,c.recipient_id,IFNULL(c.recipient, '') as recipient,
            u.name,u.user_img,
            u.user_id as comment_user_id,
            (SELECT CAST(
              IFNULL(CONCAT(
                '[',
                GROUP_CONCAT(
                  JSON_OBJECT(
                    'comment_id',
                    com.comment_id,
                    'parent_comment_id',
                    com.parent_comment_id,
                    'comment',
                    com.comment,
                    'audio',
                    com.audio,
                    'recipient_id',
                    com.recipient_id,
                    "recipient",
                    com.recipient,
                    'date',
                   com.date,
                   'comment_user_id',
                   user.user_id,
                    'comment_by',
                    user.name,
                    'user_img',
                    user.user_img
          
                  )
                ),
                ']'
                ) , '[]') AS JSON
            ) FROM comments com 
            JOIN users user ON com.user_id = user.user_id
            WHERE com.parent_comment_id is not null and com.parent_comment_id = c.comment_id ) as replies
            FROM comments c 
            JOIN users u ON u.user_id = c.user_id WHERE c.document_id = ${document_id} AND c.parent_comment_id is null order by c.date DESC`;
                    
          }
    // Query generator can generate a insert query based on object we passed
          // console.log("QQQUERY",query)
    return await database.connection.promise().query(QueryGenerator.format(query, {user_id,document_id}))
    

  },
   /* --------------------------- Get Customer ends here -------------------------- */
 
 
 
 
 
   // update
 
   async findByIdAndUpdate(duration_id, durationdata) {
 console.log(durationdata,duration_id );
     let query = QueryGenerator.update('master_data', durationdata, { duration_id: duration_id })
 console.log(query);
     return await database.connection.promise().query(query)
 
   },
   // delete
   async findByIdAndDelete(id) {
 
     let query = QueryGenerator.format(`DELETE FROM utilities where util_id =? `, [id])
 
     return await database.connection.promise().query(query)
 
   },
    async findByIdAndDeleteDocument(id) {
 
     let query = QueryGenerator.format(`DELETE FROM project_documents where document_id =? `, [id])
 
     return await database.connection.promise().query(query)
 
   },
  async getDuration() {
  let  query = `SELECT duration, duration_type FROM master_data`;
 
 
     // Query generator can generate a insert query based on object we passed
 
     return await database.connection.promise().query(QueryGenerator.format(query, {}))
 

 
   },
   
 async deletecomment(comment_id){
let query = `delete from comments where comment_id = ${comment_id} or parent_comment_id = ${comment_id}`

  //console.log("come module------------------->",query)

  return await database.connection.promise().query(QueryGenerator.format(query))
  },

  async UpdateNoty(noti_id){
    let query = `update notifications set read_status = 1 where noti_id = ${noti_id}`

    return await database.connection.promise().query(QueryGenerator.format(query))
  }
 
 }
 
 module.exports = UtilsModel
 