/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-01-22 12:07:11
 * @desc [description]
 */
 const { database } = require("../config/database")
const { addDocument } = require("../controllers/projects.controller")
 const QueryGenerator = require("../generators/query.generator")
 const { Category } = require("../utils/chat")

 const getSpecialCategoryNames = () => {
  if (Array.isArray(Category.special_category_names) && Category.special_category_names.length > 0) {
    return Category.special_category_names;
  }
  return [Category.category_name].filter(Boolean);
 }

 const getSpecialCategoryNamesSql = () => getSpecialCategoryNames()
  .map((name) => `'${name.replace(/'/g, "\\'")}'`)
  .join(',');
 
 
 const ProjectModel = {
 
 
   // Create Customer machine
   async create(project) {
 
     // Query generator can generate a insert query based on object we passed
     return await database.connection.promise().query(QueryGenerator.insert("projects", project))
   },
   async mapCategory(project) {
    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.insert("category_project_xref", project))
  },

  async getMappedProjectCategoryIds(project_id, categoryIds) {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return [[], []];
    }

    const categoryIdsSql = categoryIds
      .map((categoryId) => Number(categoryId))
      .filter((categoryId) => !Number.isNaN(categoryId));

    if (categoryIdsSql.length === 0) {
      return [[], []];
    }

    const query = QueryGenerator.format(`select distinct category_id from category_project_xref where project_id = ${project_id} and category_id in (${categoryIdsSql.join(',')})`);
    return await database.connection.promise().query(query)
  },

  async getVwRights(data){
    //console.log("VW DATA--->",data);
    let project_id = data.project_id;
    let user_id = data.user_id;

    let query = QueryGenerator.format(`select vw_rights from category_project_xref where project_id = ${project_id} and user_id in (${user_id})`);
    return await database.connection.promise().query(query)
  },

  async putCategory(project) {
    var user_id = project.user_id;
    var project_id = project.project_id;
    var statuschange = project.vw_rights;
    if(project.category_id){
      let query = QueryGenerator.format(`update category_project_xref set vw_rights = '${statuschange}' where user_id in (${user_id}) and project_id = ${project_id} and category_id = ${project.category_id}`);
      return await database.connection.promise().query(query)
    }
    let query = QueryGenerator.format(`update category_project_xref set vw_rights = '${statuschange}' where user_id in (${user_id}) and project_id = ${project_id}`);
    return await database.connection.promise().query(query)
    // Query generator can generate a insert query based on object we passed
    //return await database.connection.promise().query(QueryGenerator.insert("category_project_xref", project))
  },

  async mapUsers(project) {
    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.insert("category_project_xref", project))
  },

  async deleteMapUser(DelData) {
    var getUserid= DelData.userid;
    var getProjectid= DelData.projectid;
    let query = QueryGenerator.format(`DELETE FROM category_project_xref where user_id =${getUserid} and project_id =${getProjectid} `);
    return await database.connection.promise().query(query)
  },

  async deleteCategoryMapUser(DelData) {
    const {user_id,project_id,category_id} = DelData;
    let query = QueryGenerator.format(`DELETE FROM category_project_xref where user_id =${user_id} and project_id =${project_id} and category_id =${category_id}`);
    return await database.connection.promise().query(query)
  },

  async CheckTeamProject(data) {
    const {user_id,team_id,project_id} = data;
    let query = QueryGenerator.format(`select t.team_id,cp.project_id,category_id
                from teams_users t inner join users u on t.user_id = u.user_id 
                inner join category_project_xref cp on cp.project_id = t.project_id 
                where u.user_id = ${user_id}
                and cp.project_id = ${project_id}
                and cp.user_id = u .user_id
                and t.team_id = ${team_id};`);
    return await database.connection.promise().query(query)
  },

  async addDocument(doc) {
 
    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.insert("project_documents", doc))
  },

  async addAccess(proo){
  //  console.log("proooooo---------->",proo)
    return await database.connection.promise().query(QueryGenerator.insert("category_project_xref", proo))
  },


  async editDocument(document_id,doc) {
    
    let query = QueryGenerator.update('project_documents', doc, { document_id: document_id })
    return await database.connection.promise().query(query)

    // Query generator can generate a insert query based on object we passed
    //return await database.connection.promise().query(QueryGenerator.insert("project_documents", doc))
  },
   /* ---------------------------- Get Customer Details starts ---------------------------- */
 
   async find(
     { user_id,role,project_name,created_by,team_id }
   ) {
     /* ------------------------ Setting initial variables ----------------------- */
     let cond = ``;
 
     if (user_id) {
       cond = `WHERE xcat.user_id = ${user_id}`
     }
 
     // cond = cond.length ? ` WHERE ${cond.join(' AND ')}` : ''
 
 if (user_id == 4 || user_id == 3){
  query = `SELECT p.project_id,p.project_name,p.project_img,p.city,p.state,p.latitude,p.longitude,
  p.address,p.status,p.start_date,p.end_date,p.description,unmc.user_id as un_readed_user_id
  FROM projects p 
  LEFT JOIN un_read_message_details unmc on unmc.project_id = p.project_id
  where created_by = "${created_by}" ORDER by p.project_name ASC`
 }else{
  if(created_by !== null){
      query = `SELECT p.project_id,p.project_name,p.project_img,p.city,p.state,p.latitude,p.longitude,
      p.address,p.status,p.start_date,p.end_date,p.description,unmc.user_id as un_readed_user_id
      FROM category_project_xref xcat 
      JOIN projects p ON p.project_id = xcat.project_id
      LEFT JOIN un_read_message_details unmc on unmc.project_id = p.project_id
      WHERE xcat.user_id = ${user_id} AND p.status != 'Cancelled' AND p.created_by = '${created_by}'
      GROUP BY xcat.project_id ORDER by p.project_name ASC`
  }else{
    query = `SELECT p.project_id,p.project_name,p.project_img,p.city,p.state,p.latitude,p.longitude,
    p.address,p.status,p.start_date,p.end_date,p.description,unmc.user_id as un_readed_user_id
    FROM category_project_xref xcat 
    JOIN projects p ON p.project_id = xcat.project_id
    LEFT JOIN un_read_message_details unmc on unmc.project_id = p.project_id
    WHERE xcat.user_id = ${user_id} AND p.status != 'Cancelled' 
    GROUP BY xcat.project_id ORDER by p.project_name ASC`
  }
  
  }
    
  if(project_name){
    query = `select *,unmc.user_id as un_readed_user_id from projects p
    LEFT JOIN un_read_message_details unmc on unmc.project_id = p.project_id where p.project_name = '${project_name}'`
  }
if(team_id){
    query=`select *,unmc.user_id as un_readed_user_id from projects 
    select * from projects p
    LEFT JOIN un_read_message_details unmc on unmc.project_id = p.project_id where p.teams_id = ${team_id}`
  }
 
     // Query generator can generate a insert query based on object we passed
 console.log("GET PROJECTS",query)
     return await database.connection.promise().query(QueryGenerator.format(query, {}))
 
   },

   async getUnmappedProjectData(created_by){
    let query = QueryGenerator.format(`SELECT p.project_id, p.project_name, p.project_img, p.city, p.state, p.latitude, p.longitude,
    p.address, p.status, p.start_date, p.end_date, p.description
    FROM projects p
    LEFT JOIN teams_project tp ON tp.project_id = p.project_id AND p.created_by = '${created_by}'
    WHERE tp.project_id IS NULL
    ORDER BY p.project_name ASC;`);
    return await database.connection.promise().query(query)
  },
 
   /* --------------------------- Get Projects ends here -------------------------- */
  
   async getmappedUsers(
    { project_id,user_id }
  ) {


    /* ------------------------ Setting initial variables ----------------------- */
    

 query = `SELECT 
 DISTINCT i.name,
 i.user_id,
 i.user_img,
 i.mobile_no,
 i.email,
 i.role_id,
 xcat.category_id,
 (select category_name from available_categories where category_id = i.prof) as prof,
 xcat.vw_rights
 FROM category_project_xref xcat
 JOIN users i ON i.user_id = xcat.user_id  
 JOIN projects p ON  p.project_id = xcat.project_id
 WHERE xcat.project_id = ${project_id} AND i.role_id != 1
 Order BY i.name ASC`
 

 


    // Query generator can generate a insert query based on object we passed

    return await database.connection.promise().query(QueryGenerator.format(query, {project_id}))

  },



  async checkmappedUsers(
    { project_id,user_id,category_id }
  ) {


    /* ------------------------ Setting initial variables ----------------------- */
    

 query = `SELECT 
 i.user_id,
 i.name,
 i.user_img,
 i.mobile_no,
 i.email
 FROM category_project_xref xcat
 JOIN users i ON i.user_id = xcat.user_id  
 JOIN projects p ON  p.project_id = xcat.project_id
 WHERE xcat.project_id = ${project_id} AND xcat.user_id in (${user_id}) 
 GROUP BY xcat.user_id`
 


    // Query generator can generate a insert query based on object we passed

    return await database.connection.promise().query(QueryGenerator.format(query, {project_id}))

  },
 
   async getDocuments(
    { project_id,category_id,users_id,uid }
  ) {
    /* ------------------------ Setting initial variables ----------------------- */
    // console.log("category_id----------->",category_id)
  if(!category_id){
    // console.log("if......................................................")
//  query = `SELECT 
//          i.document_id,
//          i.file_name,
//          i.file,
//          i.user_id,
//           u.name,
//          i.created_at,
//          i.description,
//          i.project_id,
//   (SELECT COUNT(v.comment_id) FROM comments v WHERE v.document_id = i.document_id) as commentsCount
//  FROM category_project_xref xcat
//  JOIN users u ON u.user_id = i.user_id  
//  JOIN project_documents i ON  i.project_id = xcat.project_id
//  WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (${users_id}) AND i.category_id is null
//  GROUP BY i.document_id`
      if (uid == 4){
      query = `SELECT 
      i.document_id,
      i.file_name,
      i.file,
      i.user_id,
      u.name,
      i.created_at,
      i.description,
      i.project_id,
      i.category_id,

      (SELECT COUNT(v.comment_id) FROM comments v WHERE v.document_id = i.document_id) as commentsCount
      FROM category_project_xref xcat
      JOIN project_documents i ON  i.project_id = xcat.project_id
      JOIN users u ON u.user_id = i.user_id
      WHERE xcat.user_id IN (${users_id}) AND xcat.project_id = ${project_id}
      GROUP BY i.document_id `
      }
      else{
        const specialCategoryNamesSql = getSpecialCategoryNamesSql();
        query = `SELECT 
      i.document_id,
      i.file_name,
      i.file,
      i.user_id,
      u.name,
      i.created_at,
      i.description,
      i.project_id,
      i.category_id,

      (SELECT COUNT(v.comment_id) FROM comments v WHERE v.document_id = i.document_id) as commentsCount
      FROM category_project_xref xcat
      JOIN project_documents i ON  i.project_id = xcat.project_id
      JOIN users u ON u.user_id = i.user_id
      JOIN projects po ON po.project_id = xcat.project_id
      LEFT JOIN available_categories ac ON ac.category_id = i.category_id
      WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (${users_id}) AND po.status != "Completed"
      AND (ac.category_name IS NULL OR ac.category_name NOT IN (${specialCategoryNamesSql}))
      GROUP BY i.document_id `
      }
        }else{
      if(users_id){
        query = `SELECT 
        i.document_id,
        i.file_name,
        i.file,
        i.user_id,
        u.name,
        i.created_at,
        i.description,
        i.project_id,
        i.category_id,
  
        (SELECT COUNT(v.comment_id) FROM comments v WHERE v.document_id = i.document_id) as commentsCount
        FROM category_project_xref xcat
        JOIN project_documents i ON  i.project_id = xcat.project_id
        JOIN users u ON u.user_id = i.user_id
        WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (${users_id}) AND i.category_id = ${category_id}
        GROUP BY i.document_id `
      }else{
          query = `SELECT 
      i.document_id,
      i.file_name,
      i.file,
      i.user_id,
      u.name,
      i.created_at,
      i.description,
      i.project_id,
      i.category_id,

      (SELECT COUNT(v.comment_id) FROM comments v WHERE v.document_id = i.document_id) as commentsCount
      FROM category_project_xref xcat
      JOIN project_documents i ON  i.project_id = xcat.project_id
      JOIN users u ON u.user_id = i.user_id
      WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (${uid}) AND i.category_id = ${category_id}
      GROUP BY i.document_id `}
  }
    // Query generator can generate a insert query based on object we passed
    return await database.connection.promise().query(QueryGenerator.format(query, {project_id,category_id}))

  },
