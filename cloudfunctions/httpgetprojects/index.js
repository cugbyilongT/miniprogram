// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const projectsCollection = db.collection('projects')
  // 设置 CORS 头部
  const headers = {
    'Access-Control-Allow-Origin': '*', // 允许所有域名访问，或者指定域名如 https://example.com
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // 允许的方法
    'Access-Control-Allow-Headers': 'Content-Type', // 允许的请求头
    'Access-Control-Max-Age': '86400' // 预检请求的缓存时间(秒)
  };
  try {
    // 如果是OPTIONS请求，返回204状态码（无内容响应）
    if (event.body.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }
    const res = await projectsCollection.get()
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(res.data)
    }
  } catch (err) {
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ error: err.message })
    }
  }
}