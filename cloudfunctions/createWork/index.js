const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
// createWork 云函数代码
exports.main = async (event, context) => {
  const workInfo = event.workInfo;
  const now = new Date();  // 获取服务器的当前时间
  now.setHours(now.getHours() + 8); // 转换为北京时间（UTC+8）
  const year = now.getFullYear();        // 年
  const month = (now.getMonth() + 1).toString().padStart(2, '0');  // 月
  const day = now.getDate().toString().padStart(2, '0');           // 日
  const hour = now.getHours().toString().padStart(2, '0');         // 时
  const minute = now.getMinutes().toString().padStart(2, '0');     // 分
  // const second = now.getSeconds.toString().padStart(2, '0');     // 秒

  // 合并年月日时分秒为一个完整的日期时间字符串
  const dateTime = `${year}-${month}-${day} ${hour}:${minute}`;
  console.log(dateTime);
  try {
    const project = await db.collection('projects').where({
      _id: workInfo.Project_id
    }).get();
    const work_message = project.data[0].work_message;
    const message = work_message[workInfo.Work].message;
    // 从 workInfo 获取 WorkerName
    const workerName = workInfo.Workername;
    // 创建一个新对象，包含当前时间和 WorkerName
    const workLog = {
      creator: workerName,
      Creation_time: dateTime
    };
    // 遍历 message 对象的所有属性
    Object.keys(message).forEach(key => {
        if (message[key].infoName === "worklog") {
            // 如果 infoName 匹配，则将新的日志对象添加到 value 数组中
            message[key].value.push(workLog);
        }
    });
    workInfo.message = message;
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