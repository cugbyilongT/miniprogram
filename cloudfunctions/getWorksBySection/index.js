const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { Project_id, Task, Section, DateMouthDay, Work } = event

  try {
    const queryResult = await db.collection('works')
      .where({
        'Project_id': Project_id,
        'Task': Task,
        'Section': Section,
        'DateMouthDay': DateMouthDay,
        'Work': Work,
        'deleted': null 
      })
      .get()

    return {
      data: queryResult.data
    }
  } catch (err) {
    console.error('Error querying works', err)
    return {
      error: err.message
    }
  }
  
}