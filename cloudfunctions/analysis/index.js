// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// function getworkdata(callback) {
//   // 调用云函数
//   const result = cloud.callFunction({
//     name: 'getworksdata',
//     data: {
//       selectedOptions: newSelectedOptions,
//       dateRange: dateRange
//     },
//     success: res => {
//       console.log('云函数查询结果:', res.result);
//       if (res.result && res.result.length > 0) {
//         // 更新页面数据
//         this.setData({
//           queryResults: res.result,
//         });

//         console.log("结果：", queryResults)
//         if (typeof callback === 'function') {
//           yun
//           callback(); // 调用回调函数
//         }
//       } else {
//       }
//     },
//     fail: err => {
//       console.error('云函数调用失败:', err);
//     }
//   });
// }


// function getworkerdata(callback) {
//   // 调用云函数
//   wx.cloud.callFunction({
//     name: 'getworksdata',
//     data: {
//       selectedOptions: selectedOptions,
//       dateRange: dateRange
//     },
//     success: res => {
//       console.log('云函数查询结果:', res.result);
//       wx.hideLoading(); // 关闭加载提示
//       // ...处理成功的结果...
//       // 判断查询结果是否为空
//       if (res.result && res.result.length > 0) {
//         // 更新页面数据
//         this.setData({
//           queryResults: res.result,
//         });

//         console.log("结果：", queryResults)
//         if (typeof callback === 'function') {
//           callback(); // 调用回调函数
//         }
//       } else {
//         // 查询结果为空时的处理
//         wx.showToast({
//           title: '未找到数据，请重新输入查找内容',
//           icon: 'none', // “none”表示不显示图标
//           duration: 2000 // 提示框显示时间
//         });
//       }
//     },
//     fail: err => {
//       console.error('云函数调用失败:', err);
//     }
//   });
// }

// function calculateTotal() {
//   return new Promise((resolve, reject) => {
//     getworkerdata(() => {
//       const targetNames = ['管道长度（米）', '明渠长度（米）', '雨水篦子联通管长度（米）'];
//       let dailyTotals = {};
//       if (queryResults && Array.isArray(queryResults)) {
//         this.data.queryResults.forEach((queryResult) => {
//           const date = queryResult.Date ? new Date(queryResult.Date).toISOString().slice(0, 10) : undefined;
//           const workerName = queryResult.Workername; // 获取工人的姓名
//           if (this.data.analysisName == "班组进度分析") {
//             if (date && workerName && this.data.User_array.includes(workerName) &&
//               queryResult.message && Array.isArray(queryResult.message)) {
//               queryResult.message.forEach((item) => {
//                 if (targetNames.includes(item.infoName) && !isNaN(parseFloat(item.value))) {
//                   if (!dailyTotals[workerName]) {
//                     dailyTotals[workerName] = {};
//                   }
//                   if (!dailyTotals[workerName][date]) {
//                     dailyTotals[workerName][date] = 0;
//                   }
//                   dailyTotals[workerName][date] += parseFloat(item.value);
//                 }
//               });
//             }
//           }
//           else if (this.data.analysisName == "班组历史进度分析") {
//             if (date && queryResult.message && Array.isArray(queryResult.message)) {
//               if (!dailyTotals[date]) {
//                 dailyTotals[date] = { totalLength: 0, workerName: workerName };
//               }
//               queryResult.message.forEach((item) => {
//                 if (targetNames.includes(item.infoName) && item.value !== '/' && !isNaN(parseFloat(item.value))) {
//                   dailyTotals[date].totalLength += parseFloat(item.value);

