const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { _id } = event
    const projectDoc = await db.collection('projects').doc(_id).get()
    if (!projectDoc.data) {
      return { success: false, message: '未找到指定项目' }
    }
    const members = projectDoc.data.members || []
    return { success: true, members }
  } catch (error) {
    console.error(error)
    return { success: false, message: '获取项目成员失败，请重试' }
  }
}