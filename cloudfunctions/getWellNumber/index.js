const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

exports.main = async (event, context) => {
    const MAX_LIMIT = 100
    const countResult = await db.collection('WellNumber').count()
    const total = countResult.total
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    const tasks = []
  
    for (let i = 0; i < batchTimes; i++) {
      const promise = db.collection('WellNumber').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      tasks.push(promise)
    }
  
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => ({
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg,
    }))

  
}