//                 }
//               });
//             }
//           }
//         });
//         if (this.data.analysisName == "班组进度分析") {
//           let resultsArray = [];
//           Object.keys(dailyTotals).forEach(worker => {
//             Object.keys(dailyTotals[worker]).forEach(date => {
//               resultsArray.push({
//                 workerName: worker,
//                 date: date,
//                 totalLength: dailyTotals[worker][date]
//               });
//             });
//           });
//           // 设置结果到data
//           this.setData({
//             totalByDate: resultsArray
//           });
//           console.log('User_array:', this.data.User_array);
//           console.log('工人日期统计的总长度:', this.data.totalByDate);
//           this.getalldata();
//           this.transformDataForECharts();
//           this.ranking();
//         }
//         else if (this.data.analysisName == "班组历史进度分析") {
//           let resultsArray = Object.keys(dailyTotals).map(date => ({
//             workerName: dailyTotals[date].workerName, // 包含Workername
//             date: date,
//             totalLength: dailyTotals[date].totalLength
//           }));
//           // 对结果数组按日期排序
//           resultsArray.sort((a, b) => a.date.localeCompare(b.date));
//           // 设置结果到data
//           this.setData({
//             workertalByDate: resultsArray
//           });
//           console.log('User_array:', this.data.User_array);
//           console.log('工人日期统计的总长度:', this.data.workertalByDate);
//           this.fillDatesAndLengths();
//         }
//         resolve();
//       } else {
//         console.log("queryResults 不是数组或为空");
//         reject("queryResults 不是数组或为空");
//       }
//     });
//   });
// }

function getalldata(totalByDate) {
  // 使用 reduce 方法来聚合数据
  const aggregatedData = totalByDate.reduce((acc, curr) => {
    if (acc[curr.workerName]) {
      acc[curr.workerName] += curr.totalLength; // 累加同名工人的 totalLength
    } else {
      acc[curr.workerName] = curr.totalLength; // 初始化该工人的 totalLength
    }
    return acc;
  }, {});

  const transformedData = Object.keys(aggregatedData).map(key => ({
    value: aggregatedData[key],
    name: key
  }));
  // 对 transformedData 根据 value 降序排序
  transformedData.sort((a, b) => b.value - a.value);

  // console.log('getalldata工人:', PieChartData);
  console.log('getalldata工人:', transformedData);
  return transformedData;
  // this.setData({
  //   PieChartData: transformedData,
  // });

}

function ranking(transformedData) {
  let rankedData = transformedData.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
  let displayData = [];
  if (rankedData.length > 5) {
    // 对数组进行排序（假设已根据需要排序）
    const topThree = rankedData.slice(0, 3);
    const bottomThree = rankedData.slice(-3);
    displayData = [...topThree, ...bottomThree];
  } else {
    displayData = rankedData;
  }
  console.log('rankingDisplayData:', displayData);
  return displayData;
}

function transformDataForECharts(totalByDate) {
  // 使用 reduce 方法来聚合数据
  const aggregatedData = totalByDate.reduce((acc, curr) => {
    if (acc[curr.workerName]) {
      acc[curr.workerName].totalLength += curr.totalLength; // 累加 totalLength
    } else {
      acc[curr.workerName] = { ...curr }; // 复制当前对象以初始化
    }
    return acc;
  }, {});

  // 将聚合后的对象转换成数组格式
  const transformedData = Object.values(aggregatedData);
  transformedData.sort((a, b) => b.totalLength - a.totalLength);
  console.log("transformedData", transformedData)
  // 提取 workerName 到一个新的数组
  const workerNames = transformedData.map(item => item.workerName);
  // 提取 totalLength 到另一个新的数组
  const totalLengths = transformedData.map(item => item.totalLength);
  let newData = { workerNames, totalLengths }

  return newData;

  // this.setData({
  //   BarChartData: {
  //     xData: workerNames,
  //     seriesData: totalLengths
  //   }
  // });

}

