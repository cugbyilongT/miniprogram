// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

//公司产值分析
function Company_all_value_analysis(gdpData) {
  let totalValue = 0;

  for (let i = 0; i < gdpData.length; i++) {
    totalValue += gdpData[i].gdp;
    console.log("totalValue", totalValue);
  }

  const totalValueInBillions = parseFloat((totalValue / 100000000).toFixed(2));
  console.log("totalValueInBillions", totalValueInBillions);
  return totalValueInBillions;
}

// 公司产值分析
function Company_value_analysis(gdpData) {
  let dateSums = {};

  // 遍历gdpData，将相同日期的GDP值累加
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

  // 提取合并后的数据值（假设只有一天的数据）
  const dates = Object.keys(dateSums);
  if (dates.length > 0) {
    const totalValue = dateSums[dates[0]];
    return parseFloat((totalValue / 10000000).toFixed(2));
  }

  // 如果没有数据，返回null
  return 0;
}


function getNowDate() {
  let daydateRange = {
    start: "",
    end: "",
  };

  // 获取当前日期对象
  const today = new Date();

  // 格式化日期为 YYYY-MM-DD
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要加1，并确保两位数格式
  const day = String(today.getDate()).padStart(2, '0'); // 确保两位数格式

  const formattedDate = `${year}-${month}-${day}`;

  // 设置 daydateRange 的 start 和 end 为今天的日期
  daydateRange.start = formattedDate;
  daydateRange.end = formattedDate;

  console.log(daydateRange);
  return daydateRange;
}

//获取works云函数
async function getCloudGetGdpByDateData(event) {
  // 从event中获取查询参数
  selectedOptions = event.selectedOptions;
  dateRange = event.dateRange;
  console.log("selectedOptions", selectedOptions)
  console.log("dateRange", dateRange)
  let result = await cloud.callFunction({
    name: 'getGdpByDate',
    data: {
      selectedOptions: selectedOptions,
      dateRange: dateRange
    },
  });
  let queryResults = result.result;
  console.log("result", queryResults)
  return queryResults;
}


//获取works云函数
async function getprojectdata() {
  const db = cloud.database()
  const projectsCollection = db.collection('projects')

  try {
    const res = await projectsCollection.get()
    return {
      code: 0,
      data: res.data
    }
  } catch (err) {
    return {
      code: -1,
      error: err.message
    }
  }
}

async function groupProjectsByTown() {
  try {
    let projects = await getprojectdata(); // 异步获取项目数据
    if (!projects || !projects.data) {
      console.error("No project data available");
      return {};
    }

    let projectsByTown = {};

    // 遍历所有项目，并按town字段进行分组
    projects.data.forEach(project => {
      const townName = project.town;
      if (!projectsByTown[townName]) {
        projectsByTown[townName] = []; // 如果还没有这个town的键，创建一个空数组
      }
      // 将项目名称作为对象添加到对应的town数组中
      projectsByTown[townName].push({ projectName: project.name });
    });

    return projectsByTown; // 返回一个对象，键是town名，值是包含项目名称对象的数组
  } catch (error) {
    console.error("Failed to load or process project data:", error);
    return {}; // 在出错时返回空对象
  }
}



// 云函数入口函数
exports.main = async (event, context) => {
  // 设置 CORS 头部
  const headers = {
    'Access-Control-Allow-Origin': '*', // 允许所有域名访问，或者指定域名如 https://example.com
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // 允许的方法
    'Access-Control-Allow-Headers': 'Content-Type', // 允许的请求头
    'Access-Control-Max-Age': '86400', // 预检请求的缓存时间(秒)
    'Content-Type': 'application/json'  // 确保返回的是 JSON 格式
  };
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
      let projectsByTown = await groupProjectsByTown();
      console.log("projectsByTown", projectsByTown);
      // 遍历每个镇
      for (let town in projectsByTown) {
        let townProjects = projectsByTown[town];
        console.log("townProjects", townProjects);
        console.log("townProjects.length", townProjects.length);
        // 为每个项目增加一个分析结果属性
        for (let i = 0; i < townProjects.length; i++) {
          let project = townProjects[i];
          console.log("townProjects[i]", townProjects[i]);
          let projectName = project.projectName;
          console.log("projectName", projectName);
          let selectedOptions = {
            Project: [projectName],
            Section: [],
            Task: [],
            Work: ["清疏台账"],
          };
          let dateRange = { start: "", end: "" };
          let dayDateRange = getNowDate();  // 假设 getNowDate() 返回当前日期范围
          let selectData = { selectedOptions, dateRange };
          let daySelectData = { selectedOptions, dateRange: dayDateRange };

          // 为项目获取数据
          let gdpResult = await getCloudGetGdpByDateData(selectData);
          let all = Company_all_value_analysis(gdpResult);  // 分析总体数据
          let dayGdpResult = await getCloudGetGdpByDateData(daySelectData);
          let dayValue = Company_value_analysis(dayGdpResult);  // 分析当日数据

          // 更新项目信息，添加分析结果
          projectsByTown[town][i] = {
            ...project,
            allAnalysis: all,
            dayAnalysis: dayValue
          };
        }
      }
      console.log("最终结果:", projectsByTown);
      // 检查项目数据并返回
      if (Object.keys(projectsByTown).length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: '该地区暂无项目数据' })
        };
      }
      return {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify(projectsByTown)
      }
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: err.message })
    };
  }

}