async getDocid(project_id,users_id,category_id){
  let query
  if(category_id){
    query = `select vw_rights from category_project_xref where project_id=${project_id} and user_id in (${users_id}) and category_id = ${category_id}`;
  }else{
    query = `select vw_rights from category_project_xref where project_id=${project_id} and user_id in (${users_id})`;
  }
  console.log("Query-->",query);
  return await database.connection.promise().query(QueryGenerator.format(query))

},
  async getDocumentsByRights(
    { project_id,category_id,users_id,doc_id }
  ) {


    /* ------------------------ Setting initial variables ----------------------- */
    
  if(!category_id){ 


    query=
    `SELECT 
             i.document_id,
             i.file_name,
             i.file,
             i.user_id,
             i.created_at,
             i.description,
             i.project_id,
             u.name,
             (SELECT COUNT(v.comment_id) FROM comments v WHERE v.document_id in (${doc_id})) as commentsCount 
 FROM project_documents i 
 JOIN users u ON u.user_id = i.user_id  
 where i.document_id in (${doc_id})
             `
//  query = `SELECT 
//          i.document_id,
//          i.file_name,
//          i.file,
//          i.user_id,
//           u.name,
//          i.created_at,
//          i.description,
//          i.project_id,
//          xcat.vw_rights,
//   (SELECT COUNT(v.comment_id) FROM comments v WHERE v.document_id = i.document_id) as commentsCount
//  FROM category_project_xref xcat
//  JOIN users u ON u.user_id = xcat.user_id  
//  JOIN project_documents i ON  i.project_id = xcat.project_id
//  WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (${users_id}) AND i.category_id is null
//  GROUP BY i.document_id`
  }else{
    query = `SELECT i.document_id, i.file_name, i.file, i.user_id, u.name, i.created_at, 
    i.description,xcat.vw_rights, (SELECT COUNT(v.comment_id) FROM comments v 
    WHERE v.document_id = i.document_id) as commentsCount FROM 
    category_project_xref xcat JOIN users u ON u.user_id = xcat.user_id 
    JOIN project_documents i ON i.category_id = xcat.category_id
    WHERE i.category_id = ${category_id} and i.project_id = ${project_id} AND xcat.user_id IN (${users_id})
    GROUP BY i.document_id`
  }
   

// console.log("queryyyyyyyyyyyyy",query)
    // Query generator can generate a insert query based on object we passed

    return await database.connection.promise().query(QueryGenerator.format(query, {project_id,category_id}))

  },

  async checkProjectDuplication(projectData) {
    let query = `Select * from projects where project_name = '${projectData.project_name}' and project_id = ${projectData.project_id}`
    return await database.connection.promise().query(QueryGenerator.format(query))
  },
  async checkProjectValidation(project_name) {
    let query = `Select * from projects where project_name = '${project_name}'`
    return await database.connection.promise().query(QueryGenerator.format(query))
  },
  async getDocumentDetails(project_id){
    var getDelid= project_id.project_id;
      query = `select * FROM project_documents where document_id=(${getDelid})`;

      return await database.connection.promise().query(QueryGenerator.format(query))
    
    },

    async getDocumentByProjectIdAnddocumentId({project_id,document_id,file_name}){
        query = `select * FROM project_documents where project_id=${project_id} 
                 and document_id=${document_id} and file_name='${file_name}'`;
  
        return await database.connection.promise().query(QueryGenerator.format(query))
      
      },

      async getDocumentByProjectId(project_id){
        query = `select * FROM project_documents where project_id=${project_id}`;
  
        return await database.connection.promise().query(QueryGenerator.format(query))
      
      },

    async deleteDocuments(project_id) {
      var getDelid= project_id.project_id;
      let query = QueryGenerator.format(`DELETE FROM project_documents where document_id =? `, [getDelid]);
      return await database.connection.promise().query(query)
  
    },

    async deletemultipleDocuments(project_id) {
      let query = QueryGenerator.format(`DELETE FROM project_documents where document_id in(${project_id})`);
      return await database.connection.promise().query(query)
  
    },
  

 
 
   // update
 
   async findByIdAndUpdate(project_id, project) {
 
     let query = QueryGenerator.update('projects', project, { project_id: project_id })
 
     return await database.connection.promise().query(query)
 
   },
   // delete
   async findByIdAndDelete(project_id) {
 
     let query = QueryGenerator.format(`DELETE FROM projects where project_id =? `, [project_id])
 
     return await database.connection.promise().query(query)
 
   },

   async getProjectDocumentbyId(project_id){
    let query = QueryGenerator.format(`select * from project_documents where document_id = ${project_id}`)
 
    return await database.connection.promise().query(query)
   },

   async getProject(data){
    let query = QueryGenerator.format(`select * from projects where project_id = (${data}) order by project_name ASC`)
    return await database.connection.promise().query(query)
  },

  async projectsAddInTeam(cat){
    return await database.connection.promise().query(QueryGenerator.insert("teams_project", cat))
  },

  async getProjectByTeam(teams_id,project_id){

    let query;
    if(project_id && project_id[0] !== null){
      query = QueryGenerator.format(`select t.id,t.project_id,t.team_id,p.project_id,p.project_name,p.project_img,p.city,p.state,p.address,p.status,p.start_date,p.end_date,p.description,p.latitude,p.longitude,unmc.user_id as un_readed_user_id
      from teams_project t inner join projects p on t.project_id = p.project_id 
      left join un_read_message_details unmc on unmc.project_id = p.project_id
      where t.team_id = ${teams_id} 
      and t.project_id in (${project_id}) order by p.project_name ASC`)  
    }else{
      query = QueryGenerator.format(`select t.id,t.project_id,t.team_id,p.project_id,p.project_name,p.project_img,p.city,p.state,p.address,p.status,p.start_date,p.end_date,p.description,p.latitude,p.longitude,unmc.user_id as un_readed_user_id
      from teams_project t inner join projects p on t.project_id = p.project_id 
      left join un_read_message_details unmc on unmc.project_id = p.project_id
      where t.team_id = ${teams_id} order by p.project_name ASC`)
    }
    return await database.connection.promise().query(query)
  },
  async getProjectIdbyTeams(teams_id,user_id){
    let query = QueryGenerator.format(`select * from teams_users where team_id = ${teams_id} and user_id = ${user_id}`)
    return await database.connection.promise().query(query)
  },
  
  async getProjectsbyTeams(project_id){
    let query = QueryGenerator.format(`select * from teams_project where project_id = ${project_id}`)
    return await database.connection.promise().query(query)
  },

  async deleteProjectInTeams(project_id){
    let query = QueryGenerator.format(`delete from teams_project where project_id = ${project_id}`)
    return await database.connection.promise().query(query)
  },

  async getTeamsProjectsByProjectId(project_id){
    let query = QueryGenerator.format(`select * from teams_project where project_id in (${project_id})`);
    return await database.connection.promise().query(query)
  },
  
  async getCategoryByCatId(category_id){
    let query = QueryGenerator.format(`select * from available_categories where category_id = ${category_id}`);
    return await database.connection.promise().query(query)
  },

  async deleteNotification(project_id,document_id){
    let query;
    if(document_id){
        query = QueryGenerator.format(`delete from notifications where document_id in (${document_id})`);      
    }else{
        query = QueryGenerator.format(`delete from notifications where project_id = ${project_id}`);
    }
    return await database.connection.promise().query(query)
  },
  async projectDocumentsByProjectId(project_id){
    let query =`SELECT po.project_name,i.document_id,i.file_name,i.file,i.user_id,u.name,i.created_at,i.description,i.project_id,i.category_id 
                FROM category_project_xref xcat
                JOIN project_documents i ON  i.project_id = xcat.project_id
                JOIN users u ON u.user_id = i.user_id
                JOIN projects po ON po.project_id = xcat.project_id
                WHERE xcat.project_id = ${project_id}
                AND xcat.user_id = u.user_id`
    return database.connection.promise().query(query);
  },
  // Create current project
  async currentProjectcreate(project) {
  // Query generator can generate a insert query based on object we passed
  return await database.connection.promise().query(QueryGenerator.insert("current_project", project))
  },
    // get current project
  async getcurrentProject(user_id) {
  // Query generator can generate a insert query based on object we passed
  return await database.connection.promise().query(QueryGenerator.format(`select p.project_name,p.project_id,p.project_img,p.city,p.state,p.latitude,p.longitude,p.address,p.status,p.start_date,p.end_date,p.description from current_project cp join projects p on cp.project_id = p.project_id where cp.user_id = ${user_id}`))
  },
    // update current project
  async updateCurrentProject(projectData) {
  // Query generator can generate a insert query based on object we passed
  return await database.connection.promise().query(QueryGenerator.format(`update current_project set project_id = '${projectData.project_id}' where user_id = ${projectData.user_id}`))
  },
  async getAttendanceUsers({ project_id,user_id }) {
    query = `SELECT 
    DISTINCT i.name,
    i.user_id,
    i.role_id,
    p.project_name,
    p.project_id
    FROM category_project_xref xcat
    JOIN users i ON i.user_id = xcat.user_id  
    JOIN user_attendances us on us.user_id = i.user_id
    JOIN projects p ON  p.project_id = xcat.project_id
    WHERE xcat.project_id = ${project_id} AND i.role_id in(2,5)
    Order BY i.name ASC`

    return await database.connection.promise().query(QueryGenerator.format(query, {project_id}))

  },
  async getUserProjects({ user_id }) {
    query = `SELECT 
    DISTINCT p.project_id,
    i.user_id,
    i.name,
    i.role_id,
    p.project_name
    FROM category_project_xref xcat
    JOIN users i ON i.user_id = xcat.user_id  
    JOIN user_attendances us on us.user_id = i.user_id
    JOIN projects p ON  p.project_id = xcat.project_id
    WHERE i.user_id = ${user_id} AND i.role_id in (2,5)
    Order BY p.project_name ASC;`

    return await database.connection.promise().query(QueryGenerator.format(query, {user_id}))

  },    
     // Create S3 bucket Name In DB
     async createS3FolderDetails(bucketData) {
      // Query generator can generate a insert query based on object we passed
      return await database.connection.promise().query(QueryGenerator.insert("aws_folders", bucketData))
    },
      // Store S3 uploaded file in localDB
      async createS3UploadedFileDetails(bucketData) {
      // Query generator can generate a insert query based on object we passed
      return await database.connection.promise().query(QueryGenerator.insert("s3_uploaded_files", bucketData))
    },
    async getS3FolderData(data){
      let query = `select * from aws_folders where project_id = ${data.project_id} and type = '${data.type}'`;
      if (data.fallbackType) {
        query = `select * from aws_folders where project_id = ${data.project_id} and type in ('${data.type}','${data.fallbackType}') order by case when type = '${data.type}' then 0 else 1 end`;
      }
      query = QueryGenerator.format(query)
      return await database.connection.promise().query(query)
    },
    async getDocumentData(document_id){
        query = `select * from project_documents where document_id=${document_id}`;
        return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async getS3DocumentData(document_id){
      query = `select * from s3_uploaded_files where document_id=${document_id}`;
      return await database.connection.promise().query(QueryGenerator.format(query))
    },
    async deleteS3DocumentData(document_id){
      query = `delete from s3_uploaded_files where document_id=${document_id}`;
      return await database.connection.promise().query(QueryGenerator.format(query))
    },
 }
 
 
 module.exports = ProjectModel
 