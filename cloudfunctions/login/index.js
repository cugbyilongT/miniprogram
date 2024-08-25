const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  //console.log(event)
  try {
    
    const { account, password } = event
    const userDoc = await db.collection('users').where({ account }).get()
    console.log(account, password)
    if (userDoc.data.length === 0) {
      return { success: false, message: '邮箱不存在' }
    }

    const user = userDoc.data[0]
    console.log(user.password)
    // 这里假设你已经实现了密码的哈希加密
    if (user.password !== hashPassword(password)) {
      return { success: false, message: '密码错误' }
    }

    return { success: true, user }
  } catch (error) {
    console.error(error)
    return { success: false, message: '登录失败，请稍后重试' }
  }
}

// 这是一个简单的密码哈希函数示例，实际项目中你应该使用更安全的加密算法
function hashPassword(password) {
  return password // 这里只是为了演示，实际项目中应该进行加密
}