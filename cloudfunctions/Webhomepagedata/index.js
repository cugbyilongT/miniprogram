// 云函数入口文件
const { all } = require('axios');
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

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
  return transformedData;
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
  // 提取 workerName 到一个新的数组
  const workerNames = transformedData.map(item => item.workerName);
  // 提取 totalLength 到另一个新的数组
  const totalLengths = transformedData.map(item => item.totalLength);

  // 计算每个 totalLength 的百分比
  // const percentages = totalLengths.map(value => ((value / baselineValue) * 100).toFixed(1) );

  let newData = { workerNames, totalLengths }


  return newData;

  // this.setData({
  //   BarChartData: {
  //     xData: workerNames,
  //     seriesData: totalLengths
  //   }
  // });

}
function reorderWorkerDates(workerDates, teamProgressBar) {
  let {workerNames}  = teamProgressBar;
  // 创建一个新数组，按 workerNames 的顺序包含所有存在的 workerDates 项
  let orderedWorkerDates = workerNames.map(name => 
      workerDates.find(worker => worker.workerName === name)
  ).filter(item => item !== undefined); // 过滤掉未找到的项，即 undefined

  return orderedWorkerDates;
}

function analyzeWorkerDates(queryResults) {
  let workerDates = {};

  queryResults.forEach(entry => {
    let workerName = entry.Workername;
    let date = new Date(entry.Date); // 创建一次 Date 对象
    if (!workerDates[workerName]) {
      workerDates[workerName] = {
        firstDay: date,
        lastDay: date
      };
    } else {
      if (date < workerDates[workerName].firstDay) {
        workerDates[workerName].firstDay = date;
      } else if (date > workerDates[workerName].lastDay) {
        workerDates[workerName].lastDay = date;
      }
    }
  });

  // 延迟日期格式化到最终输出
  let formattedResults = Object.entries(workerDates).map(([worker, dates]) => ({
    workerName: worker,
    firstDay: dates.firstDay.toISOString().slice(0, 10),
    lastDay: dates.lastDay.toISOString().slice(0, 10)
  }));

  return formattedResults;
}

//班组进度分析
function Team_progress_analysis(queryResults,allvalue) {
  if (!queryResults || (Array.isArray(queryResults) && queryResults.length === 0) || (queryResults.constructor === Object && Object.keys(queryResults).length === 0)) {
    return "暂无数据";}
  let workerDates = analyzeWorkerDates(queryResults);
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
    let all_Team_progress_analysis = resultsArray;

    let Team_progress_pie = getalldata(all_Team_progress_analysis);
    let Team_progress_bar = transformDataForECharts(all_Team_progress_analysis);
    let Team_ranking = ranking(Team_progress_pie);
    let reorderedWorkerDates = reorderWorkerDates(workerDates, Team_progress_bar); 
    if (allvalue == true) {
      let totalValue = Team_progress_pie.reduce((sum, item) => sum + item.value, 0);
      let Team_all_progress_analysis_data = {
        reorderedWorkerDates: reorderedWorkerDates,
        Team_progress_bar: Team_progress_bar,
        Team_ranking: Team_ranking,
        all_Team_progress: totalValue
      }
      return Team_all_progress_analysis_data;
    }else{
      let Team_all_progress_analysis_data = {
        reorderedWorkerDates: reorderedWorkerDates,
        Team_progress_bar: Team_progress_bar,
        Team_ranking: Team_ranking
      }
      return Team_all_progress_analysis_data;
    }

  } else {
    console.log("queryResults 不是数组或为空");
    // reject("queryResults 不是数组或为空");
  }

  // });
}