//班组进度分析
function Team_progress_analysis(queryResults) {
  console.log("queryResults", queryResults)
  // return new Promise((resolve, reject) => {
  const targetNames = ['管道长度（米）', '明渠长度（米）', '雨水篦子联通管长度（米）'];
  let dailyTotals = {};
  if (queryResults && Array.isArray(queryResults)) {
    queryResults.forEach((queryResult) => {
      const date = queryResult.Date ? new Date(queryResult.Date).toISOString().slice(0, 10) : undefined;
      const workerName = queryResult.Workername; // 获取工人的姓名
      if (date && workerName && queryResult.message && Array.isArray(queryResult.message)) {
        queryResult.message.forEach((item) => {
          if (targetNames.includes(item.infoName) && !isNaN(parseFloat(item.value))) {
            if (!dailyTotals[workerName]) {
              dailyTotals[workerName] = {};
            }
            if (!dailyTotals[workerName][date]) {
              dailyTotals[workerName][date] = 0;
            }
            dailyTotals[workerName][date] += parseFloat(item.value);
          }
        });
      }
    });
    let resultsArray = [];
    Object.keys(dailyTotals).forEach(worker => {
      Object.keys(dailyTotals[worker]).forEach(date => {
        resultsArray.push({
          workerName: worker,
          date: date,
          totalLength: dailyTotals[worker][date]
        });
      });
    });
    // 设置结果到data
    all_Team_progress_analysis = resultsArray;
    // this.setData({
    //   totalByDate: resultsArray
    // });
    // console.log('User_array:', this.data.User_array);
    console.log('工人日期统计的总长度:', all_Team_progress_analysis);
    let Team_progress_pie = getalldata(all_Team_progress_analysis);
    let Team_progress_bar = transformDataForECharts(all_Team_progress_analysis);
    let Team_ranking = ranking(Team_progress_pie);
    let Team_progress_analysis_data = {
      Team_progress_pie: Team_progress_pie,
      Team_progress_bar: Team_progress_bar,
      Team_ranking: Team_ranking
    }
    return Team_progress_analysis_data;
  } else {
    console.log("queryResults 不是数组或为空");
    // reject("queryResults 不是数组或为空");
  }

  // });
}

//班组产值分析
function Team_value_analysis(gdpData) {
  // 创建一个 Set 对象用于存储去重后的 worker_name
  const workerNameSet = new Set();
  console.log("workerNameSet", workerNameSet)
  // 创建一个对象用于存储每个 worker_name 对应的 gdp 之和
  const workerGdpSum = {};
  // 遍历 gdpData 数组
  gdpData.forEach(item => {
    // 如果 item.worker_name 存在且不在 Set 中
    if (item.worker_name && !workerNameSet.has(item.worker_name)) {
      // 将其添加到 Set 中
      workerNameSet.add(item.worker_name);
      // 初始化对应的 gdp 之和为 0
      workerGdpSum[item.worker_name] = 0;
    }
    // 累加 gdp 值
    if (item.worker_name && item.gdp) {
      workerGdpSum[item.worker_name] += item.gdp;
    }
  });

  // 将 workerGdpSum 转换为数组并排序
  const sortedWorkerData = Object.entries(workerGdpSum)
    .map(([name, value]) => ({ name, value: (value / 10000000).toFixed(3) }))
    .sort((a, b) => b.value - a.value); // 按 value 从大到小排序

  // 分别提取排序后的 worker_name 和 worker_value
  const worker_name = sortedWorkerData.map(item => item.name);
  const worker_value = sortedWorkerData.map(item => item.value);

  // 将 Set 转换为数组并赋值给 worker_name
  //         worker_name = [...workerNameSet];
  //         // 将 workerGdpSum 转换为数组并赋值给 worker_value
  //         worker_value = Object.entries(workerGdpSum)
  // .map(([name, value]) => (value / 10000000).toFixed(3));

  console.log("worker_name", worker_name)
  console.log("worker_value", worker_value)

  let Team_value_analysis_BarChartData = {
    xData: worker_name,
    seriesData: worker_value
  }
  let Team_value_analysis_PieChartData = []
  for (let i = 0; i < worker_name.length; i++) {
    Team_value_analysis_PieChartData.push({
      name: worker_name[i],
      value: worker_value[i]
    })
  }
  // 对 PieChartData 进行排序，根据 value 值降序排列
  Team_value_analysis_PieChartData.sort((a, b) => b.value - a.value);
  Team_value_analysis_PieChartData = Team_value_analysis_PieChartData
  let Team_value_analysis_ranking = ranking(Team_value_analysis_PieChartData)
  let Team_value_analysis_data = {
    Team_value_analysis_BarChartData: Team_value_analysis_BarChartData,
    Team_value_analysis_PieChartData: Team_value_analysis_PieChartData,
    Team_value_analysis_ranking: Team_value_analysis_ranking
  }
  return Team_value_analysis_data;

}

