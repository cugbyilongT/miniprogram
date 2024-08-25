// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
    try {
      const db = cloud.database();
      const worksCollection = db.collection('works');
      const result = await worksCollection.get();
      return result;
    } catch (e) {
      console.error(e);
      return e;
    }
  }