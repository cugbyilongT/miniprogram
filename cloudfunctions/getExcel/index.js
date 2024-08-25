// 云函数中的代码，例如 listTemplates.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  const db = cloud.database();
  const PAGE_SIZE = event.pageSize || 10; // 每页显示的数量
  const page = event.page || 0; // 当前页码，第一页是 0
  const templatesFolder = '模板/'; // 你的模板文件夹路径
  
  const fileListResult = await db.collection('模板')
    .where({
      filePath: db.RegExp({
        regexp: `^${templatesFolder}.*\.xlsx$`, // 正则匹配表格文件
        options: 'i',
      }),
    })
    .skip(page * PAGE_SIZE) // 跳过已经查询过的记录
    .limit(PAGE_SIZE) // 限制每页显示的数量
    .get();
    console.log("fileListResult:",fileListResult);
  const fileList = fileListResult.data.map(fileInfo => fileInfo.filePath);

  // 获取文件的下载链接
  const tempUrlResult = await cloud.getTempFileURL({
    fileList: fileList,
  });

  return {
    fileList: tempUrlResult.fileList,
    page: page,
    pageSize: PAGE_SIZE,
    isLastPage: fileList.length < PAGE_SIZE, // 如果返回的文件数量小于每页数量，则为最后一页
  };
};