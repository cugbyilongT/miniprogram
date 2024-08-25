const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 删除work
exports.main = async (event, context) => {
  console.log(event)

  const res = await db.collection('works').doc(event._id).update({
    data: {
      deleted: true
    }
  })

  console.log("update work", res)
  return {
    code: 0,
    data: res
  }
}