function calculateWeeklyAndMonthlyTotals(dates, values) {
  const weeklyTotals = {};
  console.log("dates", dates)
  const monthlyTotals = {};
  console.log("values", values)
  dates.forEach((date, index) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    // 计算周一的日期
    const mondayDate = new Date(dateObj);
    mondayDate.setDate(dateObj.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const mondayLabel = mondayDate.toISOString().slice(0, 10); // YYYY-MM-DD format

    const month = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

    // 按周和月聚合值，确保转换为数字
    weeklyTotals[mondayLabel] = (weeklyTotals[mondayLabel] || 0) + parseFloat(values[index]);
    monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(values[index]);
    console.log("weeklyTotals", weeklyTotals)
    console.log("monthlyTotals", monthlyTotals)
    // weeklyTotals[mondayLabel] = weeklyTotals[mondayLabel] || 0;
    // monthlyTotals[month] = monthlyTotals[month] || 0;

    // weeklyTotals[mondayLabel] += values[index];
    // monthlyTotals[month] += values[index];
  });

  const weekLabels = Object.keys(weeklyTotals).sort((a, b) => b.localeCompare(a));
  const weekValues = weekLabels.map(label => weeklyTotals[label]);
  console.log("weekValues", weekValues)
  const monthLabels = Object.keys(monthlyTotals).sort((a, b) => b.localeCompare(a));
  const monthValues = monthLabels.map(label => monthlyTotals[label]);
  console.log("monthValues", monthValues)
  return {
    weekLabels,
    weekValues,
    monthLabels,
    monthValues
  };
}

//公司产值分析
function Company_value_analysis(gdpData) {
  let dateValuePairs = [];
  let dateSums = {};
  for (let i = 0; i < gdpData.length; i++) {
    const date = new Date(gdpData[i].Date_final);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    // 检查dateSums中是否已经有这个日期的记录
    if (dateSums[formattedDate]) {
      // 如果有，则累加值
      dateSums[formattedDate] += gdpData[i].gdp;
    } else {
      // 如果没有，则初始化值
      dateSums[formattedDate] = gdpData[i].gdp;
    }
  }

  // 转换dateSums对象为数组，并按照日期逆序排序
  dateValuePairs = Object.keys(dateSums).map(date => {
    return {
      date: date,
      value: parseFloat((dateSums[date] / 10000000).toFixed(3))
    };
  }).sort((a, b) => b.date.localeCompare(a.date)); // 使用逆序排序
  // 分别提取排序后的日期和值
  const worker_date = dateValuePairs.map(pair => pair.date);
  const worker_value = dateValuePairs.map(pair => pair.value);
  console.log("worker_date", worker_date)
  console.log("worker_value", worker_value)

  const { weekLabels, weekValues, monthLabels, monthValues } = calculateWeeklyAndMonthlyTotals(worker_date, worker_value);
  let Company_value_analysis_day_week_month = {
    dayLabels: worker_date,
    dayValues: worker_value,
    weekLabels: weekLabels,
    weekValues: weekValues,
    monthLabels: monthLabels,
    monthValues: monthValues
  };

  console.log("dateValuePairs", dateValuePairs)

  return Company_value_analysis_day_week_month
}

//缺陷情况
function transformData(defects) {
  const levels = ['1级', '2级', '3级', '4级']; // 定义级别
  let defectMap = new Map();

  // 初始化数据结构
  defects.forEach(defect => {
    if (!defectMap.has(defect.Defect_Name)) {
      defectMap.set(defect.Defect_Name, new Array(levels.length).fill(0));
    }
  });

  // 填充数据
  defects.forEach(defect => {
    let level = defect.Defect_Level;
    let index = levels.indexOf(level); // 使用 indexOf 来找到级别对应的索引
    if (index !== -1) { // 确保找到有效的索引
      defectMap.get(defect.Defect_Name)[index] += defect.Number_of_Defects;
    }
  });

  // 转换为所需的数组格式
  let result = [];
  result.push(['Defect_Name'].concat(levels)); // 添加标题行
  defectMap.forEach((counts, name) => {
    result.push([name].concat(counts));
  });

  return result;
}

