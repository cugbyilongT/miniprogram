const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
// createWork 云函数代码
exports.main = async (event, context) => {
  const workInfo = event.workInfo;

  try {
    const workId = await db.collection('works').add({
      data: workInfo
    });

    return {
      success: true,
      data: workId
    };
  } catch (err) {
    return {
      success: false,
      error: err
    };
  }
}