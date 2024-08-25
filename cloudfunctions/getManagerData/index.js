// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
    const db = cloud.database();
    // const managerName = event.manager
    try {
        // 查询数据库，获取所有 role 为 manager 的用户
        const result = await db.collection('users')
          .where({
            role: 'manager'
          })
          .get()
      
        // 移除 password 项
        const dataWithoutPassword = result.data.map(({ password, ...rest }) => rest);
        console.log(dataWithoutPassword);
      
        // 返回查询结果
        return {
          success: true,
          data: dataWithoutPassword
        }
      } catch (error) {
        // 返回错误信息
        return {
          success: false,
          error: error.message
        }
      }

//   return {
//     event,
//     openid: wxContext.OPENID,
//     appid: wxContext.APPID,
//     unionid: wxContext.UNIONID,
//   }
}