//班组产值分析
function Team_value_analysis(gdpData, allvalue) {
  if (!gdpData || (Array.isArray(gdpData) && gdpData.length === 0) || (gdpData.constructor === Object && Object.keys(gdpData).length === 0)) {
    return "暂无数据";}
  let workerDates = analyzeWorkerDates(gdpData);
  // 创建一个 Set 对象用于存储去重后的 worker_name
  const workerNameSet = new Set();
  // 创建一个对象用于存储每个 worker_name 对应的 gdp 之和
  const workerGdpSum = {};
  // 遍历 gdpData 数组
  gdpData.forEach(item => {
    // 如果 item.Workername 存在且不在 Set 中
    if (item.Workername && !workerNameSet.has(item.Workername)) {
      // 将其添加到 Set 中
      workerNameSet.add(item.Workername);
      // 初始化对应的 gdp 之和为 0
      workerGdpSum[item.Workername] = 0;
    }
    // 累加 gdp 值
    if (item.Workername && item.gdp) {
      workerGdpSum[item.Workername] += item.gdp;
    }
  });

  // 将 workerGdpSum 转换为数组并排序
  const sortedWorkerData = Object.entries(workerGdpSum)
    .map(([name, value]) => ({ name, value: (value / 10000000).toFixed(3) }))
    .sort((a, b) => b.value - a.value); // 按 value 从大到小排序

  // 分别提取排序后的 worker_name 和 worker_value
  const Workername = sortedWorkerData.map(item => item.name);
  const worker_value = sortedWorkerData.map(item => item.value);

  // 将 Set 转换为数组并赋值给 worker_name
  //         worker_name = [...workerNameSet];
  //         // 将 workerGdpSum 转换为数组并赋值给 worker_value
  //         worker_value = Object.entries(workerGdpSum)
  // .map(([name, value]) => (value / 10000000).toFixed(3));

  let Team_value_analysis_BarChartData = {
    workerNames: Workername,
    seriesData: worker_value
  }
  // 计算百分比并添加到 Team_value_analysis_BarChartData
  // let percentageData = worker_value.map(value => ((value / baselineValue) * 100).toFixed(1));
  // Team_value_analysis_BarChartData.percentageData = percentageData;

  let Team_value_analysis_PieChartData = []
  for (let i = 0; i < Workername.length; i++) {
    Team_value_analysis_PieChartData.push({
      name: Workername[i],
      value: worker_value[i]
    })
  }
  // 对 PieChartData 进行排序，根据 value 值降序排列
  Team_value_analysis_PieChartData.sort((a, b) => b.value - a.value);
  // Team_value_analysis_PieChartData = Team_value_analysis_PieChartData
  let Team_value_analysis_ranking = ranking(Team_value_analysis_PieChartData)
  let reorderedWorkervalueDates = reorderWorkerDates(workerDates, Team_value_analysis_BarChartData); 

  if (allvalue == true){
    let totalValue = Team_value_analysis_PieChartData.reduce((sum, item) => {
      return sum + parseFloat(item.value);
    }, 0);
    let roundedTotalValue = Math.round(totalValue * 100) / 100;
    let Team_value_analysis_data = {
      reorderedWorkervalueDates: reorderedWorkervalueDates,
      Team_value_analysis_BarChartData: Team_value_analysis_BarChartData,
      Team_value_analysis_ranking: Team_value_analysis_ranking,
      Team_all_value : roundedTotalValue
    }
    return Team_value_analysis_data;

  }else{
    let Team_value_analysis_data = {
      reorderedWorkervalueDates: reorderedWorkervalueDates,
      Team_value_analysis_BarChartData: Team_value_analysis_BarChartData,
      Team_value_analysis_ranking: Team_value_analysis_ranking
    }
    return Team_value_analysis_data;
  }

}