function updateDefectCounts(rawData, key) {
  let structural_defects_Table_data = [                                                                                    //结构性缺陷 表格数据
    { name: "支管暗接" }, { name: "变形" }, { name: "错口" }, { name: "异物穿入" },
    { name: "腐蚀" }, { name: "破裂" }, { name: "起伏" }, { name: "渗漏" },
    { name: "脱节" }, { name: "接口材料脱落" }
  ];
  let functional_defects_Table_data = [                                                                                    //功能性缺陷 表格数据
    { name: "沉积" }, { name: "残墙、坝根" }, { name: "浮渣" },
    { name: "结垢" }, { name: "树根" }, { name: "障碍物" }
  ];

  let defects = key;
  let totalByLevel = { '1级': 0, '2级': 0, '3级': 0, '4级': 0, '小计': 0 };
  console.log("defects", defects)
  let map = {};
  rawData.forEach(item => {
    const { Defect_Name, Defect_Level, Number_of_Defects } = item;
    if (!map[Defect_Name]) {
      map[Defect_Name] = { '1级': 0, '2级': 0, '3级': 0, '4级': 0, '小计': 0 };
    }
    map[Defect_Name][Defect_Level] += Number_of_Defects;
    map[Defect_Name]['小计'] += Number_of_Defects;
    totalByLevel[Defect_Level] += Number_of_Defects;
    totalByLevel['小计'] += Number_of_Defects;
  });

  // 更新每个缺陷的数据
  defects = defects.map(defect => {
    const defectData = map[defect.name] || { '1级': 0, '2级': 0, '3级': 0, '4级': 0, '小计': 0 }; // 如果 map 中没有对应的缺陷名，使用默认值
    defect['1级'] = defectData['1级'];
    defect['2级'] = defectData['2级'];
    defect['3级'] = defectData['3级'];
    defect['4级'] = defectData['4级'];
    defect['小计'] = defectData['小计'];
    return defect;
  });

  // 添加总计行
  defects.push({
    name: '小计',
    '1级': totalByLevel['1级'],
    '2级': totalByLevel['2级'],
    '3级': totalByLevel['3级'],
    '4级': totalByLevel['4级'],
    '小计': totalByLevel['小计']
  });
  return { key: defects }
  // this.setData({ [key]: defects });
}

function convertChineseNumToArabic(chineseNum) {
  const numMap = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
  };
  return numMap[chineseNum] || parseInt(chineseNum, 10); // 确保输出为数字
}

