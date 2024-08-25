const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const userDocs = await db.collection('users').get()
    const users = userDocs.data.map(doc => doc.account)
    return { success: true, users }
  } catch (error) {
    console.error(error)
    return { success: false, message: '获取用户失败，请重试' }
  }
}