function calculateWeeklyAndMonthlyTotals(dates, values) {
  const weeklyTotals = {};
  const monthlyTotals = {};
  dates.forEach((date, index) => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    // 计算周一的日期
    const mondayDate = new Date(dateObj);
    mondayDate.setDate(dateObj.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const mondayLabel = mondayDate.toISOString().slice(0, 10); // YYYY-MM-DD format

    const month = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

    // 按周和月聚合值，确保转换为数字
    // 更新周总计，保留一位小数
    weeklyTotals[mondayLabel] = Math.round(((weeklyTotals[mondayLabel] || 0) + parseFloat(values[index])) * 100) / 100;

    // 更新月总计，保留一位小数
    monthlyTotals[month] = Math.round(((monthlyTotals[month] || 0) + parseFloat(values[index])) * 100) / 100;
    // weeklyTotals[mondayLabel] = (weeklyTotals[mondayLabel] || 0) + parseFloat(values[index]);
    // monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(values[index]);
    // weeklyTotals[mondayLabel] = weeklyTotals[mondayLabel] || 0;
    // monthlyTotals[month] = monthlyTotals[month] || 0;

    // weeklyTotals[mondayLabel] += values[index];
    // monthlyTotals[month] += values[index];
  });

  const weekLabels = Object.keys(weeklyTotals).sort((a, b) => b.localeCompare(a));
  const weekValues = weekLabels.map(label => weeklyTotals[label]);
  const monthLabels = Object.keys(monthlyTotals).sort((a, b) => b.localeCompare(a));
  const monthValues = monthLabels.map(label => monthlyTotals[label]);
  return {
    weekLabels,
    weekValues,
    monthLabels,
    monthValues
  };
}

//公司产值分析
function Company_value_analysis(gdpData,day_outvalue_comp,weekly_outvalue_comp,monthly_outvalue_comp) {
  let dateValuePairs = [];
  let dateSums = {};
  for (let i = 0; i < gdpData.length; i++) {
    const date = new Date(gdpData[i].Date);
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
  
  // 使用 reduce 方法计算总和
  const totalValue = worker_value.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  const roundedTotalValue = Math.round(totalValue * 100) / 100;
  const { weekLabels, weekValues, monthLabels, monthValues } = calculateWeeklyAndMonthlyTotals(worker_date, worker_value);

  // 计算百分比
  const dayPercentages = worker_value.map(length => ((length / day_outvalue_comp) * 100).toFixed(1) );
  const weekPercentages = weekValues.map(value => ((value / weekly_outvalue_comp) * 100).toFixed(1));
  const monthPercentages = monthValues.map(value => ((value / monthly_outvalue_comp) * 100).toFixed(1) );

  let Company_value_analysis_day_week_month = {
    dayLabels: worker_date,
    dayValues: worker_value,
    dayPercentages: dayPercentages,
    weekLabels: weekLabels,
    weekValues: weekValues,
    weekPercentages: weekPercentages,
    monthLabels: monthLabels,
    monthValues: monthValues,
    monthPercentages: monthPercentages,
    comp_all_value: roundedTotalValue 
  };
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
  return totalDefectsSummary;
}

//班组历史进度分析
function Team_history_progress_analysis(queryResults,Daily_workload_plan,Weekly_workload_plan,Monthly_workload_plan) {
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

    let team_value_analysis_day_week_month = fillDatesAndLengths(resultsArray,Daily_workload_plan,Weekly_workload_plan,Monthly_workload_plan);
    // 设置结果到data
    // this.setData({
    //   workertalByDate: resultsArray
    // });
    // console.log('User_array:', this.data.User_array);
    // console.log('工人日期统计的总长度:', workertalByDate);
    return team_value_analysis_day_week_month
    // resolve();
  } else {
    console.log("queryResults 不是数组或为空");
    // reject("queryResults 不是数组或为空");
  }
  //   });
  // });
}

function fillDatesAndLengths(workertalByDate,Daily_workload_plan,Weekly_workload_plan,Monthly_workload_plan) {
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
  // const BarChartData = {
  //   xData: dates,
  //   seriesData: lengths
  // }
  // 使用新的统计函数
  const { weekLabels, weekValues, monthLabels, monthValues } = calculateWeeklyAndMonthlyTotals(dates, lengths);

  // 计算百分比
  const dayPercentages = lengths.map(length => ((length / Daily_workload_plan) * 100).toFixed(1));
  const weekPercentages = weekValues.map(value => ((value / Weekly_workload_plan) * 100).toFixed(1));
  const monthPercentages = monthValues.map(value => ((value / Monthly_workload_plan) * 100).toFixed(1));

  let team_value_analysis_day_week_month = {
    dayLabels: dates,
    dayValues: lengths,
    dayPercentages: dayPercentages,
    weekLabels: weekLabels,
    weekValues: weekValues,
    weekPercentages: weekPercentages,
    monthLabels: monthLabels,
    monthValues: monthValues,
    monthPercentages: monthPercentages
  };
  return team_value_analysis_day_week_month
}


