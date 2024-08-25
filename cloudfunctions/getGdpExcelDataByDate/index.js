// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
let AttendanceInfo = [];
let dateRange = {};
let thisWeek = {};
let thisMonth = {};
let lastWeek = {};
let lastMonth = {};
let selectedOptions = {};
let value_cal_funtion = {};
let data_all = {};
let startDate;
let endDate;
let projectsArray, teamsArray;
let works;
async function initValuecalFuntion() {
  value_cal_funtion["大龙街2024年排水管网清、查项目"] = await db.collection('value_cal_function')
    .where({ "Type": "清疏台账" })
    .get()
    .then(res => res.data)
    .catch(err => {
      console.error('获取数据失败', err);
      return [];
    });

  value_cal_funtion["深圳市宝安排水有限公司2024年宝安区管网清疏及其他水务设施清淤服务项目"] = await db.collection('value_cal_function')
    .where({ "Project_name": "深圳市宝安排水有限公司2024年宝安区管网清疏及其他水务设施清淤服务项目" })
    .get()
    .then(res => res.data)
    .catch(err => {
      console.error('获取数据失败', err);
      return [];
    });

}
function formatDate(date) {
  // 将传入的日期转换为北京时间（东八区）
  const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);

  const year = beijingTime.getFullYear();
  const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function CreateDate() {
  console.log(dateRange);
  startDate = dateRange.start ? new Date(`${dateRange.start}T00:00:00+08:00`) : new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000);
  endDate = dateRange.end ? new Date(`${dateRange.end}T23:59:59+08:00`) : new Date();
  console.log(startDate, endDate);

}
async function getWorksWithPagination(condition, pageSize = 100) {
  let allWorks = [];
  let hasMore = true;
  let lastId = null;

  while (hasMore) {
    let query = db.collection('works').where(condition).limit(pageSize);
    if (lastId) {
      query = query.orderBy('_id', 'asc').skip(1).where({
        _id: _.gt(lastId)
      });
    }

    const result = await query.get();
    const works = result.data;

    if (works.length > 0) {
      allWorks = allWorks.concat(works);
      lastId = works[works.length - 1]._id;
    }

    hasMore = works.length === pageSize;
  }

  return allWorks.filter(entry => !entry.deleted);
}

async function getWorksWithRetry(condition, maxRetries = 3) {
  console.log(condition);
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getWorksWithPagination(condition);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 延迟重试
    }
  }
}

async function getWorks(startDate, endDate) {
  function formatDate(date) {
    return date.toISOString().replace('Z', '.000Z');
  }
  console.log("startDate:",startDate);
  console.log("endDate:",endDate);
  const condition = {
    Date: _.gte(startDate.toISOString()).and(_.lte(endDate.toISOString()))
  };
  console.log('condition:', condition);
  console.log('startDate:', startDate);
  console.log('endDate:', endDate);
  // 添加下拉菜单选项的查询条件
  Object.keys(selectedOptions).forEach(key => {
    const optionsArray = selectedOptions[key];
    if (optionsArray && optionsArray.length > 0) {
      condition[key] = _.in(optionsArray);
    }
  });

  console.log('完整查询条件:', JSON.stringify(condition, null, 2));
  const countResult = await db.collection('works').where(condition).count();
  const total = countResult.total;
  console.log('总条数:', total);
  // 通过for循环做多次请求，并把多次请求的数据放到一个数组里
  let all = [];
  const MAX_LIMIT = 100;
  for (let i = 0; i < total; i += MAX_LIMIT) {
    const list = await db.collection('works').skip(i).where(condition).field({
      Date: true,
      Project: true,
      Workername: true,
      gdp: true,
      Task: true,
      Complete_workload:true,
      deleted: true
    }).limit(MAX_LIMIT).get();
    all = all.concat(list.data);
  }

  // 过滤掉包含 deleted: true 的条目
  const works = all.filter(entry => !entry.deleted);
  //const works = await getWorksWithRetry(condition);
  // 将works按照Date字段排序
  works.sort((a, b) => new Date(a.Date) - new Date(b.Date));

  console.timeEnd('获取数据耗时');
  console.log(`获取到 ${works.length} 条记录`);

  return works;
}

