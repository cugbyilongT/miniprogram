// pages/analysis/analysis_chart.js
import * as echarts from '../../ec-canvas/echarts';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    queryResults: [],    //查询结果
    day_outvalue_comp: 0, //公司日计划产值

    baselineValue: 0,   //计划值

    Daily_workload_plan: 0,         //日计划工作量
    Daily_production_value_plan: 0, //日计划产值
    Weekly_workload_plan: 0,         //周计划工作量
    Weekly_production_value_plan: 0, //周计划产值
    Monthly_workload_plan: 0,         //月计划工作量
    Monthly_production_value_plan: 0, //月计划产值

    structural_defects: ["支管暗接", "变形", "错口", "异物穿入", "腐蚀", "破裂", "起伏", "渗漏", "脱节", "接口材料脱落"],   //结构性缺陷 柱状图参数
    functional_defects: ["沉积", "残墙、坝根", "浮渣", "结垢", "树根", "障碍物"],                                         //功能性缺陷 柱状图参数

    structural_defects_Table_data: [                                                                                    //结构性缺陷 表格数据
      { name: "支管暗接" }, { name: "变形" }, { name: "错口" }, { name: "异物穿入" },
      { name: "腐蚀" }, { name: "破裂" }, { name: "起伏" }, { name: "渗漏" },
      { name: "脱节" }, { name: "接口材料脱落" }
    ],
    functional_defects_Table_data: [                                                                                    //功能性缺陷 表格数据
      { name: "沉积" }, { name: "残墙、坝根" }, { name: "浮渣" },
      { name: "结垢" }, { name: "树根" }, { name: "障碍物" }
    ],
    showTable: false,    //表格显示

    totalDefectsSummary:{}, //总缺陷数

    structuralResult:[], //结构缺陷数据
    functionalResult:[], //功能缺陷数据

    defectCounts : {     //缺陷统计数据
      structural: [],
      functional: []
    }, 

    isSel: 1,           //日周月数据切换
    activeKey: 0,       //日周月按钮显示

    DisplayData: {},    //名次排序
    isLimited: false,   //排名显示设置，当为真时显示前三名后三名，否则显示全部名次（设定为当班组数量小于6组时显示全部名次排名，否则显示前三名后三名）

    dayLabels: [],      //工程量\产值   日标签（x轴）
    dayValues: [],      //工程量\产值   日值
    weekLabels: [],     //工程量\产值   周标签（x轴）
    weekValues: [],     //工程量\产值   周值
    monthValues: [],    //工程量\产值   月值
    monthLabels: [],    //工程量\产值   月标签（x轴）

    PieChartData: [],     //饼状图数据
    BarChartData: {       //柱状图数据
      xData: [],          //x轴数据
      seriesData: []      //seriesData数据（定义该数据之后图表直接生成y轴数据）
    },

    workertalByDate: [],   //单个班组历史工作量数据
    projects: [],           // 项目列表数据
    selecteddata: [],       // 选择的查询条件

    totalByDate: [],         // 全部班组历史工作量数据
    dateRange: {            // 日期范围    
      start: '',
      end: '',
      // fileName: "",
    },
    initBarChart: {
      lazyLoad: true // 懒加载
    },
    initdefectBarChart: {
      lazyLoad: true // 懒加载
    },
    initPieChart: {
      lazyLoad: true // 懒加载
    },
    Work_array: [],
    Project_array: [],
    Project_id_array: [],
    User_array: [],
    User_index: 0,
    User_name: "",
    Work_index: 25,
    Work_name: "清疏台账",
    Project_index: 0,
    Project_name: "大龙街2024年排水管网清、查项目",
    analysis_st_date: '',
    analysis_ed_date: '',
    analysisName: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const analysisName = options.analysisName;
    this.setData({
      analysisName: analysisName
    })
    console.log("analysisName", this.data.analysisName)
    // 根据 analysisName 渲染对应的图表
    this.getProjectsWorks()
    console.log("onload渲染完成")
    // wx.cloud.callFunction({
    //   name: 'getWellTest',

    // })
    //   .then(res => {
    //     console.log('getWellTest', res.result)
    //   })
    //   .catch(err => {
    //     console.error('getWellTest', err),
    //       wx.showToast({
    //         title: '获取数据失败',
    //         icon: 'none',
    //         duration: 2000
    //       });
    //   });

  },
  getUserByProject: function (temp_project_id) {
    wx.cloud.callFunction({
      name: 'getUsersByProject',
      data: {
        _id: temp_project_id
      }
    })
      .then(res => {
        if (res.result.success) {
          console.log('获取项目成员成功', res.result.members);
          let User_array = res.result.members;
          this.setData({
            User_array: User_array
          });
        } else {
          console.error('获取项目成员失败', res.result.message);
          wx.showToast({
            title: '获取项目成员失败',
            icon: 'none',
            duration: 2000
          });
        }
      })
      .catch(err => {
        console.error('获取项目成员失败', err);
        wx.showToast({
          title: '获取项目成员失败',
          icon: 'none',
          duration: 2000
        });
      });

  },
  getProjectsWorks() {
    wx.cloud.callFunction({
      name: 'getProjects',
    })
      .then(res => {
        console.log('获取项目列表成功', res.result.data)
        console.log(res.result.data)
        // 项目列表
        let Project_array = res.result.data.map(item => item.name)
        let Project_id_array = res.result.data.map(item => item._id)
        let Work_array_temp = res.result.data.map(item => item.work_message)
        console.log(Work_array_temp)
        let Work_array = extractItems(Work_array_temp);
        let temp_project_id = Project_id_array[this.data.Project_index];
        let Daily_workload_plan = res.result.data[this.data.Project_index].Daily_workload_plan;
        let Daily_production_value_plan = res.result.data[this.data.Project_index].Daily_production_value_plan;
        let day_outvalue_comp = res.result.data[this.data.Project_index].day_outvalue_comp;
        console.log(temp_project_id);
        console.log("Daily_workload_plan", Daily_workload_plan)
        console.log("Daily_production_value_plan", Daily_production_value_plan)
        console.log("day_outvalue_comp", day_outvalue_comp)
        this.getUserByProject(temp_project_id)
        console.log(Work_array)
        this.setData({
          Project_array: Project_array,
          Work_array: Work_array,
          Project_id_array: Project_id_array,
          Daily_workload_plan: Daily_workload_plan,
          Daily_production_value_plan: Daily_production_value_plan,
          day_outvalue_comp: day_outvalue_comp
        }, () => {
          console.log("Project_array:", this.data.Project_array)
        })
      })
      .catch(err => {
        console.error('获取项目列表失败', err)
        //弹窗提示错误信息
        wx.showToast({
          title: '获取项目列表失败',
          icon: 'none',
          duration: 2000
        })
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
  bind_Work_PickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      Work_index: e.detail.value,
      Work_name: this.data.Work_array[e.detail.value]
    })
  },
  bind_Project_PickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    let temp_project_id = this.data.Project_id_array[e.detail.value]
    this.getUserByProject(temp_project_id)
    this.setData({
      Project_index: e.detail.value,
      Project_name: this.data.Project_array[e.detail.value]
    })
  },
  bindSTDateChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      analysis_st_date: e.detail.value
    })
    console.log("this.data.analysis_st_date", this.data.analysis_st_date)
  },
  bindEDDateChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      analysis_ed_date: e.detail.value
    })
    console.log("this.data.analysis_ed_date", this.data.analysis_ed_date)
  },
  bind_User_PickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      User_index: e.detail.value,
      User_name: this.data.User_array[e.detail.value]
    })
  },

  getworkdata(callback) {
    let newData = {
      Project: [this.data.Project_name],
      Section: [],
      Task: [],
      Work: [this.data.Work_name],
      Workername: [],
    }
    if (this.data.analysisName == "班组进度分析") {
      newData.Workername = [];
    } else if (this.data.analysisName == "班组历史进度分析") {
      newData.Workername = [this.data.User_name];
    }
    const startdata = this.data.analysis_st_date;
    const enddata = this.data.analysis_ed_date;
    this.setData({
      selecteddata: newData,
      dateRange: {
        start: startdata,
        end: enddata,
      },
    });
    console.log(this.data.selecteddata)
    console.log(this.data.dateRange)
    // 调用云函数
    wx.cloud.callFunction({
      name: 'getworksdata',
      data: {
        selectedOptions: this.data.selecteddata,
        dateRange: this.data.dateRange
      },
      success: res => {
        console.log('云函数查询结果:', res.result);
        wx.hideLoading(); // 关闭加载提示
        // ...处理成功的结果...
        // 判断查询结果是否为空
        if (res.result && res.result.length > 0) {
          // 更新页面数据
          this.setData({
            queryResults: res.result,
          });

          console.log("结果：", this.data.queryResults)
          if (typeof callback === 'function') {
            callback(); // 调用回调函数
          }
        } else {
          // 查询结果为空时的处理
          wx.showToast({
            title: '未找到数据，请重新输入查找内容',
            icon: 'none', // “none”表示不显示图标
            duration: 2000 // 提示框显示时间
          });
        }
      },
      fail: err => {
        console.error('云函数调用失败:', err);
      }
    });
  },

  calculateTotal() {
    return new Promise((resolve, reject) => {
      this.getworkdata(() => {
        const targetNames = ['管道长度（米）', '明渠长度（米）', '雨水篦子联通管长度（米）'];
        let dailyTotals = {};
        if (this.data.queryResults && Array.isArray(this.data.queryResults)) {
          this.data.queryResults.forEach((queryResult) => {
            const date = queryResult.Date ? new Date(queryResult.Date).toISOString().slice(0, 10) : undefined;
            const workerName = queryResult.Workername; // 获取工人的姓名
            if (this.data.analysisName == "班组进度分析") {
              if (date && workerName && this.data.User_array.includes(workerName) &&
                queryResult.message && Array.isArray(queryResult.message)) {
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
            }
            else if (this.data.analysisName == "班组历史进度分析") {
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
            }
          });
          if (this.data.analysisName == "班组进度分析") {
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
            this.setData({
              totalByDate: resultsArray
            });
            console.log('User_array:', this.data.User_array);
            console.log('工人日期统计的总长度:', this.data.totalByDate);
            this.getalldata();
            this.transformDataForECharts();
            this.ranking();
          }
          else if (this.data.analysisName == "班组历史进度分析") {
            let resultsArray = Object.keys(dailyTotals).map(date => ({
              workerName: dailyTotals[date].workerName, // 包含Workername
              date: date,
              totalLength: dailyTotals[date].totalLength
            }));
            // 对结果数组按日期排序
            resultsArray.sort((a, b) => a.date.localeCompare(b.date));
            // 设置结果到data
            this.setData({
              workertalByDate: resultsArray
            });
            console.log('User_array:', this.data.User_array);
            console.log('工人日期统计的总长度:', this.data.workertalByDate);
            this.fillDatesAndLengths();
          }
          resolve();
        } else {
          console.log("queryResults 不是数组或为空");
          reject("queryResults 不是数组或为空");
        }
      });
    });
  },

  transformData(defects) {
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
  },

  // updateDefectCounts: function(rawData, key) {
  //   let defects = this.data[key];
  //   let map = {};

  //   rawData.forEach(item => {
  //     const { Defect_Name, Defect_Level, Number_of_Defects } = item;
  //     if (!map[Defect_Name]) {
  //       map[Defect_Name] = {};
  //     }
  //     map[Defect_Name][Defect_Level] = Number_of_Defects;
  //   });
  //   console.log("defects", defects)
  //   defects = defects.map(defect => {
  //     defect['1级'] = map[defect.name] && map[defect.name]['1级'] ? map[defect.name]['1级'] : 0;
  //     defect['2级'] = map[defect.name] && map[defect.name]['2级'] ? map[defect.name]['2级'] : 0;
  //     defect['3级'] = map[defect.name] && map[defect.name]['3级'] ? map[defect.name]['3级'] : 0;
  //     defect['4级'] = map[defect.name] && map[defect.name]['4级'] ? map[defect.name]['4级'] : 0;
  //     return defect;
  //   });

  //   this.setData({ [key]: defects });
  // },
  
  updateDefectCounts: function(rawData, key) {
    console.log("key", key)
    let defects = this.data[key];
    console.log("this.data[key]", this.data[key])
    console.log("defects", defects)
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

    this.setData({ [key]: defects });
},

convertChineseNumToArabic(chineseNum) {
    const numMap = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };
    return numMap[chineseNum] || parseInt(chineseNum, 10); // 确保输出为数字
  },

  calculateDefect() {
    return new Promise((resolve, reject) => {
      this.getworkdata(() => {
        let structural_defects = this.data.structural_defects;
        let functional_defects = this.data.functional_defects;
        const defectCounts = {
          structural: [],
          functional: []
        };
        if (this.data.queryResults && Array.isArray(this.data.queryResults)) {
          this.data.queryResults.forEach(resultGroup => {
            if (Array.isArray(resultGroup.message)) {
              resultGroup.message.forEach(message => {
                if (message && message.infoName === "发现问题") {
                  const defects = message.value.split(/[,，、 ]+/);
                  defects.forEach(defect => {
                    const [level, defectName] = defect.split('级').map(s => s.trim());
                    const numericLevel = this.convertChineseNumToArabic(level);  // 转换等级表示为数字
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
        let structuralResult = this.transformData(defectCounts.structural);
        let functionalResult = this.transformData(defectCounts.functional);

        this.setData({
          structuralResult: structuralResult,
          functionalResult: functionalResult,
          defectCounts: defectCounts
        });
        console.log("structuralResult", this.data.structuralResult)
        console.log("functionalResult", this.data.functionalResult)
        console.log("defectCounts", this.data.defectCounts)
        this.updateDefectCounts(this.data.defectCounts.structural, "structural_defects_Table_data");
        this.updateDefectCounts(this.data.defectCounts.functional, "functional_defects_Table_data");
        console.log("structural_defects_Table_data", this.data.structural_defects_Table_data)
        console.log("functional_defects_Table_data", this.data.functional_defects_Table_data)
        this.calculatedefectsTotal();
        resolve();  // 返回最终的统计结果
      }, reject);  // 如果 getworkdata 失败，传递错误
    });
  },

  calculatedefectsTotal() {
    let totals = {
      name: "总计",
      '1级': 0,
      '2级': 0,
      '3级': 0,
      '4级': 0,
      小计: 0
    };
  
    // 遍历结构性缺陷数据
    this.data.structural_defects_Table_data.forEach(item => {
      if (item.name === "小计") {
        totals['1级'] += item['1级'] || 0;
        totals['2级'] += item['2级'] || 0;
        totals['3级'] += item['3级'] || 0;
        totals['4级'] += item['4级'] || 0;
        totals['小计'] += item['小计'] || 0;
      }
    });
  
    // 遍历功能性缺陷数据
    this.data.functional_defects_Table_data.forEach(item => {
      if (item.name === "小计") {
        totals['1级'] += item['1级'] || 0;
        totals['2级'] += item['2级'] || 0;
        totals['3级'] += item['3级'] || 0;
        totals['4级'] += item['4级'] || 0;
        totals['小计'] += item['小计'] || 0;
      }
    });
  
    // 更新数据
    this.setData({
      totalDefectsSummary:  [totals]
    });
  
    // 打印最终的总计数据
    console.log("Total Defects Summary:", totals);
  },

  getalldata() {
    // 使用 reduce 方法来聚合数据
    const aggregatedData = this.data.totalByDate.reduce((acc, curr) => {
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

    this.setData({
      PieChartData: transformedData,
    });
    console.log('getalldata工人:', this.data.PieChartData);
  },

  ranking() {
    let rankedData = this.data.PieChartData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    if (rankedData.length > 5) {
      // 对数组进行排序（假设已根据需要排序）
      const topThree = rankedData.slice(0, 3);
      const bottomThree = rankedData.slice(-3);
      this.setData({
        displayData: [...topThree, ...bottomThree],
        isLimited: true
      });
    } else {
      this.setData({
        displayData: rankedData,
        isLimited: false
      });
      console.log('rankingDisplayData:', this.data.displayData);
    }

    // // 假设 PieChartData 已经排序好
    // const pieData = this.data.PieChartData;

    // if (pieData.length <= 5) {
    //   // 数组长度小于等于5，直接显示所有数据
    //   this.setData({
    //     DisplayData: pieData.map((item, index) => ({
    //       rank: index + 1,
    //       name: item.name
    //     }))
    //   });
    //   console.log('rankingDisplayData:', this.data.DisplayData);
    // } else {
    //   // 数组长度大于5，展示前三名和后三名
    //   const topThree = pieData.slice(0, 3);
    //   const lastThree = pieData.slice(-3);
    //   const displayData = topThree.concat(lastThree).map((item, index) => ({
    //     rank: index < 3 ? index + 1 : pieData.length - 3 + index,  // 计算排名
    //     name: item.name
    //   }));
    //   this.setData({
    //     DisplayData: displayData
    //   });
    //   console.log('rankingDisplayData:', this.data.DisplayData);
    // }
  },

  transformDataForECharts() {
    // 使用 reduce 方法来聚合数据
    const aggregatedData = this.data.totalByDate.reduce((acc, curr) => {
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
    this.setData({
      BarChartData: {
        xData: workerNames,
        seriesData: totalLengths
      }
    });

  },


  fillDatesAndLengths() {
    if (!this.data.workertalByDate.length) {
      return { weeks: [[], []], months: [[], []] };
    }
    // 获取日期范围
    const startDate = new Date(this.data.workertalByDate[0].date);
    const endDate = new Date(this.data.workertalByDate[this.data.workertalByDate.length - 1].date);
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
    this.data.workertalByDate.forEach(item => {
      dateToLengthMap[item.date] = item.totalLength;
    });
    // 重新生成 lengths 数组以匹配新的日期顺序
    const lengths = dates.map(date => dateToLengthMap[date] || 0);
    const BarChartData = {
      xData: dates,
      seriesData: lengths
    }
    this.setData({
      BarChartData: BarChartData,
      dayLabels: dates,
      dayValues: lengths,
    });
    // 使用新的统计函数
    const { weekLabels, weekValues, monthLabels, monthValues } = this.calculateWeeklyAndMonthlyTotals(dates, lengths);
    this.setData({
      weekLabels: weekLabels,
      weekValues: weekValues,
      monthLabels: monthLabels,
      monthValues: monthValues
    });
  },

  calculateWeeklyAndMonthlyTotals(dates, values) {
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
  },

  getWeekNumber(d) {
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDays = Math.floor((d - startOfYear) / (24 * 3600 * 1000));
    return Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  },

  section: function (event) {
    // 处理事件的代码
    console.log('Button clicked!');
  },
  calculateTotalValue() {
    return new Promise((resolve, reject) => {
      let newData = {
        Project: [this.data.Project_name],
        Section: [],
        Task: [],
        Work: [this.data.Work_name],
        Workername: [],
      }
      if (this.data.analysisName == "班组历史产值分析") {
        newData.Workername = [this.data.User_name];
      }
      const startdata = this.data.analysis_st_date;
      const enddata = this.data.analysis_ed_date;
      this.setData({
        selecteddata: newData,
        dateRange: {
          start: startdata,
          end: enddata,
        },
      });
      // 调用云函数
      wx.cloud.callFunction({
        name: 'getGdpByDate',
        data: {
          selectedOptions: newData,
          dateRange: {
            start: startdata,
            end: enddata,
          },
        },
      }).then(res => {
        console.log('云函数查询结果:', res.result);
        wx.hideLoading(); // 关闭加载提示
        let gdpData = res.result;
        console.log("1111", gdpData)
        // ...处理成功的结果...
        let Date_final = [];
        let gdp = [];
        let worker_name = [];
        let worker_date = [];
        let worker_value = [];
        if (this.data.analysisName == "班组产值分析") {
          // 创建一个 Set 对象用于存储去重后的 worker_name
          const workerNameSet = new Set();
          console.log("workerNameSet", workerNameSet)
          // 创建一个对象用于存储每个 worker_name 对应的 gdp 之和
          const workerGdpSum = {};
          // 遍历 gdpData 数组
          gdpData.forEach(item => {
            // 如果 item.worker_name 存在且不在 Set 中
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
            .map(([name, value]) => ({ name, value: parseFloat((value / 10000000).toFixed(3)) }))
            .sort((a, b) => b.value - a.value); // 按 value 从大到小排序

          // 分别提取排序后的 worker_name 和 worker_value
          const Workername = sortedWorkerData.map(item => item.name);
          const worker_value = sortedWorkerData.map(item => item.value);

          // 将 Set 转换为数组并赋值给 worker_name
          //         worker_name = [...workerNameSet];
          //         // 将 workerGdpSum 转换为数组并赋值给 worker_value
          //         worker_value = Object.entries(workerGdpSum)
          // .map(([name, value]) => (value / 10000000).toFixed(3));

          console.log("worker_name", Workername)
          console.log("worker_value", Workername)
          this.setData({
            BarChartData: {
              xData: Workername,
              seriesData: worker_value
            }
          });
          let PieChartData = []
          for (let i = 0; i < Workername.length; i++) {
            PieChartData.push({
              name: Workername[i],
              value: worker_value[i]
            })
          }
          // 对 PieChartData 进行排序，根据 value 值降序排列
          PieChartData.sort((a, b) => b.value - a.value);
          this.setData({
            PieChartData: PieChartData
          })
          this.ranking();
        }
        else if (this.data.analysisName == "班组历史产值分析") {
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
          console.log("worker_date", worker_date)
          console.log("worker_value", worker_value)
          this.setData({
            BarChartData: {
              xData: worker_date,
              seriesData: worker_value,
            },
            dayValues: worker_value,
            dayLabels: worker_date
          });
          let { weekLabels, weekValues, monthLabels, monthValues } = this.calculateWeeklyAndMonthlyTotals(worker_date, worker_value);
          this.setData({
            weekLabels: weekLabels,
            weekValues: weekValues,
            monthLabels: monthLabels,
            monthValues: monthValues
          });
        }
        else if (this.data.analysisName == "公司产值分析") {
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
          console.log("worker_date", worker_date)
          console.log("worker_value", worker_value)
          this.setData({
            BarChartData: {
              xData: worker_date,
              seriesData: worker_value,
            },
            dayValues: worker_value,
            dayLabels: worker_date
          });
          const { weekLabels, weekValues, monthLabels, monthValues } = this.calculateWeeklyAndMonthlyTotals(worker_date, worker_value);
          this.setData({
            weekLabels: weekLabels,
            weekValues: weekValues,
            monthLabels: monthLabels,
            monthValues: monthValues
          });

          console.log("dateValuePairs", dateValuePairs)


        }

        resolve();
        // 判断查询结果是否为空
      }).catch(err => {
        console.error('云函数调用失败:', err);
      })

    });
  },


  calculateTotalDays(startData, endData) {
    // 确保日期格式正确，这里假设 startData 和 endData 是 'YYYY-MM-DD' 格式的字符串
    console.log("startData", startData)
    console.log("endData", endData)
    const startDate = new Date(startData);
    const endDate = new Date(endData);

    // 计算两个日期之间的差值（以毫秒为单位）
    const differenceInMilliseconds = endDate - startDate;

    // 将毫秒转换为天数
    const differenceInDays = Math.ceil(differenceInMilliseconds / (1000 * 60 * 60 * 24));

    // 返回总天数（包含起始和结束日期）
    return differenceInDays + 1;
  },

  async selectTap(e) {
    this.showLoading('正在生成图表...'); // 显示加载提示
    if (this.data.analysisName === "班组进度分析") {
      await this.calculateTotal() // 计算总长度
      this.initBarChart()
      this.initPieChart()
    } else if (this.data.analysisName === "班组产值分析") {
      await this.calculateTotalValue() // 计算总产值
      this.initBarChart()
      this.initPieChart()
    } else if (this.data.analysisName === "公司产值分析") {
      await this.calculateTotalValue() // 计算总产值
      this.setData({
        activeKey: 2
      })
      this.initBarChart()

      this.hideLoading(); // 隐藏加载提示
    }

  },
  showLoading(message) {
    wx.showLoading({
      title: message,
      mask: true // 防止触摸穿透
    });
  },

  hideLoading() {
    wx.hideLoading();
  },

  async selectTap1(e) {
    this.showLoading('正在生成图表...'); // 显示加载提示
    if (this.data.analysisName === "班组历史进度分析") {
      await this.calculateTotal() // 计算总长度
      this.initBarChart()

    } else if (this.data.analysisName === "班组历史产值分析") {
      await this.calculateTotalValue() // 计算总产值
      console.log("this.data.BarChartData", this.data.BarChartData)
      this.initBarChart()
    }
    this.setData({
      activeKey: 1
    })
    this.hideLoading(); // 隐藏加载提示
  },

  async defectselectTap(e) {

    this.showLoading('正在生成图表...'); // 显示加载提示
    await this.calculateDefect() // 计算缺陷数量
    this.initdefectBarChart()
    this.hideLoading(); // 隐藏加载提示
    this.setData({
      showTable: !this.data.showTable
    });
  },



  workerselectTap(e) {
    console.log("workerselectTap", e)
    const isSel = e.currentTarget.dataset.sel
    console.log("isSel", isSel)
    const BarChartData = {
      xData: [],
      seriesData: []
    }
    if (this.data.analysisName == "班组历史进度分析" || this.data.analysisName == "班组历史产值分析" || this.data.analysisName == "公司产值分析") {
      if (isSel == 1) {
        BarChartData.xData = this.data.dayLabels
        BarChartData.seriesData = this.data.dayValues
        console.log("BarChartData", BarChartData)
      } else if (isSel == 2) {
        BarChartData.xData = this.data.weekLabels
        BarChartData.seriesData = this.data.weekValues
        console.log("BarChartData", BarChartData)
      } else {
        BarChartData.xData = this.data.monthLabels
        BarChartData.seriesData = this.data.monthValues
        console.log("BarChartData", BarChartData)
      }
    }
    this.setData({
      isSel: e.currentTarget.dataset.sel,
      BarChartData: BarChartData
    })
    this.initBarChart()
  },

  //柱状图
  initBarChart() {
    let displayText = ''; // 显示的文本
    let baselineValue = 0; // 基准线值
    let textlabel = {
      title: ' ',
      xAxisname: ' ',
      yAxisname: ' '
    }

    if (this.data.analysisName == "班组进度分析") {
      textlabel = { title: '班组进度', xAxisname: '班组', yAxisname: '长度（米）' }
      let date = this.calculateTotalDays(this.data.dateRange.start, this.data.dateRange.end)
      console.log("date", date)
      baselineValue = this.data.Daily_workload_plan * date; // 基准线值
      displayText = `计划长度: ${baselineValue} 米`;
      console.log("baselineValue", baselineValue)
    }
    else if (this.data.analysisName == "班组产值分析") {
      textlabel = { title: '班组产值', xAxisname: '班组', yAxisname: '产值（万元）' }
      console.log("this.data.dateRange", this.data.dateRange)
      let date = this.calculateTotalDays(this.data.dateRange.start, this.data.dateRange.end)
      baselineValue = this.data.Daily_production_value_plan * date; // 基准线值
      console.log("date", date)
      displayText = `计划产值: ${baselineValue} 万元`;
      console.log("baselineValue", baselineValue)
    }
    else if (this.data.analysisName == "班组历史进度分析") {
      textlabel = { title: '班组历史进度', xAxisname: '日期', yAxisname: '长度（米）' }
      if (this.data.isSel == 1) { // 日
        baselineValue = this.data.Daily_workload_plan * 1; // 日计划值
      } else if (this.data.isSel == 2) { // 周
        baselineValue = this.data.Daily_workload_plan * 7; // 一周最多7天
      } else { // 月
        baselineValue = this.data.Daily_workload_plan * 30; // 整个日期范围的计划值
      }
      displayText = `计划长度: ${baselineValue} 米`;
    }
    else if (this.data.analysisName == "班组历史产值分析") {
      textlabel = { title: '班组历史产值', xAxisname: '日期', yAxisname: '产值（万元）' }
      if (this.data.isSel == 1) { // 日
        baselineValue = this.data.Daily_production_value_plan * 1; // 日计划值
      } else if (this.data.isSel == 2) { // 周
        baselineValue = this.data.Daily_production_value_plan * 7; // 一周最多7天
      } else { // 月
        baselineValue = this.data.Daily_production_value_plan * 30; // 整个日期范围的计划值
      }
      displayText = `计划产值: ${baselineValue} 万元`;
    }
    else if (this.data.analysisName == "公司产值分析") {
      textlabel = { title: '公司产值', xAxisname: '日期', yAxisname: '产值（万元）' }
      if (this.data.isSel == 1) { // 日
        baselineValue = this.data.day_outvalue_comp * 1; // 日计划值
      } else if (this.data.isSel == 2) { // 周
        baselineValue = this.data.day_outvalue_comp * 7; // 一周最多7天
      } else { // 月
        baselineValue = this.data.day_outvalue_comp * 30; // 整个日期范围的计划值
      }
      displayText = `计划产值: ${baselineValue} 万元`;
    }
    // 绑定组件
    console.log("this.data.BarChartData", this.data.BarChartData)
    this.barComponent = this.selectComponent("#mychart-dom-bar");
    // 初始化柱状图
    this.barComponent.init((canvas, width, height, dpr) => {
      // 初始化图表
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // 解决模糊显示问题
      })
      // 计算最大值和基准线值
      const seriesData = this.data.BarChartData.seriesData;
      const maxValue = Math.max(...seriesData);
      const yAxisMax = Math.max(maxValue, baselineValue); // Y轴的最大值

      // 计算百分比并保留小数点后一位
      const percentageData = seriesData.map(value => {
        return (value / baselineValue * 100).toFixed(1) + '%'; // 计算百分比，保留一位小数，并格式化为字符串
      });

      const option = {
        title: {
          text: textlabel.title,
          subtext: '',
          left: 'center'
        },
        xAxis: {
          type: 'category',
          name: textlabel.xAxisname,
          data: this.data.BarChartData.xData,
        },
        // 声明一个 Y 轴，数值轴。
        yAxis: {
          show: true,
          name: textlabel.yAxisname,
          type: 'value',
          align: 'center',
          max: yAxisMax, // 设置动态最大值
          axisLabel: {
            rotate: 45 // 旋转标签，根据实际情况调整角度
          }
        },
        grid: {
          top: '15%',
          right: '12%',
          left: '15%',
          bottom: '22%'
        },
        series: [{
          type: 'bar',
          barWidth: '20', // 柱的宽度
          data: this.data.BarChartData.seriesData,
          // 柱的数值显示
          label: {
            show: true,
            position: 'top',
            formatter: function (params) {
              return params.value + ' (' + percentageData[params.dataIndex] + ')';
            }
          },
          markLine: {
            name: '基准线',
            silent: true, // 禁止交互，防止影响滚动体验
            symbol: ['none', 'none'], // 去除箭头
            data: [
              {
                yAxis: baselineValue,
                label: {
                  show: true,
                  position: 'middle', // 标签显示在线的末端
                  formatter: function () {
                    return displayText; // 显示计划值
                  }
                },
                lineStyle: {
                  type: 'dashed',
                  color: '#b17063'
                }
              }
            ]

          },
          itemStyle: {
            color: '#3FD0AA',
            barBorderRadius: 2,
            borderWidth: 1,
            shadowColor: '#3FD0AA',
            borderType: 'dashed'
          }
        }],
        // Echarts 横向滚动
        dataZoom: [{
          type: 'inside',
          show: false,
          xAxisIndex: [0],
          startValue: 0,
          endValue: 1,
          height: '5%', // 滚动条高度
          bottom: '5%',
          left: '2%',
          right: '3%',
          startValue: 0, // 从头开始。
          endValue: 3, // 一次性展示6个
        }]
      }
      // 开发中根据从后端获取barData数据,动态更新图表
      option && chart.setOption(option);
      return chart
    })
  },


  //柱状图
  initdefectBarChart() {
    // 绑定组件
    this.barComponent = this.selectComponent("#mychart-dom-bar-structural");
    // 初始化柱状图
    this.barComponent.init((canvas, width, height, dpr) => {
      // 初始化图表
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // 解决模糊显示问题
      })

        // 提取除标题行外的所有缺陷等级数据
    const defectLevels = this.data.structuralResult.slice(1).map(row => row.slice(1));
    // 计算最大缺陷数
    const maxDefects = defectLevels.reduce((max, levels) => {
      const maxInRow = Math.max(...levels);
      return maxInRow > max ? maxInRow : max;
    }, 0);

    // 设置 Y 轴的最大值
    const yAxisMax = maxDefects < 5 ? 5 : maxDefects;

      const option = {
        title: {
          text: "结构性缺陷",
          subtext: '',
          left: 'center'
        },
        legend: {
          top: '5%',
        },
        dataset: {
          source:this.data.structuralResult
        },
        xAxis: {
          type: 'category',
          name: '缺陷',
          
        },
        // 声明一个 Y 轴，数值轴。
        yAxis: {
          show: true,
          name: '缺陷数量',
          type: 'value',
          align: 'center',
          max: yAxisMax, // 设置动态最大值
          axisLabel: {
            rotate: 45 // 旋转标签，根据实际情况调整角度
          }
        },
        grid: {
          top: '20%',
          right: '12%',
          left: '15%',
          bottom: '22%'
        },
        series: [{ type: 'bar' }, { type: 'bar' }, { type: 'bar' }, { type: 'bar' }
      ],
        // Echarts 横向滚动
        dataZoom: [{
          type: 'inside',
          show: false,
          xAxisIndex: [0],
          startValue: 0,
          endValue: 1,
          height: '5%', // 滚动条高度
          bottom: '5%',
          left: '2%',
          right: '3%'
        }]
      }
      // 开发中根据从后端获取barData数据,动态更新图表
      option && chart.setOption(option);
      return chart
    })

    this.barComponent = this.selectComponent("#mychart-dom-bar-functional");
    // 初始化柱状图
    this.barComponent.init((canvas, width, height, dpr) => {
      // 初始化图表
      const chart1 = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // 解决模糊显示问题
      })

              // 提取除标题行外的所有缺陷等级数据
    const defectLevels = this.data.functionalResult.slice(1).map(row => row.slice(1));
      // 计算最大缺陷数
      const maxDefects = defectLevels.reduce((max, levels) => {
        const maxInRow = Math.max(...levels);
        return maxInRow > max ? maxInRow : max;
      }, 0);

      // 设置 Y 轴的最大值
      const yAxisMax = maxDefects < 5 ? 5 : maxDefects;

      const option1 = {
        title: {
          text: "功能性缺陷",
          subtext: '',
          left: 'center'
        },
        legend: {
          top: '5%',
        },
        dataset: {
          source: this.data.functionalResult
        },
        xAxis: {
          type: 'category',
          name: '缺陷',
          
        },
        // 声明一个 Y 轴，数值轴。
        yAxis: {
          show: true,
          name: '缺陷数量',
          type: 'value',
          align: 'center',
          max: yAxisMax, // 设置动态最大值
          axisLabel: {
            rotate: 45 // 旋转标签，根据实际情况调整角度
          }
        },
        grid: {
          top: '20%',
          right: '12%',
          left: '15%',
          bottom: '22%'
        },
        series: [{ type: 'bar' }, { type: 'bar' }, { type: 'bar' }, { type: 'bar' }
      ],
        // Echarts 横向滚动
        dataZoom: [{
          type: 'inside',
          show: true,
          xAxisIndex: [0],
          startValue: 0,
          endValue: 1,
          height: '5%', // 滚动条高度
          bottom: '5%',
          left: '2%',
          right: '3%',
          startValue: 0, // 从头开始。
          endValue: 1, // 一次性展示2个
        }]
      }
      // 开发中根据从后端获取barData数据,动态更新图表
      option1 && chart1.setOption(option1);
    })
  },

  //饼状图
  initPieChart() {

    var option;
    // 绑定组件
    this.barComponent = this.selectComponent("#mychart-dom-pie");
    // 初始化柱状图
    this.barComponent.init((canvas, width, height, dpr) => {

      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // 解决模糊显示问题
      })
      console.log("2222", this.data.PieChartData)

      // 假设图例数据来自某个数据源
      var legendData = this.data.PieChartData.map(item => item.name);

      // 计算图例占用的额外空间（简化示例）
      var extraSpace = Math.floor(16 / 8) * 3; // 假设每增加一个图例项，饼图下移5%

      option = {
        title: {
          text: '班组占比',
          subtext: '',
          left: 'center'
        },
        label: {
          formatter: '{b}: {d}%'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'horizontal',
          left: 'center',
          top: 30,
          itemGap: 5,
          itemWidth: 5,
          itemHeight: 5,
          align: 'left',
        },
        grid: {
          top: '20%',

        },
        series: [
          {
            name: 'Access From',
            type: 'pie',
            radius: '40%',
            center: ['50%', `${42 + extraSpace}%`],  // 调整饼图的垂直中心位置
            data: this.data.PieChartData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      option && chart.setOption(option);
    })
  }

})

function extractItems(work_array_temp) {
  const itemSet = new Set();

  for (const obj of work_array_temp) {
    if (obj === undefined) continue; // 跳过 undefined 项

    for (const key in obj) {
      itemSet.add(key);
    }
  }

  return Array.from(itemSet);
}