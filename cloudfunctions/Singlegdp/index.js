// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
let value_cal_funtion = {};
const db = cloud.database();
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

async function calculateWorkValue(work, project) {
  let gdp = 0;
  let Complete_workload = "";

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
        Complete_workload = `${pipe_length_final} 米`;
        // // 将结果放入数组中
        // Complete_workload.push(pipeLengthWithUnit);

      } else if (PipeType === "管道" || PipeType === "篦子") {
        pipe_type_final = PipeProperty === "W" ? "污水管道" : "雨水合流管道";
        let pipe_diameter_temp = parseFloatSafe(PipeDiameter);
        pipe_diameter_final = pipe_diameter_temp < 600 ? 600 : pipe_diameter_temp <= 1000 ? 1000 : pipe_diameter_temp <= 1500 ? 1500 : 9999.9;
        pipe_length_final = parseFloatSafe(work.message.find(item => item.infoName === '图纸长度')?.value);
        Complete_workload = `${pipe_length_final} 米`;
        // // 将结果放入数组中
        // Complete_workload.push(pipeLengthWithUnit);
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
        Complete_workload = `${length} 米`;
        // // 将结果放入数组中
        // Complete_workload.push(pipeLengthWithUnit);
        gdp = length * price;
      }
    }
  } else if (project === "深圳市宝安排水有限公司2024年宝安区管网清疏及其他水务设施清淤服务项目") {


    const Wash_count = parseFloatSafe(work.message.find(item => item.infoName === '清疏量结果'|| item.infoName === '清疏量')?.value);
    const Wash_Type = work.message.find(item => item.infoName === '服务项目')?.value;
    const root_length = work.message.find(item => item.infoName === '清理树根长度')?.value;
    console.log("Wash_count",Wash_count,"Wash_Type",Wash_Type,"root_length",root_length)

    if (Wash_Type && (Wash_count || root_length)) {
      const Cal_func = value_cal_funtion["深圳市宝安排水有限公司2024年宝安区管网清疏及其他水务设施清淤服务项目"].find(item => item.WashType === Wash_Type)?.Price;
      if (Cal_func) {
        console.log("Cal_func",Cal_func)
        if (Wash_Type !== "管渠树根清除--管道、暗渠（涵）") {
          Complete_workload = `${Wash_count} 方`;
          // // 将结果放入数组中
          // Complete_workload.push(pipeLengthWithUnit);
          gdp = Wash_count * Cal_func;
        } else {
          Complete_workload = `${root_length} 米`;
          // // 将结果放入数组中
          // Complete_workload.push(pipeLengthWithUnit);
          gdp = root_length >= 1 ? Cal_func.first + (root_length - 1) * Cal_func.second : Cal_func.first;
          console.log("Complete_workload",Complete_workload)
          console.log("gdp",gdp)
        }
      }
    }
  } else if (project === "深圳宝排燕罗分公司满水管道检测项目") {
    const length = parseFloatSafe(work.message.find(item => item.infoName === '检测长度')?.value);
    Complete_workload = `${length} 米`;
    // // 将结果放入数组中
    // Complete_workload.push(pipeLengthWithUnit);
    gdp = length * 170;
  } else if (project === "珠海入库项目") {
    const length = parseFloatSafe(work.message.find(item => item.infoName === '检测长度')?.value);
    const price = parseFloatSafe(work.message.find(item => item.infoName === '单价（仅项目经理可见）')?.value);
    Complete_workload = `${length} 米`;
    // // 将结果放入数组中
    // Complete_workload.push(pipeLengthWithUnit);
    gdp = length * price;
  } else if (project === "福田市政、小区清疏项目") {
    const gdpItem = parseFloatSafe(work.message.find(item => item.infoName === '预估产值（仅项目经理可见）')?.value);
    const length = parseFloatSafe(work.message.find(item => item.infoName === '清疏量')?.value);
    const job_content = work.message.find(item => item.infoName === '是否为树根')?.value;
    console.log("gdpItem",gdpItem,"length",length,"job_content",job_content)
    if (job_content === "是") {
      Complete_workload = `${length} 米`;
      // // 将结果放入数组中
      // Complete_workload.push(pipeLengthWithUnit);
    } else {
      Complete_workload = `${length} 方`;
    }
    // // 将结果放入数组中
    // Complete_workload.push(pipeLengthWithUnit);
    gdp = gdpItem;
  }
  console.log("gdp",gdp)
  console.log("Complete_workload",Complete_workload)
  return { gdp, Complete_workload };
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log("event",event)

  const work = event.workInfo;
  const project = event.workInfo.Project;
  console.log("work",work)
  console.log("project",project)
  await initValuecalFuntion();
  const { gdp, Complete_workload } = await calculateWorkValue(work, project);
  return {
    gdp,
    Complete_workload
  }
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}