function calculateDefect(queryResults) {
  // return new Promise((resolve, reject) => {
  //   this.getworkdata(() => {
  let structural_defects = ["支管暗接", "变形", "错口", "异物穿入", "腐蚀", "破裂", "起伏", "渗漏", "脱节", "接口材料脱落"];
  let functional_defects = ["沉积", "残墙、坝根", "浮渣", "结垢", "树根", "障碍物"];
  let structural_defects_Table_data = [                                                                                    //结构性缺陷 表格数据
    { name: "支管暗接" }, { name: "变形" }, { name: "错口" }, { name: "异物穿入" },
    { name: "腐蚀" }, { name: "破裂" }, { name: "起伏" }, { name: "渗漏" },
    { name: "脱节" }, { name: "接口材料脱落" }
  ];
  let functional_defects_Table_data = [                                                                                    //功能性缺陷 表格数据
    { name: "沉积" }, { name: "残墙、坝根" }, { name: "浮渣" },
    { name: "结垢" }, { name: "树根" }, { name: "障碍物" }
  ];
  const defectCounts = {
    structural: [],
    functional: []
  };
  if (queryResults && Array.isArray(queryResults)) {
    queryResults.forEach(resultGroup => {
      if (Array.isArray(resultGroup.message)) {
        resultGroup.message.forEach(message => {
          if (message && message.infoName === "发现问题") {
            const defects = message.value.split(/[,，、 ]+/);
            defects.forEach(defect => {
              const [level, defectName] = defect.split('级').map(s => s.trim());
              const numericLevel = convertChineseNumToArabic(level);  // 转换等级表示为数字
              const formattedLevel = numericLevel + '级';  // 格式化为 "数字+级"
              const defectType = structural_defects.includes(defectName) ? 'structural'
                : functional_defects.includes(defectName) ? 'functional'
                  : null;

              if (defectType) {
                // 查找是否已存在相同名称和等级的缺陷
                let defectEntry = defectCounts[defectType].find(d => d.Defect_Name === defectName && d.Defect_Level === formattedLevel);
                if (defectEntry) {
                  defectEntry.Number_of_Defects++;
                } else {
                  defectCounts[defectType].push({
                    Defect_Name: defectName,
                    Defect_Level: formattedLevel,  // 确保存储为格式化后的等级
                    Number_of_Defects: 1
                  });
                }
              }
            });
          }
        });
      }
    });
  }
  let structuralResult = transformData(defectCounts.structural);
  let functionalResult = transformData(defectCounts.functional);
  let getstructural_defects_Table_data = updateDefectCounts(defectCounts.structural, structural_defects_Table_data);
  let getfunctional_defects_Table_data = updateDefectCounts(defectCounts.functional, functional_defects_Table_data);
  let totalDefectsSummary = calculatedefectsTotal(defectCounts.structural, defectCounts.functional);

  console.log("structuralResult", structuralResult)
  console.log("functionalResult", functionalResult)
  console.log("defectCounts", defectCounts)

  console.log("structural_defects_Table_data", structural_defects_Table_data)
  console.log("functional_defects_Table_data", functional_defects_Table_data)

  let defects_data = {
    getstructural_defects_Table_data: getstructural_defects_Table_data,
    getfunctional_defects_Table_data: getfunctional_defects_Table_data,
    structuralResult: structuralResult,
    functionalResult: functionalResult,
    totalDefectsSummary: totalDefectsSummary
  }

  return defects_data
  //     resolve();  // 返回最终的统计结果
  //   }, reject);  // 如果 getworkdata 失败，传递错误
  // });
}

function calculatedefectsTotal(structural, functional) {
  let totals = {
    name: "总计",
    '1级': 0,
    '2级': 0,
    '3级': 0,
    '4级': 0,
    小计: 0
  };

  // 遍历结构性缺陷数据
  structural.forEach(item => {
    if (item.name === "小计") {
      totals['1级'] += item['1级'] || 0;
      totals['2级'] += item['2级'] || 0;
      totals['3级'] += item['3级'] || 0;
      totals['4级'] += item['4级'] || 0;
      totals['小计'] += item['小计'] || 0;
    }
  });

  // 遍历功能性缺陷数据
  functional.forEach(item => {
    if (item.name === "小计") {
      totals['1级'] += item['1级'] || 0;
      totals['2级'] += item['2级'] || 0;
      totals['3级'] += item['3级'] || 0;
      totals['4级'] += item['4级'] || 0;
      totals['小计'] += item['小计'] || 0;
    }
  });


  let totalDefectsSummary = [totals]
  // 打印最终的总计数据
  console.log("Total Defects Summary:", totalDefectsSummary);
  return totalDefectsSummary;


}

