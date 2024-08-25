const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command;
exports.main = async (event, context) => {
  try {
    // 从event中获取查询参数
    const { selectedOptions, dateRange } = event;
    console.log('查询参数:', { selectedOptions, dateRange });

    // 构建查询条件
    let query = db.collection('works');

    // 添加日期范围的查询条件
    const startDate = dateRange.start ? new Date(`${dateRange.start}T00:00:00.000Z`) : null;
    const endDate = dateRange.end ? new Date(`${dateRange.end}T23:59:59.999Z`) : null;

    const condition = {};

    if (startDate && endDate) {
      condition.Date = _.gte(startDate.toISOString()).and(_.lt(endDate.toISOString()));
      console.log('日期范围查询条件:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
    } else if (startDate) {
      condition.Date = _.gte(startDate.toISOString());
      console.log('日期范围查询条件:', { startDate: startDate.toISOString() });
    } else if (endDate) {
      condition.Date = _.lt(endDate.toISOString());
      console.log('日期范围查询条件:', { endDate: endDate.toISOString() });
    }

    // 添加下拉菜单选项的查询条件
    Object.keys(selectedOptions).forEach(key => {
      const optionsArray = selectedOptions[key];
      if (optionsArray && optionsArray.length > 0) {
        condition[key] = _.in(optionsArray);
      }
    });
    console.log('查询条件:', condition);

    if (Object.keys(condition).length > 0) {
      query = query.where(condition);
      console.log('最终查询条件:', query);
    }

    const countResult = await db.collection('works').where(condition).count();
    const total = countResult.total;
    console.log('总条数:', total);
    // 通过for循环做多次请求，并把多次请求的数据放到一个数组里
    let all = [];
    const MAX_LIMIT = 100;
    for (let i = 0; i < total; i += MAX_LIMIT) {
      const list = await db.collection('works').skip(i).where(condition).limit(MAX_LIMIT).get();
      all = all.concat(list.data);
    }

    // 过滤掉包含 deleted: true 的条目
    const works = all.filter(entry => !entry.deleted);

    console.log("cloud2", works);
    return works;
  } catch (err) {
    return err;
  }
}