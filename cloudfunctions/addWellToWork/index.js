const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

exports.main = async (event, context) => {
  const { _id, workWell, startWell, endWell } = event;

  try {
    const updateData = {};

    if (workWell) {
      // 如果 workWell 非空,则添加 workWell 字段
      updateData['workWell'] = workWell;
    } else {
      // 如果 workWell 为空,则添加 startWell 和 endWell 字段
      updateData['startWell'] = startWell;
      updateData['endWell'] = endWell;
    }

    const res = await db.collection('works').doc(_id).update({
      data: {
        $set: updateData
      }
    });

    console.log("update work", res);
    return {
      code: 0,
      data: res
    }
  } catch (err) {
    console.error("Error updating document:", err);
    return {
      code: -1,
      error: err.message
    }
  }
}