//班组历史进度分析
function Team_history_progress_analysis(queryResults) {
  // return new Promise((resolve, reject) => {
  //   getworkdata(() => {
  const targetNames = ['管道长度（米）', '明渠长度（米）', '雨水篦子联通管长度（米）'];
  let dailyTotals = {};
  if (queryResults && Array.isArray(queryResults)) {
    queryResults.forEach((queryResult) => {
      const date = queryResult.Date ? new Date(queryResult.Date).toISOString().slice(0, 10) : undefined;
      const workerName = queryResult.Workername; // 获取工人的姓名
      if (date && queryResult.message && Array.isArray(queryResult.message)) {
        if (!dailyTotals[date]) {
          dailyTotals[date] = { totalLength: 0, workerName: workerName };
        }
        queryResult.message.forEach((item) => {
          if (targetNames.includes(item.infoName) && item.value !== '/' && !isNaN(parseFloat(item.value))) {
            dailyTotals[date].totalLength += parseFloat(item.value);
          }
        });
      }
    });
    let resultsArray = Object.keys(dailyTotals).map(date => ({
      workerName: dailyTotals[date].workerName, // 包含Workername
      date: date,
      totalLength: dailyTotals[date].totalLength
    }));
    // 对结果数组按日期排序
    resultsArray.sort((a, b) => a.date.localeCompare(b.date));
    // 设置结果到data
    // this.setData({
    //   workertalByDate: resultsArray
    // });
    // console.log('User_array:', this.data.User_array);
    // console.log('工人日期统计的总长度:', workertalByDate);
    return resultsArray
    // resolve();
  } else {
    console.log("queryResults 不是数组或为空");
    // reject("queryResults 不是数组或为空");
  }
  //   });
  // });
}

function fillDatesAndLengths(workertalByDate) {
  if (!workertalByDate.length) {
    return { weeks: [[], []], months: [[], []] };
  }
  // 获取日期范围
  const startDate = new Date(workertalByDate[0].date);
  const endDate = new Date(workertalByDate[workertalByDate.length - 1].date);
  // 生成连续日期数组
  let currentDate = new Date(startDate);
  const dates = [];
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().slice(0, 10)); // YYYY-MM-DD format
    currentDate.setDate(currentDate.getDate() + 1);
  }
  // 对日期进行降序排序
  dates.sort((a, b) => b.localeCompare(a));
  // 创建一个日期到长度的映射
  const dateToLengthMap = {};
  workertalByDate.forEach(item => {
    dateToLengthMap[item.date] = item.totalLength;
  });
  // 重新生成 lengths 数组以匹配新的日期顺序
  const lengths = dates.map(date => dateToLengthMap[date] || 0);
  const BarChartData = {
    xData: dates,
    seriesData: lengths
  }
  // 使用新的统计函数
  const { weekLabels, weekValues, monthLabels, monthValues } = calculateWeeklyAndMonthlyTotals(dates, lengths);

  let team_value_analysis_day_week_month = {
    dayLabels: worker_date,
    dayValues: worker_value,
    weekLabels: weekLabels,
    weekValues: weekValues,
    monthLabels: monthLabels,
    monthValues: monthValues
  };
  return team_value_analysis_day_week_month
}


//获取works云函数
async function getcloudworksdata(event) {
  // 从event中获取查询参数
  selectedOptions = event.selectedOptions;
  dateRange = event.dateRange;
  console.log("dateRange", dateRange)
  let result = await cloud.callFunction({
    name: 'getworksdata',
    data: {
      selectedOptions: newSelectedOptions,
      dateRange: dateRange
    },
  });
  let queryResults = result.result;
  console.log("result", queryResults)
  return queryResults;
}

//获取works云函数
async function getcloudgetGdpByDatedata(event) {
  // 从event中获取查询参数
  selectedOptions = event.selectedOptions;
  dateRange = event.dateRange;
  console.log("dateRange", dateRange)
  let result = await cloud.callFunction({
    name: 'getGdpByDate',
    data: {
      selectedOptions: newSelectedOptions,
      dateRange: dateRange
    },
  });
  let queryResults = result.result;
  console.log("result", queryResults)
  return queryResults;
}


//班组历史产值分析

