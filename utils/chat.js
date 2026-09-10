const multer  = require('multer');
const path = require('path');
require('dotenv').config();
// const upload = multer({ dest: 'uploads/' })

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        const destination='./public/uploads/chat'
        cb(null,destination);
    },
    filename: function(req, file, cb){
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        // console.log("filename-----", path.extname(file.originalname))
      }
});

const fileUpload = multer({
    storage:storage
});

const Group_type = {
    Type_1 : 'project',
    Type_2 : 'team'
}

const Group_file_type = {
    Type_1 : 'image',
    Type_2 : 'video',
    Type_3 : 'document',
    Type_4 : 'audio'
}

const Report_type = {
    Type_1 : 'project',
    Type_2 : 'user'
}

const parseCategoryBucketMappings = (mappingValue = '') => {
    return mappingValue
        .split('|')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .reduce((acc, entry) => {
            const separatorIndex = entry.lastIndexOf(':');
            if (separatorIndex <= 0 || separatorIndex === entry.length - 1) {
                return acc;
            }

            const categoryName = entry.slice(0, separatorIndex).trim();
            const bucketName = entry.slice(separatorIndex + 1).trim();

            if (categoryName && bucketName) {
                acc[categoryName] = bucketName;
            }

            return acc;
        }, {});
}

const toFolderKey = (value = '') => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const defaultSpecialCategoryNames = ['CAD-GFC', 'OFFER & CONTACT DETAILS'];
const specialCategoryBucketMappings = parseCategoryBucketMappings(process.env.SPECIAL_CATEGORY_BUCKET_MAPPINGS || '');
const mappedSpecialCategoryNames = Object.keys(specialCategoryBucketMappings);
const specialCategoryNames = (process.env.GFC_CATEGORY_NAMES || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
const resolvedSpecialCategoryNames = mappedSpecialCategoryNames.length > 0
    ? mappedSpecialCategoryNames
    : (specialCategoryNames.length > 0 ? specialCategoryNames : defaultSpecialCategoryNames);

const Category = {
    category_name : resolvedSpecialCategoryNames[0] || defaultSpecialCategoryNames[0],
    category_name_2 : resolvedSpecialCategoryNames[1] || defaultSpecialCategoryNames[1],
    special_category_names : resolvedSpecialCategoryNames
}

const getCategoryBucketName = (categoryName) => {
    if (categoryName && specialCategoryBucketMappings[categoryName]) {
        return specialCategoryBucketMappings[categoryName];
    }

    return process.env.GFC_BUCKET;
}

const getCategoryFolderType = (categoryName) => {
    if (!categoryName) {
        return 'category';
    }

    return `category_${toFolderKey(categoryName)}`;
}

const AWS_file_type = {
    Type_1 : 'project_completed_document',
    Type_2 : 'gfc_document'
}

const Group_access = {
    Type_1 : 'unLinkedUser',
    Type_2 : 'linkedUser'
}

const Chat_message_limit = 30;

const user_limit = 10;


module.exports = {Group_type,fileUpload,Report_type,Category,Group_access,Group_file_type,AWS_file_type,Chat_message_limit,user_limit,getCategoryBucketName,getCategoryFolderType};