function extractProjectsAndTeams(projectManagers) {
  const projects = new Set();
  const teams = new Set();

  projectManagers.data.forEach(manager => {
    if (manager.WorkerList && Array.isArray(manager.WorkerList)) {
      manager.WorkerList.forEach(projectObj => {
        const projectName = Object.keys(projectObj)[0];
        projects.add(projectName);

        if (Array.isArray(projectObj[projectName])) {
          projectObj[projectName].forEach(team => {
            teams.add(team);
          });
        }
      });
    }
  });
  projectsArray = Array.from(projects);
  teamsArray = Array.from(teams);
}

function formatDateToBeijiing(utcDateString) {
  // 创建一个 UTC 日期对象
  const utcDate = new Date(utcDateString);

  // 转换为北京时间（UTC+8）
  const beijingDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));

  // 格式化日期为 YYYY-MM-DD
  const year = beijingDate.getUTCFullYear();
  const month = String(beijingDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingDate.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function processWorksDate(works) {
  works.forEach(work => {
    work.Date = formatDateToBeijiing(work.Date);
  })
  return works;
}
async function calculateWorkValue(work, project) {
  const db = cloud.database();
  let gdp = 0;
  let Complete_workload = [];

  // 辅助函数
  function parseFloatSafe(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // 根据不同的项目类型计算产值
  if (project === "大龙街2024年排水管网清、查项目" || project === "大龙街2024年排水管网清、查项目-----测试用") {

    if (work.Work === "清疏台账") {
      const PipeType = work.message.find(item => item.infoName === '清疏对象')?.value || '0';
      const PipeProperty = work.message.find(item => item.infoName === '管道性质')?.value || '0';
      const PipeDiameter = work.message.find(item => item.infoName === '管径/尺寸')?.value || '0';
      const PipeWashType = work.message.find(item => item.infoName === '（内业）清疏类型')?.value || -1;
      let PipeWashCount = work.message.find(item => item.infoName === '（内业）第几次清疏')?.value || 0;
      console.log(PipeDiameter, PipeWashType, PipeWashCount, PipeType, PipeProperty);
      if (PipeWashCount === "") {
        PipeWashCount = 0;
      }
      if (typeof PipeWashCount === Array) {
        PipeWashCount = PipeWashCount[0].toString();
      }

      let pipe_type_final = '';
      let pipe_wash_type_final = PipeWashType;
      let pipe_diameter_final = 0;
      let pipe_length_final = 0;

      if (PipeType === "明渠") {
        pipe_type_final = "渠箱";
        let pipe_diameter_temp = PipeDiameter.split(/[x*X]/);
        let product = parseFloatSafe(pipe_diameter_temp[0]) * parseFloatSafe(pipe_diameter_temp[1]) / 1000000;
        pipe_diameter_final = product < 0.283 ? 0.283 : product <= 0.785 ? 0.785 : product <= 1.766 ? 1.766 : 9999.9;
        pipe_length_final = parseFloatSafe(work.message.find(item => item.infoName === '图纸长度')?.value);
        // 加上单位，例如 "米"
        const pipeLengthWithUnit = `${pipe_length_final} 米`;
        // 将结果放入数组中
        Complete_workload.push(pipeLengthWithUnit);

      } else if (PipeType === "管道" || PipeType === "篦子") {
        pipe_type_final = PipeProperty === "W" ? "污水管道" : "雨水合流管道";
        let pipe_diameter_temp = parseFloatSafe(PipeDiameter);
        pipe_diameter_final = pipe_diameter_temp < 600 ? 600 : pipe_diameter_temp <= 1000 ? 1000 : pipe_diameter_temp <= 1500 ? 1500 : 9999.9;
        pipe_length_final = parseFloatSafe(work.message.find(item => item.infoName === '图纸长度')?.value);
        const pipeLengthWithUnit = `${pipe_length_final} 米`;
        // 将结果放入数组中
        Complete_workload.push(pipeLengthWithUnit);
      }

      for (let func of value_cal_funtion["大龙街2024年排水管网清、查项目"]) {
        if (func.PipeType === pipe_type_final && func.WashType === pipe_wash_type_final && func.PipeDimension === pipe_diameter_final) {
          let pipe_value_final = 0;
          switch (PipeWashCount) {
            case "1": pipe_value_final = func.Price.first; break;
            case "2": pipe_value_final = func.Price.second; break;
            case "3": pipe_value_final = func.Price.third; break;
            case "4": pipe_value_final = func.Price.fourth; break;
          }
          if (pipe_wash_type_final === "深度清疏" && pipe_value_final > 0) {
            pipe_value_final += 12850;
          }
          gdp = pipe_value_final * pipe_length_final / 1000;
          break;
        }
      }
    } else {
      const lengthItem = work.message.find(item => item.infoName === '作业长度');
      const priceItem = 4;
      if (lengthItem?.value) {

        const length = parseFloatSafe(lengthItem.value);
        const price = parseFloatSafe(priceItem);
        const pipeLengthWithUnit = `${length} 米`;
        // 将结果放入数组中
        Complete_workload.push(pipeLengthWithUnit);
        gdp = length * price;
      }
    }
  } else if (project === "深圳市宝安排水有限公司2024年宝安区管网清疏及其他水务设施清淤服务项目") {


    const Wash_count = parseFloatSafe(work.message.find(item => item.infoName === '清疏量结果'|| item.infoName === '清疏量')?.value);
    const Wash_Type = work.message.find(item => item.infoName === '服务项目')?.value;
    // const root_length = works.message.find(item => item.infoName === '清理树根长度').value;


    if (Wash_Type && Wash_count) {
      const Cal_func = value_cal_funtion["深圳市宝安排水有限公司2024年宝安区管网清疏及其他水务设施清淤服务项目"].find(item => item.WashType === Wash_Type)?.Price;
      if (Cal_func) {
        if (Wash_Type !== "管渠树根清除--管道、暗渠（涵）") {
          const pipeLengthWithUnit = `${Wash_count} 方`;
          // 将结果放入数组中
          Complete_workload.push(pipeLengthWithUnit);
          gdp = Wash_count * Cal_func;
        } else {
          const pipeLengthWithUnit = `${root_length} 米`;
          // 将结果放入数组中
          Complete_workload.push(pipeLengthWithUnit);
          gdp = root_length >= 1 ? Cal_func.first + (root_length - 1) * Cal_func.second : Cal_func.first;
        }
      }
    }
  } else if (project === "深圳宝排燕罗分公司满水管道检测项目") {
    const length = parseFloatSafe(work.message.find(item => item.infoName === '检测长度')?.value);
    const pipeLengthWithUnit = `${length} 米`;
    // 将结果放入数组中
    Complete_workload.push(pipeLengthWithUnit);
    gdp = length * 170;
  } else if (project === "珠海入库项目") {
    const length = parseFloatSafe(work.message.find(item => item.infoName === '检测长度')?.value);
    const price = parseFloatSafe(work.message.find(item => item.infoName === '单价（仅项目经理可见）')?.value);
    const pipeLengthWithUnit = `${length} 米`;
    // 将结果放入数组中
    Complete_workload.push(pipeLengthWithUnit);
    gdp = length * price;
  } else if (project === "福田市政、小区清疏项目") {
    const gdpItem = parseFloatSafe(work.message.find(item => item.infoName === '预估产值（仅项目经理可见）')?.value);
    const length = parseFloatSafe(work.message.find(item => item.infoName === '作业长度')?.value);
    const pipeLengthWithUnit = `${length} 方`;
    // 将结果放入数组中
    Complete_workload.push(pipeLengthWithUnit);
    gdp = gdpItem;
  }

  return { gdp, Complete_workload };
}

async function calculateProductionValue(attendanceInfo, works, projectManagers) {
  let productionValueData = {};

  works = processWorksDate(works);
  console.log("calculateProductionValueworks", works);
  // await initValuecalFuntion();
  console.log("attendanceInfo.result",attendanceInfo.result)
  for (const date in attendanceInfo.result) {
    productionValueData[date] = {};
    for (const project in attendanceInfo.result[date]) {
      for (const worker in attendanceInfo.result[date][project]) {
        console.log("project", project, "worker", worker);
        console.log("projectManagers", projectManagers);
        const manager = findManager(project, worker, projectManagers);
        const managerName = manager ? manager.account : "未知";

        if (!productionValueData[date][managerName]) {
          productionValueData[date][managerName] = {};
        }

        if (!productionValueData[date][managerName][project]) {
          productionValueData[date][managerName][project] = {};
        }

        const attendance = attendanceInfo.result[date][project][worker];
        console.log("date", date, "project", project, "worker", worker, "attendance", attendance);

        const matchingWorks = works.filter(work =>
          work.Date === date &&
          work.Project === project &&
          work.Workername === worker
        );
        console.log("matchingWorks", matchingWorks);
        let dailyProductionValue = 0;
        let productionValue = 0;
        let gdp = 0;
        let Project_Category = "";
        let unitTotals = {};
        for (const work of matchingWorks) {
          console.log("workmatchingWorks", work);
          // if (!work.message.some(item => item.keyMessage === true)) {
          //   continue;
          // }
          if (!work.gdp || !work.Complete_workload) {
            continue;
          }
          Project_Category = work.Task;
          gdp = work.gdp;
          const completeWorkload  = work.Complete_workload;
          console.log("gdp", gdp);
          console.log("complete_workload", completeWorkload);
          // productionValue,Complete_workload  = await calculateWorkValue(work, project);
          dailyProductionValue += parseFloat(gdp || "0");

          // 提取数值和单位
          const match = completeWorkload.match(/(\d+(\.\d+)?)\s*(\S+)/);
          if (match) {
            const value = parseFloat(match[1]);
            const unit = match[3];

            // 初始化并累加单位
            if (!unitTotals[unit]) {
              unitTotals[unit] = 0;
            }
            unitTotals[unit] += value;
            // 输出格式化的结果
            for (const [unit, total] of Object.entries(unitTotals)) {
              console.log(`${total} ${unit}`);
            }
          }

          console.log("gdp", gdp, "Complete_workload", completeWorkload, "dailyProductionValue", dailyProductionValue);
        }
        // Complete_workload.push(Complete_workload); 
        console.log("gdp",gdp,"complete_workload", unitTotals);
        
        // 计算日期范围内的总产值
        const thisWeektotalGDP = filterAndCalculateTotalGDP(data_all, thisWeek, worker);
        const thisMonthtotalGDP = filterAndCalculateTotalGDP(data_all, thisMonth, worker);
        const lastWeektotalGDP = filterAndCalculateTotalGDP(data_all, lastWeek, worker);
        const lastMonthtotalGDP = filterAndCalculateTotalGDP(data_all, lastMonth, worker);

        productionValueData[date][managerName][project][worker] = {
          workerNumber: attendance.WorkerNumber + "人",
          WorkerList: attendance.WorkerList,
          productionValue: dailyProductionValue.toFixed(3),
          averageProductionValue: (dailyProductionValue / attendance.WorkerNumber).toFixed(3),
          Worktime: attendance.WorkTime + "小时",
          Complete_workload: unitTotals,
          Project_Category: Project_Category,
          Difficulty_level: attendance.Difficulty_level,
          WorkContent: attendance.WorkContent,
          thisWeektotalGDP: thisWeektotalGDP,
          thisMonthtotalGDP: thisMonthtotalGDP,
          lastWeektotalGDP: lastWeektotalGDP,
          lastMonthtotalGDP: lastMonthtotalGDP
        };

        // Add fixed data for manager "伍能"
        if (managerName === "伍能") {
          const fixedProjects = [
            {
              project: "前海海岸线管养项目",
              worker: "黄永峰",
              workerNumber: "黄永峰组（2人）",
              productionValue: 1323,
              averageProductionValue: 616,
              Worktime: "/",
              Complete_workload: "日常养护",
              Project_Category:  "管养项目",
              Difficulty_level: "中等",
              WorkContent:""
            },
            {
              project: "2024年广深明渠管养项目",
              worker: "黄永峰",
              workerNumber: "黄永峰组（4人）",
              productionValue: 1323,
              averageProductionValue: 616,
              Worktime: "/",
              Complete_workload: "日常养护",
              Project_Category: "管养项目",
              Difficulty_level: "中等",
              WorkContent:""
            }
          ];

          for (const fixedProject of fixedProjects) {
            productionValueData[date][managerName][fixedProject.project] = {
              [fixedProject.worker]: {
                workerNumber: fixedProject.workerNumber,
                WorkerList: "",
                productionValue: fixedProject.productionValue.toFixed(3),
                averageProductionValue: fixedProject.averageProductionValue.toFixed(3),
                Worktime: fixedProject.Worktime,
                Complete_workload: fixedProject.Complete_workload,
                Project_Category: fixedProject.Project_Category,
                Difficulty_level: fixedProject.Difficulty_level,
                thisWeektotalGDP: (fixedProject.productionValue * 7).toFixed(3),
                thisMonthtotalGDP: (fixedProject.productionValue * getDaysInMonth(date)).toFixed(3),
                lastWeektotalGDP: (fixedProject.productionValue * 7).toFixed(3),
                lastMonthtotalGDP: (fixedProject.productionValue * getDaysInLastMonth(date)).toFixed(3)
              }
            };
          }
        }
      }
    }
  }
  console.log("生产值数据111", productionValueData);
  return productionValueData;
}

// Utility functions to calculate days in the current and previous month
function getDaysInMonth(date) {
  const [year, month] = date.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function getDaysInLastMonth(date) {
  const [year, month] = date.split('-').map(Number);
  return new Date(year, month - 1, 0).getDate();
}

function findManager(project, worker, projectManagers) {
  for (const manager of projectManagers) {
    const workerList = manager.WorkerList;
    if (Array.isArray(workerList)) {
      for (const projectList of workerList) {
        if (projectList.hasOwnProperty(project)) {
          const workerGroups = projectList[project];
          if (workerGroups.includes(worker)) {
            return manager;
          }
        }
      }
    }
  }
  return null; // 如果没有找到经理，返回 null
}
// //计算work 的产值和人均产值 
// async function calculateProductionValue(attendanceInfo, works) {
//   let productionValueData = {};
//   works = processWorksDate(works);
//   console.log("works", works);
//   await initValuecalFuntion();
//   for (const date in attendanceInfo.result) {
//     productionValueData[date] = {};
//     for (const project in attendanceInfo.result[date]) {
//       productionValueData[date][project] = {};
//       for (const worker in attendanceInfo.result[date][project]) {
//         const attendance = attendanceInfo.result[date][project][worker];
//         console.log("date", date, "project", project, "worker", worker, "attendance", attendance);
//         const matchingWorks = works.filter(work => 
//           work.Date === date &&
//           work.Project === project &&
//           work.Workername === worker
//         );

//         let dailyProductionValue = 0;
//         for (const work of matchingWorks) {
//           // 假设每个 work 有一个 productionValue 字段，如果没有，需要根据实际情况计算
//           console.log("work", work);
// if (!work.message.some(item => item.keyMessage === true)) {
//     continue;}
//           const productionValue = await calculateWorkValue(work, project);
//           dailyProductionValue += parseFloat(productionValue || "0");
//         }

//         productionValueData[date][project][worker] = {
//           //...attendance, // 保留原有的考勤信息
//           workerNumber: attendance.WorkerNumber+"人",
//           WorkerList : attendance.WorkerList,
//           productionValue: dailyProductionValue,
//           averageProductionValue: dailyProductionValue / attendance.WorkerNumber,
//           Worktime: attendance.WorkTime+"小时",
//           WorkContent:attendance.WorkContent
//         };
//       }
//     }
//   }
//   console.log("生产值数据", productionValueData);
//   return productionValueData;
// }

async function getAttendanceInfo() {
  selectedOptions = {
    Project: projectsArray,
    Workername: teamsArray,
    Work: []
  };

  AttendanceInfo = await cloud.callFunction({
    name: 'GetAttendanceInfo',
    data: {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      selectedOptions: selectedOptions
    }
  });
}

// function summarizeDataByManager(originalData) {
//   const newData = JSON.parse(JSON.stringify(originalData)); // 深拷贝
//   console.log("newData", newData);

//   let grandTotalWorkerNumber = 0;
//   let grandTotalProductionValue = 0;
//   let grandTotalAverageProductionValue = 0;

//   for (const date in newData) {
//     const dateData = newData[date];
//     for (const manager in dateData) {
//       let totalWorkerNumber = 0;
//       let totalProductionValue = 0;

//       for (const project in dateData[manager]) {
//         for (const team in dateData[manager][project]) {
//           const teamData = dateData[manager][project][team];
//           const workerNumber = parseInt(teamData.workerNumber) || 0;
//           const productionValue = parseFloat(teamData.productionValue) || 0;

//           totalWorkerNumber += workerNumber;
//           totalProductionValue += productionValue;
//         }
//       }

//       let totalAverageProductionValue = 0;
//       if (totalWorkerNumber > 0) {
//         totalAverageProductionValue = totalProductionValue / totalWorkerNumber;
//       }

//       // 直接在经理下添加总计
//       dateData[manager]['总计'] = {
//         totalWorkerNumber: `${totalWorkerNumber}人`,
//         totalProductionValue: isNaN(totalProductionValue) ? '0' : Number(totalProductionValue).toFixed(3),
//         totalAverageProductionValue: isNaN(totalAverageProductionValue) ? '0' : Number(totalAverageProductionValue).toFixed(3)
//       };

//       // 累加到总体总结
//       grandTotalWorkerNumber += totalWorkerNumber;
//       grandTotalProductionValue += totalProductionValue;
//     }
//   }

//   if (grandTotalWorkerNumber > 0) {
//     grandTotalAverageProductionValue = grandTotalProductionValue / grandTotalWorkerNumber;
//   }

//   // 添加总体总结到数据的最后一行
//   newData['all'] = {
//     totalWorkerNumber: `${grandTotalWorkerNumber}人`,
//     totalProductionValue: isNaN(grandTotalProductionValue) ? '0' : Number(grandTotalProductionValue).toFixed(3),
//     totalAverageProductionValue: isNaN(grandTotalAverageProductionValue) ? '0' : Number(grandTotalAverageProductionValue).toFixed(3)
//   };

//   return newData;
// }

function summarizeDataByManager(originalData) {
  const newData = JSON.parse(JSON.stringify(originalData)); // Deep copy
  console.log("newData", newData);

  let grandTotalWorkerNumber = 0;
  let grandTotalProductionValue = 0;
  let grandTotalAverageProductionValue = 0;
  let grandTotalThisWeekGDP = 0;
  let grandTotalThisMonthGDP = 0;
  let grandTotalLastWeekGDP = 0;
  let grandTotalLastMonthGDP = 0;

  for (const date in newData) {
    const dateData = newData[date];
    for (const manager in dateData) {
      let totalWorkerNumber = 0;
      let totalProductionValue = 0;
      let totalThisWeekGDP = 0;
      let totalThisMonthGDP = 0;
      let totalLastWeekGDP = 0;
      let totalLastMonthGDP = 0;

      for (const project in dateData[manager]) {
        for (const team in dateData[manager][project]) {
          const teamData = dateData[manager][project][team];
          const workerNumber = parseInt(teamData.workerNumber) || 0;
          const productionValue = parseFloat(teamData.productionValue) || 0;
          const thisWeekGDP = parseFloat(teamData.thisWeektotalGDP) || 0;
          const thisMonthGDP = parseFloat(teamData.thisMonthtotalGDP) || 0;
          const lastWeekGDP = parseFloat(teamData.lastWeektotalGDP) || 0;
          const lastMonthGDP = parseFloat(teamData.lastMonthtotalGDP) || 0;

          totalWorkerNumber += workerNumber;
          totalProductionValue += productionValue;
          totalThisWeekGDP += thisWeekGDP;
          totalThisMonthGDP += thisMonthGDP;
          totalLastWeekGDP += lastWeekGDP;
          totalLastMonthGDP += lastMonthGDP;
        }
      }

      let totalAverageProductionValue = 0;
      if (totalWorkerNumber > 0) {
        totalAverageProductionValue = totalProductionValue / totalWorkerNumber;
      }

      // Add totals under each manager
      dateData[manager]['总计'] = {
        totalWorkerNumber: `${totalWorkerNumber}人`,
        totalProductionValue: isNaN(totalProductionValue) ? '0' : Number(totalProductionValue).toFixed(3),
        totalAverageProductionValue: isNaN(totalAverageProductionValue) ? '0' : Number(totalAverageProductionValue).toFixed(3),
        totalThisWeekGDP: Number(totalThisWeekGDP).toFixed(3),
        totalThisMonthGDP: Number(totalThisMonthGDP).toFixed(3),
        totalLastWeekGDP: Number(totalLastWeekGDP).toFixed(3),
        totalLastMonthGDP: Number(totalLastMonthGDP).toFixed(3)
      };

      // Accumulate to overall summary
      grandTotalWorkerNumber += totalWorkerNumber;
      grandTotalProductionValue += totalProductionValue;
      grandTotalThisWeekGDP += totalThisWeekGDP;
      grandTotalThisMonthGDP += totalThisMonthGDP;
      grandTotalLastWeekGDP += totalLastWeekGDP;
      grandTotalLastMonthGDP += totalLastMonthGDP;
    }
  }

  if (grandTotalWorkerNumber > 0) {
    grandTotalAverageProductionValue = grandTotalProductionValue / grandTotalWorkerNumber;
  }

  // Add overall summary to the last line of data
  newData['all'] = {
    totalWorkerNumber: `${grandTotalWorkerNumber}人`,
    totalProductionValue: isNaN(grandTotalProductionValue) ? '0' : Number(grandTotalProductionValue).toFixed(3),
    totalAverageProductionValue: isNaN(grandTotalAverageProductionValue) ? '0' : Number(grandTotalAverageProductionValue).toFixed(3),
    totalThisWeekGDP: Number(grandTotalThisWeekGDP).toFixed(3),
    totalThisMonthGDP: Number(grandTotalThisMonthGDP).toFixed(3),
    totalLastWeekGDP: Number(grandTotalLastWeekGDP).toFixed(3),
    totalLastMonthGDP: Number(grandTotalLastMonthGDP).toFixed(3)
  };

  return newData;
}

function getDateRanges(currentDate) {
  console.log("currentDate", currentDate);
  const date = new Date(currentDate);
  if (isNaN(date)) {
    throw new Error("Invalid date");
  }

  // 本周
  const startOfWeek = new Date(date);
  const endOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // 本月
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  // 上周
  const startOfLastWeek = new Date(startOfWeek);
  const endOfLastWeek = new Date(endOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);
  endOfLastWeek.setDate(endOfWeek.getDate() - 7);

  // 上月
  const startOfLastMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const endOfLastMonth = new Date(date.getFullYear(), date.getMonth(), 0);

  return {
    thisWeek: {
      start: startOfWeek,
      end: endOfWeek,
    },
    thisMonth: {
      start: startOfMonth,
      end: endOfMonth,
    },
    lastWeek: {
      start: startOfLastWeek,
      end: endOfLastWeek,
    },
    lastMonth: {
      start: startOfLastMonth,
      end: endOfLastMonth,
    },
  };
}

function filterAndCalculateTotalGDP(data, dateRange, workerName) {
  const filteredData = data.filter(item => {
    const itemDate = new Date(item.Date);
    return (
      itemDate >= dateRange.start &&
      itemDate <= dateRange.end &&
      item.Workername === workerName
    );
  });

  const totalGDP = filteredData.reduce((total, item) => {
    return total + (item.gdp || 0);
  }, 0);

  return totalGDP;
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database();
  const _ = db.command;  // 添加这行来引入数据库命令

  dateRange = event.dateRange;
  const dateRanges = getDateRanges(dateRange.start);
  thisWeek = dateRanges.thisWeek;
  thisMonth = dateRanges.thisMonth;
  lastWeek = dateRanges.lastWeek;
  lastMonth = dateRanges.lastMonth;
  console.log("日期范围", thisWeek, thisMonth, lastWeek, lastMonth);
  CreateDate();
  data_all = await getWorks(lastMonth.start, thisMonth.end);
  console.log("data_all", data_all);
  
  console.log("日期范围", startDate, endDate);
  const ProjectManager = await db.collection('users').where({
    role: "manager"
  }).get();
  console.log("ProjectManager:", ProjectManager);
  extractProjectsAndTeams(ProjectManager);
  console.log("项目经理数组", projectsArray);
  console.log("团队数组", teamsArray);

  await getAttendanceInfo();
  console.log("考勤信息", AttendanceInfo);
  const works = await getWorks(startDate, endDate);

  console.log("工作信息", works);
  // 转换为数组
  const projectManagersArray = ProjectManager.data;
  const productionValueData = await calculateProductionValue(AttendanceInfo, works, projectManagersArray);
  const summaryData = summarizeDataByManager(productionValueData);
  console.log("生产值数据", productionValueData);
  console.log("总结数据", summaryData);

  return {
    summaryData,
  }


  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}