function Team_history_value_analysis(gdpData) {
  let dateValuePairs = [];
  let dateSums = {};

  for (let i = 0; i < gdpData.length; i++) {
    const date = new Date(gdpData[i].Date_final);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    // 如果dateSums已经有这个日期的记录，则累加
    if (dateSums[formattedDate]) {
      dateSums[formattedDate] += gdpData[i].gdp;
    } else {
      // 如果没有，则初始化这个日期的值
      dateSums[formattedDate] = gdpData[i].gdp;
    }
  }

  // 将dateSums对象转换为数组，并格式化值
  dateValuePairs = Object.keys(dateSums).map(date => {
    return {
      date: date,
      value: parseFloat((dateSums[date] / 10000000).toFixed(3))
    };
  });


  //   // 将日期和对应的值作为对象存储
  //   dateValuePairs.push({
  //     date: formattedDate,
  //     value: parseFloat((gdpData[i].gdp / 10000000).toFixed(3))
  //   });
  // }
  // 按日期逆序排序
  dateValuePairs.sort((a, b) => b.date.localeCompare(a.date));

  // 分别提取排序后的日期和值
  const worker_date = dateValuePairs.map(pair => pair.date);
  const worker_value = dateValuePairs.map(pair => pair.value);
  console.log("worker_date", worker_date)
  console.log("worker_value", worker_value)

  let { weekLabels, weekValues, monthLabels, monthValues } = calculateWeeklyAndMonthlyTotals(worker_date, worker_value);


  let team_history_value_analysis_day_week_month = {
    dayLabels: worker_date,
    dayValues: worker_value,
    weekLabels: weekLabels,
    weekValues: weekValues,
    monthLabels: monthLabels,
    monthValues: monthValues
  };
  return team_history_value_analysis_day_week_month
}





// 云函数入口函数
exports.main = async (event, context) => {
  try {

    analysisname = event.analysisname
    console.log("analysisname", analysisname)
    selectedOptions = event.selectedOptions;
    dateRange = event.dateRange;
    // 创建 selectedOptions 的深拷贝
    newSelectedOptions = JSON.parse(JSON.stringify(selectedOptions));
    // 清空新数组中的 Workername 值
    // 清空 Workername 数组
    newSelectedOptions.Workername = [];
    let selectdata = {
      selectedOptions: newSelectedOptions,
      dateRange: dateRange
    }
    let results ={}

    if (analysisname === "全部数据" || analysisname === "班组进度分析") {

      let queryResults = await getcloudworksdata(selectdata)
      let Team_progress_analysis_data = Team_progress_analysis(queryResults)
      console.log("Team_progress_analysis_data", Team_progress_analysis_data)
      results.Team_progress_analysis_data = Team_progress_analysis_data;
      // return Team_progress_analysis_data
    }
    if (analysisname === "全部数据" || analysisname === "班组产值分析") {
      let gdpresult = await getcloudgetGdpByDatedata(selectdata)
      let Team_value_analysis_data = Team_value_analysis(gdpresult)
      console.log("Team_value_analysis_data", Team_value_analysis_data)
      results.Team_value_analysis_data = Team_value_analysis_data
      // return Team_value_analysis_data
    }
    if (analysisname === "全部数据" || analysisname === "公司产值分析") {
      let gdpresult = await getcloudgetGdpByDatedata(selectdata)
      let Company_value_analysis_day_week_month = Company_value_analysis(gdpresult)
      console.log("Company_value_analysis_day_week_month", Company_value_analysis_day_week_month)
      results.Company_value_analysis_day_week_month = Company_value_analysis_day_week_month;
      // return Company_value_analysis_day_week_month
    }
    if (analysisname === "全部数据" || analysisname === "缺陷分析") {
      let queryResults = await getcloudworksdata(selectdata)
      let defects_data = calculateDefect(queryResults)
      console.log("defects_data", defects_data)
      results.defects_data = defects_data
      // return defects_data
    }
    if (analysisname === "全部数据" || analysisname === "班组历史进度分析") {
      let queryResults = await getcloudworksdata(event)
      let Team_history_progress_data = Team_history_progress_analysis(queryResults)
      console.log("Team_history_progress_data", Team_history_progress_data)
      results.Team_history_progress_data = Team_history_progress_data
      // return { Team_history_progress_data }
    }
    if (analysisname === "全部数据" || analysisname === "班组历史产值分析") {
      let gdpresult = await getcloudgetGdpByDatedata(event)
      let Team_history_value_analysis_data = Team_history_value_analysis(gdpresult)
      console.log("Team_history_value_analysis_data", Team_history_value_analysis_data)
      results.Team_history_value_analysis_data = Team_history_value_analysis_data
      // return { Team_history_value_analysis_data }
    }
    console.log("results", results)
    return results
  } catch (err) {
    return err  // 返回错误信息
  }








}