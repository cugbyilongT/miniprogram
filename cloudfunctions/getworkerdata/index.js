// 云函数 getworksdata 的 index.js 文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command;
exports.main = async (event, context) => {
  try {
    // 从event中获取查询参数
    const { selectedOptions } = event;
    console.log("cloud2", selectedOptions)

    // 构建查询条件
    let query = db.collection('works');
    console.log("cloud1", selectedOptions)
    // 添加下拉菜单选项的查询条件
    Object.keys(selectedOptions).forEach(key => {
      const optionsArray = selectedOptions[key];
      // 检查属性对应的数组是否非空
      if (optionsArray && optionsArray.length > 0) {
        query = query.where({
          [key]: _.in(optionsArray)
        });
      }
    });


    console.log("cloud7", query)
    const res = await query.get();
    console.log("cloud3", res)
    return res;
  } catch (err) {
    return err;
  }
}