//获取works云函数
async function getcloudworksdata(event) {
  // 从event中获取查询参数
  selectedOptions = event.selectedOptions;
  dateRange = event.dateRange;
  let result = await cloud.callFunction({
    name: 'getworksdata',
    data: {
      selectedOptions: selectedOptions,
      dateRange: dateRange
    },
  });
  let queryResults = result.result;
  return queryResults;
}

//获取works云函数
async function getcloudgetGdpByDatedata(event) {
  // 从event中获取查询参数
  selectedOptions = event.selectedOptions;
  dateRange = event.dateRange;
  let result = await cloud.callFunction({
    name: 'getGdpByDate',
    data: {
      selectedOptions: selectedOptions,
      dateRange: dateRange
    },
  });
  let queryResults = result.result;
  return queryResults;
}


//班组历史产值分析

function Team_history_value_analysis(gdpData,Daily_production_value_plan,Weekly_production_value_plan,Monthly_production_value_plan) {
  let dateValuePairs = [];
  let dateSums = {};

  for (let i = 0; i < gdpData.length; i++) {
    const date = new Date(gdpData[i].Date);
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

  let { weekLabels, weekValues, monthLabels, monthValues } = calculateWeeklyAndMonthlyTotals(worker_date, worker_value);

  // 计算百分比
  const dayPercentages = worker_value.map(length => ((length / Daily_production_value_plan) * 100).toFixed(1));
  const weekPercentages = weekValues.map(value => ((value / Weekly_production_value_plan) * 100).toFixed(1));
  const monthPercentages = monthValues.map(value => ((value / Monthly_production_value_plan) * 100).toFixed(1));

  let team_history_value_analysis_day_week_month = {
    dayLabels: worker_date,
    dayValues: worker_value,
    dayPercentages: dayPercentages,
    weekLabels: weekLabels,
    weekValues: weekValues,
    weekPercentages: weekPercentages,
    monthLabels: monthLabels,
    monthValues: monthValues,
    monthPercentages: monthPercentages
  };
  return team_history_value_analysis_day_week_month
}

function calculateTotalDays(startData, endData) {
  // 确保日期格式正确，这里假设 startData 和 endData 是 'YYYY-MM-DD' 格式的字符串
  const startDate = new Date(startData);
  const endDate = new Date(endData);

  // 计算两个日期之间的差值（以毫秒为单位）
  const differenceInMilliseconds = endDate - startDate;

  // 将毫秒转换为天数
  const differenceInDays = Math.ceil(differenceInMilliseconds / (1000 * 60 * 60 * 24));

  // 返回总天数（包含起始和结束日期）
  return differenceInDays + 1;
}


// 获取当前日期并格式化为 YYYY-MM-DD 格式
// function getFormattedDate() {
//   const date = new Date();
//   const year = date.getFullYear(); // 获取年份
//   const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 获取月份，月份从0开始计数，所以需要+1
//   const day = date.getDate().toString().padStart(2, '0'); // 获取日期

//   return `${year}-${month}-${day}`; // 使用模板字符串返回格式化的日期
// }

function getdata(queryResults){
  // 用于存储结果的数组
let todaysData = [];
let thisWeeksData = [];
let thisMonthsData = [];

// 获取当前日期和时间信息
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 今天的日期，忽略时间
const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - today.getDay() + 1); // 本周第一天（周一）
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // 本月第一天

// 函数用于判断日期是否在同一周
function isSameWeek(d1, d2) {
    return d1 >= startOfWeek && d1 < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
}

// 函数用于判断日期是否在同一月
function isSameMonth(d1, d2) {
    return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

// 遍历数据，分类存储
queryResults.forEach(item => {
    const itemDate = new Date(item.Date);

    if (itemDate.toDateString() === today.toDateString()) {
        todaysData.push(item);
    }
    if (isSameWeek(itemDate, today)) {
        thisWeeksData.push(item);
    }
    if (isSameMonth(itemDate, today)) {
        thisMonthsData.push(item);
    }
});
return {
    todaysData,
    thisWeeksData,
    thisMonthsData  
}

}


// 云函数入口函数
exports.main = async (event, context) => {

  // 设置 CORS 头部
  const headers = {
    'Access-Control-Allow-Origin': '*', // 允许所有域名访问，或者指定域名如 https://example.com
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // 允许的方法
    'Access-Control-Allow-Headers': 'Content-Type', // 允许的请求头
    'Access-Control-Max-Age': '86400' // 预检请求的缓存时间(秒)
  };

  if (!event.body) {
    return {
      event,
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'No data provided' })
    };
  }
  console.log(event.body)
  try {
    // 如果是OPTIONS请求，返回204状态码（无内容响应）
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }
    if (event.httpMethod === 'POST') {
      let body = JSON.parse(event.body);
      analysisname = body.analysisname
      selectedOptions = body.selectedOptions;
      dateRange = body.dateRange;
      let allselectdata = {
        selectedOptions: selectedOptions,
        dateRange: dateRange
      }
    // const body = event
    // analysisname = body.analysisname
    // let selectedOptions = body.selectedOptions;
    // dateRange = body.dateRange;
    // let allselectdata = {
    //   selectedOptions: selectedOptions,
    //   dateRange: dateRange
    // }
    // let todaydate = getFormattedDate()
    // console.log("todaydate", todaydate)
    // let date = calculateTotalDays(dateRange.start, dateRange.end)
    // 假设 body 对象包含从某个请求体或者其他来源获取的数据
    let Monthly_workload_plan = Number(body.Monthly_workload_plan);
    let Monthly_production_value_plan = Number(body.Monthly_production_value_plan);
    let Monthly_outvalue_comp = Number(body.Monthly_outvalue_comp);

    let Weekly_workload_plan = Math.round((Monthly_workload_plan / 4) * 100) / 100,
        Weekly_production_value_plan =  Math.round((Monthly_production_value_plan / 4) * 100) / 100,
        weekly_outvalue_comp = Math.round((Monthly_outvalue_comp / 4) * 100) / 100,
        Daily_workload_plan = Math.round((Monthly_workload_plan / 30) * 100) / 100,
        Daily_production_value_plan = Math.round((Monthly_production_value_plan / 30) * 100) / 100,
        Daily_outvalue_comp = Math.round((Monthly_outvalue_comp / 30) * 100) / 100,
      // 创建 selectedOptions 的深拷贝
      newSelectedOptions = JSON.parse(JSON.stringify(selectedOptions));

    // let allvalue = true // 是否为全部数据
    // let all_value = false // 是否为全部数据
    // 清空新数组中的 Workername 值
    // 清空 Workername 数组
    newSelectedOptions.Workername = [];
    let selectdata = {
      selectedOptions: newSelectedOptions,
      dateRange: dateRange
    }
    let results = {}
    if (analysisname === "全部数据" || analysisname === "班组进度分析") {
      let Team_progress ={}
      let queryResults = await getcloudworksdata(selectdata)
      let { todaysData, thisWeeksData, thisMonthsData } = getdata(queryResults)
      let Team_all_progress_analysis_data = Team_progress_analysis(queryResults, allvalue = true)
      let Team_daily_progress_analysis_data = Team_progress_analysis(todaysData, allvalue = false)
      let Team_weekly_progress_analysis_data = Team_progress_analysis(thisWeeksData, allvalue = false)
      let Team_monthly_progress_analysis_data = Team_progress_analysis(thisMonthsData, allvalue = false)
        // 将所有相关数据放入 Team_progress 对象中
      Team_progress = {
        all_progress: Team_all_progress_analysis_data,
        daily_progress: Team_daily_progress_analysis_data,
        weekly_progress: Team_weekly_progress_analysis_data,
        monthly_progress: Team_monthly_progress_analysis_data,
        Monthly_workload_plan: Monthly_workload_plan,
        Weekly_workload_plan: Weekly_workload_plan,
        Daily_workload_plan: Daily_workload_plan
      };
      results.Team_progress = Team_progress;
    }
    if (analysisname === "全部数据" || analysisname === "班组产值分析") {
      let Team_output_value = {}
      // let baselineValue = Daily_production_value_plan * date
      let gdpresult = await getcloudgetGdpByDatedata(selectdata)
      let { todaysData, thisWeeksData, thisMonthsData } = getdata(gdpresult)
      let Team_all_value_analysis_data = Team_value_analysis(gdpresult, allvalue = true)
      let Team_daily_value_analysis_data = Team_value_analysis(todaysData, allvalue = false)
      let Team_weekly_value_analysis_data = Team_value_analysis(thisWeeksData, allvalue = false)
      let Team_monthly_value_analysis_data = Team_value_analysis(thisMonthsData, allvalue = false)
      Team_output_value = {
        all_value: Team_all_value_analysis_data,
        daily_value: Team_daily_value_analysis_data,
        weekly_value: Team_weekly_value_analysis_data,
        monthly_value: Team_monthly_value_analysis_data,
        Monthly_production_value_plan: Monthly_production_value_plan,
        Weekly_production_value_plan: Weekly_production_value_plan,
        Daily_production_value_plan: Daily_production_value_plan,
      };
      // Team_value_analysis_data.baselineValue = baselineValue;
      results.Team_output_value = Team_output_value
      // return Team_value_analysis_data
    }
    if (analysisname === "全部数据" || analysisname === "公司产值分析") {
      let gdpresult = await getcloudgetGdpByDatedata(selectdata)
      let Company_value_analysis_day_week_month = Company_value_analysis(gdpresult, Daily_outvalue_comp, weekly_outvalue_comp, Monthly_outvalue_comp)
      Company_value_analysis_day_week_month.day_outvalue_comp = Daily_outvalue_comp;
      Company_value_analysis_day_week_month.week_outvalue_comp = weekly_outvalue_comp;
      Company_value_analysis_day_week_month.month_outvalue_comp = Monthly_outvalue_comp;
      results.Company_value_analysis_day_week_month = Company_value_analysis_day_week_month;
      // return Company_value_analysis_day_week_month
    }
    if (analysisname === "全部数据" || analysisname === "缺陷分析") {
      let queryResults = await getcloudworksdata(selectdata)
      let defects_data = calculateDefect(queryResults)
      results.defects_data = defects_data
      // return defects_data
    }
    if (analysisname === "全部数据" || analysisname === "班组历史进度分析") {
      let queryResults = await getcloudworksdata(allselectdata)
      let Team_history_progress_data = Team_history_progress_analysis(queryResults, Daily_workload_plan, Weekly_workload_plan, Monthly_workload_plan)
      Team_history_progress_data._daybaselineValue = Daily_workload_plan;
      Team_history_progress_data._weekbaselineValue = Weekly_workload_plan;
      Team_history_progress_data._monthbaselineValue = Monthly_workload_plan;
      results.Team_history_progress_data = Team_history_progress_data
      // return { Team_history_progress_data }
    }
    if (analysisname === "全部数据" || analysisname === "班组历史产值分析") {
      let gdpresult = await getcloudgetGdpByDatedata(allselectdata)
      let Team_history_value_analysis_data = Team_history_value_analysis(gdpresult, Daily_production_value_plan, Weekly_production_value_plan, Monthly_production_value_plan)
      Team_history_value_analysis_data.day_baselineValue = Daily_production_value_plan;
      Team_history_value_analysis_data.week_baselineValue = Weekly_production_value_plan;
      Team_history_value_analysis_data.month_baselineValue = Monthly_production_value_plan;
      results.Team_history_value_analysis_data = Team_history_value_analysis_data
      // return { Team_history_value_analysis_data }
    }
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(results)
    };
     }
  } catch (err) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: err.message })
    };
  }


}