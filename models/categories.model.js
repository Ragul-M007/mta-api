/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-01-22 12:07:11
 * @desc [description]
 */
 const { database } = require("../config/database")
 const QueryGenerator = require("../generators/query.generator")
 const {Category} = require("../utils/chat")

 const getSpecialCategoryNames = () => {
   if (Array.isArray(Category.special_category_names) && Category.special_category_names.length > 0) {
     return Category.special_category_names;
   }
   return [Category.category_name].filter(Boolean);
 }

 const getSpecialCategoryNamesSql = () => getSpecialCategoryNames()
   .map((name) => `'${name.replace(/'/g, "\\'")}'`)
   .join(',');
 
 
 const categoriesModel = {
 
 
   // Create Customer machine
   async create(cat) {
 
     // Query generator can generate a insert query based on object we passed
     return await database.connection.promise().query(QueryGenerator.insert("available_categories", cat))
   },
 
   async checkCategory(category) {
    let query = `SELECT * FROM available_categories where category_name = '${category}'`;
      return await database.connection.promise().query(QueryGenerator.format(query))
  },

  async checkCategoryDuplication(category_name,category_id) {
    let query = `SELECT * FROM available_categories where category_name = '${category_name}' and category_id = ${category_id}`;
      return await database.connection.promise().query(QueryGenerator.format(query))
  },

    async getGfcCategoryDetails({project_id, user_id}) {
  const specialCategoryNamesSql = getSpecialCategoryNamesSql();
    const accessJoin = user_id ? `
      JOIN special_file_access sfa ON sfa.category_id = c.category_id AND sfa.user_id = ${user_id} AND sfa.is_active = 1` : '';
  let query= `SELECT c.category_id,c.category_name,c.description,xcat.project_id,
    (SELECT count(DISTINCT i.user_id) as usercounts
    FROM category_project_xref xcat
    JOIN users i ON i.user_id = xcat.user_id  
    WHERE xcat.project_id = ${project_id} and xcat.category_id = c.category_id) as user_count,

    (SELECT GROUP_CONCAT(i.user_id) as usercounts
    FROM category_project_xref xcat
    JOIN users i ON i.user_id = xcat.user_id  
    WHERE xcat.project_id = ${project_id} and xcat.category_id = c.category_id) as user_list,

    (SELECT count(i.document_id) FROM category_project_xref xcat
       JOIN project_documents i ON  i.project_id = xcat.project_id
       JOIN users u ON u.user_id = i.user_id
       WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (i.user_id) AND i.category_id = c.category_id) as document_counts
       
     FROM category_project_xref  xcat 
     JOIN available_categories c ON c.category_id = xcat.category_id
      ${accessJoin}
     WHERE xcat.project_id = ${project_id} 
    AND c.category_name IN (${specialCategoryNamesSql})
     group by c.category_id order by case 
     when c.category_name regexp '^[0-9]' then 1
     when c.category_name regexp '^[a-zA-Z]' then 2
     when c.category_name = '' or c.category_name is null then 3
     end
     , c.category_name * 1
     , c.category_name`
      return await database.connection.promise().query(QueryGenerator.format(query))
  },


 
   async getavailableCats() {
    //  return await database.connection.promise().query(
    //    QueryGenerator.format(`SELECT category_id , category_name, description, role_id FROM available_categories order by ASC`)
    //  )
    // let query = `SELECT category_id , category_name, description, role_id FROM available_categories
    // WHERE category_name != '${Category.category_name}'
    // order by case 
    // when category_name regexp '^[0-9]' then 1
    // when category_name regexp '^[a-zA-Z]' then 2
    // when category_name = '' or category_name is null then 3
    // end
    // , category_name * 1
    // , category_name`;

    let query = `SELECT category_id , category_name, description, role_id FROM available_categories
    order by case 
    when category_name regexp '^[0-9]' then 1
    when category_name regexp '^[a-zA-Z]' then 2
    when category_name = '' or category_name is null then 3
    end
    , category_name * 1
    , category_name`;

    return await database.connection.promise().query(QueryGenerator.format(query))
   },

   async getCatgorybyUser({user_id}) {
    let query = `SELECT * FROM category_project_xref where user_id = ${user_id}`;
      return await database.connection.promise().query(QueryGenerator.format(query))
  },
   /* ---------------------------- Get Customer Details starts ---------------------------- */
 
   async find(
     { project_id,user_id }
   ) {
     /* ------------------------ Setting initial variables ----------------------- */
    //  let cond = []
 
    //  if (project_id) {
    //    cond.push(`c.customer_id = :customer_id`)
    //  }
    //  if (shop_id) {
    //    cond.push(`c.shop_id = :shop_id`)
    //  }
 
    //  cond = cond.length ? ` WHERE ${cond.join(' AND ')}` : ''
 
 
    //  query = `SELECT c.category_id,c.category_name,c.description,xcat.project_id,(SELECT CAST(
    //    CONCAT(
    //      '[',
    //      GROUP_CONCAT(
    //        JSON_OBJECT(
    //          'user_id',
    //          i.user_id,
    //          'username',
    //          i.name,
    //          'user_img',
    //          i.user_img
    //        )
    //      ),
    //      ']'
    //    ) FOR JSON
    //  ) FROM users i WHERE i.user_id = xcat.user_id) as users
    //  FROM category_project_xref xcat 
    //  JOIN available_categories c ON c.category_id = xcat.category_id
    //  WHERE xcat.project_id = ${project_id}`
    let query
    if(user_id){
      query= `SELECT c.category_id,c.category_name,c.description,xcat.project_id,
    
      (SELECT count(DISTINCT i.user_id) as usercounts
      FROM category_project_xref xcat
      JOIN users i ON i.user_id = xcat.user_id  
      WHERE xcat.project_id = ${project_id} and xcat.category_id = c.category_id) as user_count,
      
      (SELECT count(i.document_id) FROM category_project_xref xcat
         JOIN project_documents i ON  i.project_id = xcat.project_id
         JOIN users u ON u.user_id = i.user_id
         WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (i.user_id) AND i.category_id = c.category_id) as document_counts
         
       FROM category_project_xref  xcat 
       JOIN available_categories c ON c.category_id = xcat.category_id
       WHERE xcat.project_id = ${project_id} and xcat.user_id = ${user_id}
       group by c.category_id order by case 
       when c.category_name regexp '^[0-9]' then 1
       when c.category_name regexp '^[a-zA-Z]' then 2
       when c.category_name = '' or c.category_name is null then 3
       end
       , c.category_name * 1
       , c.category_name`
    }else{
    query= `SELECT c.category_id,c.category_name,c.description,xcat.project_id,
    
    (SELECT count(DISTINCT i.user_id) as usercounts
    FROM category_project_xref xcat
    JOIN users i ON i.user_id = xcat.user_id  
    WHERE xcat.project_id = ${project_id} and xcat.category_id = c.category_id) as user_count,

    (SELECT GROUP_CONCAT(i.user_id) as usercounts
    FROM category_project_xref xcat
    JOIN users i ON i.user_id = xcat.user_id  
    WHERE xcat.project_id = ${project_id} and xcat.category_id = c.category_id) as user_list,

    (SELECT count(i.document_id) FROM category_project_xref xcat
       JOIN project_documents i ON  i.project_id = xcat.project_id
       JOIN users u ON u.user_id = i.user_id
       WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (i.user_id) AND i.category_id = c.category_id) as document_counts
       
     FROM category_project_xref  xcat 
     JOIN available_categories c ON c.category_id = xcat.category_id
     WHERE xcat.project_id = ${project_id} 
     group by c.category_id order by case 
     when c.category_name regexp '^[0-9]' then 1
     when c.category_name regexp '^[a-zA-Z]' then 2
     when c.category_name = '' or c.category_name is null then 3
     end
     , c.category_name * 1
     , c.category_name`
    }
 
    console.log("QQQ",query);
     // Query generator can generate a insert query based on object we passeds
 
     return await database.connection.promise().query(QueryGenerator.format(query, { project_id }))
 
   },

   async categoryfind(
    { project_id,user_id }
  ) {
    /* ------------------------ Setting initial variables ----------------------- */
   //  let cond = []

   //  if (project_id) {
   //    cond.push(`c.customer_id = :customer_id`)
   //  }
   //  if (shop_id) {
   //    cond.push(`c.shop_id = :shop_id`)
   //  }

   //  cond = cond.length ? ` WHERE ${cond.join(' AND ')}` : ''


   //  query = `SELECT c.category_id,c.category_name,c.description,xcat.project_id,(SELECT CAST(
   //    CONCAT(
   //      '[',
   //      GROUP_CONCAT(
   //        JSON_OBJECT(
   //          'user_id',
   //          i.user_id,
   //          'username',
   //          i.name,
   //          'user_img',
   //          i.user_img
   //        )
   //      ),
   //      ']'
   //    ) FOR JSON
   //  ) FROM users i WHERE i.user_id = xcat.user_id) as users
   //  FROM category_project_xref xcat 
   //  JOIN available_categories c ON c.category_id = xcat.category_id
   //  WHERE xcat.project_id = ${project_id}`
  let query
  const specialCategoryNamesSql = getSpecialCategoryNamesSql();
   if(user_id){
     query= `SELECT c.category_id,c.category_name,c.description,xcat.project_id,
   
     (SELECT count(DISTINCT i.user_id) as usercounts
     FROM category_project_xref xcat
     JOIN users i ON i.user_id = xcat.user_id  
     WHERE xcat.project_id = ${project_id} and xcat.category_id = c.category_id) as user_count,
     
     (SELECT count(i.document_id) FROM category_project_xref xcat
        JOIN project_documents i ON  i.project_id = xcat.project_id
        JOIN users u ON u.user_id = i.user_id
        WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (i.user_id) AND i.category_id = c.category_id) as document_counts
        
      FROM category_project_xref  xcat 
      JOIN available_categories c ON c.category_id = xcat.category_id
      WHERE xcat.project_id = ${project_id} and xcat.user_id = ${user_id}
      AND c.category_name NOT IN (${specialCategoryNamesSql})
      group by c.category_id order by case 
      when c.category_name regexp '^[0-9]' then 1
      when c.category_name regexp '^[a-zA-Z]' then 2
      when c.category_name = '' or c.category_name is null then 3
      end
      , c.category_name * 1
      , c.category_name`
   }else{
   query= `SELECT c.category_id,c.category_name,c.description,xcat.project_id,
   
   (SELECT count(DISTINCT i.user_id) as usercounts
   FROM category_project_xref xcat
   JOIN users i ON i.user_id = xcat.user_id  
   WHERE xcat.project_id = ${project_id} and xcat.category_id = c.category_id) as user_count,

   (SELECT GROUP_CONCAT(i.user_id) as usercounts
   FROM category_project_xref xcat
   JOIN users i ON i.user_id = xcat.user_id  
   WHERE xcat.project_id = ${project_id} and xcat.category_id = c.category_id) as user_list,

   (SELECT count(i.document_id) FROM category_project_xref xcat
      JOIN project_documents i ON  i.project_id = xcat.project_id
      JOIN users u ON u.user_id = i.user_id
      WHERE xcat.project_id = ${project_id} AND xcat.user_id IN (i.user_id) AND i.category_id = c.category_id) as document_counts
      
    FROM category_project_xref  xcat 
    JOIN available_categories c ON c.category_id = xcat.category_id
    WHERE xcat.project_id = ${project_id} 
    AND c.category_name NOT IN (${specialCategoryNamesSql})
    group by c.category_id order by case 
    when c.category_name regexp '^[0-9]' then 1
    when c.category_name regexp '^[a-zA-Z]' then 2
    when c.category_name = '' or c.category_name is null then 3
    end
    , c.category_name * 1
    , c.category_name`
   }

   console.log("QQQ",query);
    // Query generator can generate a insert query based on object we passeds

    return await database.connection.promise().query(QueryGenerator.format(query, { project_id }))

  },
 
   /* --------------------------- Get Customer ends here -------------------------- */
 
 
  
   async getCatUsers(
    { project_id,category_id }
  ) {
   query= `SELECT 
   i.user_id,
   i.name,
   i.user_img,
   i.mobile_no,
   i.email,
   xcat.category_id,
   (select category_name from available_categories where category_id = i.prof) as prof
   FROM category_project_xref xcat
   JOIN users i ON i.user_id = xcat.user_id  
   WHERE xcat.project_id = ${project_id} and xcat.category_id = ${category_id}
   GROUP BY xcat.user_id order by i.name ASC`

    // Query generator can generate a insert query based on object we passed

    return await database.connection.promise().query(QueryGenerator.format(query, { project_id }))

  },
 

  async getAllCatUsersinProject(
     project_id 
  ) {
   query= `SELECT 
   i.user_id,
   i.name,
   i.user_img,
   i.mobile_no,
   i.email,
   i.prof
   FROM category_project_xref xcat
   JOIN users i ON i.user_id = xcat.user_id  
   WHERE xcat.project_id = ${project_id} 
   GROUP BY xcat.user_id order by i.name ASC`

    // Query generator can generate a insert query based on object we passed

    return await database.connection.promise().query(QueryGenerator.format(query, { project_id }))

  },

  async getCategoryUsersinProject(
    category_id, project_id 
  ) {
    console.log('QUERY PROJECT---------------------------->',query)
   query= `SELECT 
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
   WHERE xcat.category_id in (${category_id}) AND i.role_id != 1 and xcat.project_id = ${project_id}
   Order BY i.name ASC`

    console.log('QUERY CAT---------------------------->',query)
    // Query generator can generate a insert query based on object we passed

    return await database.connection.promise().query(QueryGenerator.format(query, { project_id }))

  },

 
   // update
 
   async findByIdAndUpdate(category_id, customer) {
 
     let query = QueryGenerator.update('available_categories', customer, { category_id: category_id })
 
     return await database.connection.promise().query(query)
 
   },
   // delete
   async findByIdAndDelete(category_id) {
 
     let query = QueryGenerator.format(`DELETE FROM available_categories where category_id =? `, [category_id])
 
     return await database.connection.promise().query(query)
 
   },

   async rmCat(category_id,project_id){
    let query = QueryGenerator.format(`Delete From category_project_xref where category_id = ${category_id} and project_id = ${project_id}`)

    return await database.connection.promise().query(query)
   },

  // Romove user from category
  //  async deleteCatUser(category_id,project_id){
  //   let query = QueryGenerator.format(`Delete From category_project_xref where category_id = ${category_id} and project_id = ${project_id}`)

  //   return await database.connection.promise().query(query)
  //  },

  async getCategoryDetails(category_name){
    let query = QueryGenerator.format(`select * from available_categories where category_name = '${category_name}'`)
    return await database.connection.promise().query(QueryGenerator.format(query))
  },

  async getCategoryDetailsByNames(categoryNames){
    const categoryList = (categoryNames || []).filter(Boolean);
    if (categoryList.length === 0) {
      return [[], []];
    }

    const categoryNamesSql = categoryList
      .map((name) => `'${name.replace(/'/g, "\\'")}'`)
      .join(',');

    let query = QueryGenerator.format(`select * from available_categories where category_name IN (${categoryNamesSql})`)
    return await database.connection.promise().query(QueryGenerator.format(query))
  },

  async getCategoryDetailsById(category_id){
    let query = QueryGenerator.format(`select * from available_categories where category_id = '${category_id}'`)
    return await database.connection.promise().query(QueryGenerator.format(query))
  },
 
 }
 
 
 module.exports = categoriesModel
 