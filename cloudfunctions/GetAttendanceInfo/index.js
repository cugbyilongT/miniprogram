// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;

// 云函数入口函数
// 传入参数 selectedOptions: { Project: [], Workername: [], Work: [] }, dateRange: { start: '', end: '' }

exports.main = async (event, context) => {
  try {
    const { selectedOptions, dateRange } = event;
    console.log("event", event);
    const Project = selectedOptions.Project;
    const Workername = selectedOptions.Workername;
    const Work = ["情况记录"];
    selectedOptions.Work = Work;

    let query = db.collection('works');
    console.log(selectedOptions);
    console.log(dateRange);
    
    // 辅助函数：格式化日期为 ISO 字符串，考虑时区
    function formatDateToISO(dateString, isEndOfDay = false) {
      if (!dateString) return null;
      const [year, month, day] = dateString.split('-');
      let date = new Date(Date.UTC(year, month - 1, day));
      if (isEndOfDay) {
        date.setUTCHours(23, 59, 59, 999);
      } else {
        date.setUTCHours(0, 0, 0, 0); // 设置为当天的开始时间
      }
      // 转换为北京时间
      date = new Date(date.getTime() - 8 * 60 * 60 * 1000);
      return date.toISOString();
    }
    
    const today = new Date().toISOString();
    const startDate = formatDateToISO(dateRange.start);
    const endDate = formatDateToISO(dateRange.end, true);
    const defaultStartDate = new Date('2024-01-01T00:00:00Z').toISOString();
    
    console.log(startDate, endDate, defaultStartDate, today);
    
    const condition = {};
    if (startDate && endDate) {
      condition.Date = _.gte(startDate).and(_.lte(endDate));
      console.log('日期范围查询条件:', { startDate, endDate });
    } else if (startDate) {
      condition.Date = _.gte(startDate);
      console.log('日期范围查询条件:', { startDate });
    } else if (endDate) {
      condition.Date = _.lte(endDate);
      console.log('日期范围查询条件:', { endDate });
    } else {
      condition.Date = _.gte(defaultStartDate).and(_.lt(today));
      console.log('默认日期范围查询条件:', { startDate: defaultStartDate, endDate: today });
    }

    Object.keys(selectedOptions).forEach(key => {
      const optionsArray = selectedOptions[key];
      if (optionsArray && optionsArray.length > 0) {
        condition[key] = _.in(optionsArray);
      }
    });
    console.log('查询条件:', condition);
    console.log('最终查询条件:', JSON.stringify(condition, null, 2));

    const countResult = await db.collection('works').where(condition).count({ "_id": 1 });
    const total = countResult.total;
    console.log('总条数:', total);
    let all = [];
    const MAX_LIMIT = 100;
    for (let i = 0; i < total; i += MAX_LIMIT) {
      const list = await db.collection('works').skip(i).where(condition).field({
        Date: true,
        Project: true,
        Workername: true,
        message: true,
        deleted: true
      }).limit(MAX_LIMIT).get();

      all = all.concat(list.data);
    }
    console.log(all)
    const works = all.reduce((acc, entry) => {
      if (!entry.deleted && entry.message && entry.message.length > 0) {
        acc.push({
          WorkDate: entry.Date,
          Workername: entry.Workername,
          Project: entry.Project,
          message: entry.message
        });
      }
      return acc;
    }, []);

    let AttendanceInfo = {};
    works.forEach(item => {
      const { WorkDate, Project, Workername, message } = item;
      //切割时间前10个字符作为年月日
      const originalDate = new Date(WorkDate);
      console.log(typeof originalDate, originalDate, typeof WorkDate, WorkDate);
      // 将时间转换为北京时间并计算年月日
      let beijingDate = new Date(originalDate.getTime() + 8 * 60 * 60 * 1000); // 增加8小时
      beijingDate = beijingDate.toISOString().slice(0, 10);
      console.log(beijingDate, Project, Workername, message)
      if (!AttendanceInfo[beijingDate]) {
        AttendanceInfo[beijingDate] = {};
      }
      if (!AttendanceInfo[beijingDate][Project]) {
        AttendanceInfo[beijingDate][Project] = {};
      }
      if (!AttendanceInfo[beijingDate][Project][Workername]) {
        AttendanceInfo[beijingDate][Project][Workername] = {};
        let WorkerNumber = parseInt(message.find(item => item.infoName === '人员数量')?.value, 10);
        let WorkerList = message.find(item => item.infoName === '人员信息')?.value.split(/[、\s,;]+/);
        let WorkTime = parseFloat(message.find(item => item.infoName === '工作时长')?.value);
        let Difficulty_level = message.find(item => item.infoName === '难易程度')?.value;
        let WorkContent = message.find(item => item.infoName === '现场情况备注')?.value;
        console.log(WorkerNumber, WorkerList, WorkTime, WorkContent);
        AttendanceInfo[beijingDate][Project][Workername].WorkerNumber = WorkerNumber;
        AttendanceInfo[beijingDate][Project][Workername].WorkerList = WorkerList;
        AttendanceInfo[beijingDate][Project][Workername].WorkTime = WorkTime;
        AttendanceInfo[beijingDate][Project][Workername].WorkContent = WorkContent;
        AttendanceInfo[beijingDate][Project][Workername].Difficulty_level = Difficulty_level;
      }
      
    });
    console.log(AttendanceInfo);
      return AttendanceInfo;
  } catch (err) {
    return err;
  }
}