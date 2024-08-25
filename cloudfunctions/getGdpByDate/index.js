const cloud = require('wx-server-sdk');
function parseFloatSafe(value) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
//传入参数 selectedOptions: { Work: [ '大龙街2024年排水管网清、查项目' ], Project: [ '大龙街2024年排水管网清、查项目-----测试用' ] ...}, dateRange: { start: '2021-01-01', end: '2021-12-31' }
exports.main = async (event, context) => {
  try {
    const { selectedOptions, dateRange } = event;
    // 添加seletedOptions.Work为空时的默认值

    console.log("cloud0", selectedOptions.Work.length);
    if (selectedOptions.Work.length === 0) {
      try {
        const res = await db.collection('projects').where({
          "name": _.in(selectedOptions.Project)
        }).get();

        let KeyWork = [];
        for (let i = 0; i < res.data.length; i++) {
          const project = res.data[i];
          if (project.work_message) {
            for (let key in project.work_message) {
              if (project.work_message[key].keyWork === true) {
                KeyWork.push(key);
              }
            }
          }
        }
        selectedOptions.Work = KeyWork;
        console.log("cloud1", selectedOptions.Work);
      } catch (err) {
        console.error('获取关键作业失败', err);
      }
    }
    console.log('查询参数:', { selectedOptions, dateRange });
    let query = db.collection('works');

    // 辅助函数：格式化日期为 ISO 字符串，考虑时区
    function formatDateToISO(dateString, isEndOfDay = false) {
      if (!dateString) return null;
      const [year, month, day] = dateString.split('-');
      const date = new Date(Date.UTC(year, month - 1, day));
      if (isEndOfDay) {
        date.setUTCHours(23, 59, 59, 999);
      }
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
    if (Object.keys(condition).length > 0) {
      query = query.where(condition);
      console.log('最终查询条件:', query);
      console.log('最终查询条件:', JSON.stringify(condition, null, 2));
    }

    const countResult = await db.collection('works').count({ "_id": 1 });
    const total = countResult.total;
    console.log('总条数:', total);

    let all = [];
    const MAX_LIMIT = 100;
    for (let i = 0; i < total; i += MAX_LIMIT) {
      const list = await db.collection('works').skip(i).where(condition).field({
        Date: true,
        Workername: true,
        message: true,
        deleted: true,
        Work:true
      }).limit(MAX_LIMIT).get();
      all = all.concat(list.data);
    }
    // 过滤掉包含 deleted: true 的条目
    const works = all.reduce((acc, entry) => {
      if (!entry.deleted && entry.message && entry.message.length > 0) {
        const filteredMessage = entry.message.filter(msg => msg.keyMessage === true);
        acc.push({
          Date: entry.Date,
          Workername: entry.Workername,
          message: filteredMessage.length > 0 ? filteredMessage : entry.message,
          Work:entry.Work
        });
      }
      return acc;
    }, []);

    console.log("cloud2", works);
    // 查询数据

    // 处理清疏台账数据计算产值
    let gdp_item = [];
    const KeyWork = selectedOptions.Work;
    const Project = selectedOptions.Project;
    if (Project == "大龙街2024年排水管网清、查项目" || Project == "大龙街2024年排水管网清、查项目-----测试用") {
      let value_cal_funtion = ''
      let value_cal_funtion_res = await db.collection('value_cal_funtion')
        .where({
          "Type": "清疏台账"
        }).get()
        .then(res => {
          value_cal_funtion = res.data;
          console.log("cloud9", value_cal_funtion);
        })
        .catch(err => {
          console.error('获取数据失败', err);
        });


      // 其他操作
      console.log(works);
      for (let i = 0; i < works.length; i++) {
        if (works[i].Work === "清疏台账") {

          let gdp = 0;
          const PipeTypelObj = works[i].message.find(item => item.infoName === '清疏对象');
          const PipeType = PipeTypelObj ? PipeTypelObj.value : '0';

          const PipePropertyObj = works[i].message.find(item => item.infoName === '管道性质');
          const PipeProperty = PipePropertyObj ? PipePropertyObj.value : '0';

          const PipeDiameterObj = works[i].message.find(item => item.infoName === '管径/尺寸');
          const PipeDiameter = PipeDiameterObj ? PipeDiameterObj.value : '0';

          const PipeWashTypeObj = works[i].message.find(item => item.infoName === '（内业）清疏类型');
          const PipeWashType = PipeWashTypeObj ? PipeWashTypeObj.value : -1;

          const PipeWashCountObj = works[i].message.find(item => item.infoName === '（内业）第几次清疏');
          let PipeWashCount = PipeWashCountObj ? PipeWashCountObj.value : 0;
          if (PipeWashCount === "") {
            PipeWashCount = 0;
          }
          if (typeof PipeWashCount === Array) {
            PipeWashCount = PipeWashCount[0].toString();
          }

          console.log("cloud6", {
            PipeTypelObj,
            PipeType,
            PipePropertyObj,
            PipeProperty,
            PipeDiameterObj,
            PipeDiameter,
            PipeWashTypeObj,
            PipeWashType,
            PipeWashCountObj,
            PipeWashCount
          });
          let pipe_wash_count_final = PipeWashCount;
          let pipe_type_final = ''
          let pipe_wash_type_final = ''
          let pipe_length_final = ''
          let pipe_diameter_final = ''
          let pipe_value_final = 0
          pipe_wash_type_final = PipeWashType;

          if (PipeType === "明渠")// 渠箱
          {
            pipe_type_final = "渠箱"
            //用x、*、X分割PipeDiameter

            let pipe_diameter_temp = PipeDiameter.split(/[x*X]/);

            // 将字符串转换为数字
            let diameter1 = parseFloat(pipe_diameter_temp[0]);
            let diameter2 = parseFloat(pipe_diameter_temp[1]);

            // 计算乘积 得出管径
            let product = diameter1 * diameter2 / 1000000;
            let pipe_diameter_final = product.toFixed(2);
            if (pipe_diameter_final < 0.283) {
              pipe_diameter_final = 0.283
            } else if (pipe_diameter_final <= 0.785) {
              pipe_diameter_final = 0.785
            } else if (pipe_diameter_final <= 1.766) {
              pipe_diameter_final = 1.766
            } else {
              pipe_diameter_final = 9999.9
            }
            // 统计长度
            pipe_length_final = works[i].message.find(item => item.infoName === '图纸长度').value;
            if (pipe_length_final === '/') {
              pipe_length_final = 0
            }
          } else
            if (PipeType === "管道" || PipeType === "篦子")// 管道或篦子
            {
              if (PipeProperty === "W")//污水管
              {
                pipe_type_final = "污水管道"
              } else if (PipeProperty === "Y" || PipeProperty === "H")//雨水合流管
              {
                pipe_type_final = "雨水合流管道"
              }
              // 管径
              let pipe_diameter_temp = parseFloat(PipeDiameter);
              if (pipe_diameter_temp < 600) {
                pipe_diameter_final = 600
              } else if (pipe_diameter_temp <= 1000) {
                pipe_diameter_final = 1000
              } else if (pipe_diameter_temp <= 1500) {
                pipe_diameter_final = 1500
              } else {
                pipe_diameter_final = 9999.9
              }
              //管长
              if (works[i].message.find(item => item.infoName === '图纸长度')) {
                pipe_length_final = works[i].message.find(item => item.infoName === '图纸长度').value;
              } else {
                pipe_length_final = 0;
              }
              if (pipe_length_final === '/') {
                pipe_length_final = 0
              }
            }

          console.log("cloud7", {
            pipe_type_final,
            pipe_wash_type_final,
            pipe_diameter_final,
            pipe_length_final,
            pipe_value_final,
            pipe_wash_count_final
          });
          // 计算产值

          for (let j = 0; j < value_cal_funtion.length; j++) {
            if (value_cal_funtion[j].PipeType === pipe_type_final && value_cal_funtion[j].WashType === pipe_wash_type_final && value_cal_funtion[j].PipeDimension === pipe_diameter_final) {
              console.log("cloud5", value_cal_funtion[j]);
              if (pipe_wash_count_final === "1")
                pipe_value_final = value_cal_funtion[j].Price.first


              else if (pipe_wash_count_final === "2")
                pipe_value_final = value_cal_funtion[j].Price.second;
              else if (pipe_wash_count_final === "3")
                pipe_value_final = value_cal_funtion[j].Price.third;
              else if (pipe_wash_count_final === "4")
                pipe_value_final = value_cal_funtion[j].Price.fourth;
              else
                pipe_value_final = 0;
              //深度清疏 CCTV价格加12850
              if (pipe_wash_type_final === "深度清疏" && pipe_value_final > 0) {
                pipe_value_final = pipe_value_final + 12850;
              }
              gdp = pipe_value_final * pipe_length_final;
              break;
            }
          }

          let Date = works[i].Date;
          let Workername = works[i].Workername
          gdp = gdp / 1000;

          console.log("cloud7", {
            pipe_type_final,
            pipe_wash_type_final,
            pipe_diameter_final,
            pipe_length_final,
            gdp,
            pipe_wash_count_final
          });
          gdp_item.push({ Date, gdp, Workername });
        } else {
          let gdp = 0;
          const { Date, Workername, message } = works[i];
          const lengthItem = message.find(item => item.infoName === '作业长度');
          const priceItem = 4;
          if (lengthItem?.value) {

            const length = parseFloatSafe(lengthItem.value);
            const price = parseFloatSafe(priceItem);
            gdp = length * price;
          }
          gdp_item.push({ Date, gdp, Workername });

        }
      }
      console.log("cloud8", gdp_item);
    } else if (Project == "深圳市宝安排水有限公司2024年宝安区管网清疏及其他水务设施清淤服务项目")//宝安清疏项目产值计算
    {
      let value_cal_funtion = ''
      let value_cal_funtion_res = await db.collection('value_cal_funtion')
        .where({
          "Project_name": "深圳市宝安排水有限公司2024年宝安区管网清疏及其他水务设施清淤服务项目"
        }).get()
        .then(res => {
          value_cal_funtion = res.data;
          console.log("cloud9", value_cal_funtion);
        })
        .catch(err => {
          console.error('获取数据失败', err);
        });
      for (let i = 0; i < works.length; i++) {
        Wash_count = works[i].message.find(item => item.infoName === '清疏量结果').value;
        Wash_Type = works[i].message.find(item => item.infoName === '服务项目').value;
        root_length = works[i].message.find(item => item.infoName === '清理树根长度').value;
        if (Wash_Type && Wash_count) {
          console.log("cloud6", {
            Wash_count,
            Wash_Type
          });
          Cal_func = value_cal_funtion.find(item => item.WashType === Wash_Type).Price;
          console.log(Cal_func)
          let pipe_value_final = 0
          if (Wash_Type != "管渠树根清除--管道、暗渠（涵）") {
            pipe_value_final = Wash_count * Cal_func;
            console.log(pipe_value_final)
          } else {
            Price1 = Cal_func.first;
            Price2 = Cal_func.second;
            if (root_length >= 1) {
              pipe_value_final = Price1 + (root_length - 1) * Price2;
            } else {
              pipe_value_final = Price1;
            }

          }
          console.log("cloud7", pipe_value_final)
          let Date = works[i].Date;
          let Workername = works[i].Workername
          gdp = pipe_value_final;
          gdp_item.push({ Date, gdp, Workername });
          console.log("cloud7", {
            Wash_count,
            Wash_Type,
            pipe_value_final
          });
        }


      }

    } else if (Project == "深圳宝排燕罗分公司满水管道检测项目") {

      for (let i = 0; i < works.length; i++) {
        const { Date, Workername, message } = works[i];

        const lengthItem = message.find(item => item.infoName === '检测长度');
        const length = parseFloatSafe(lengthItem?.value);

        let gdp = 0;
        if (length !== 0) {
          gdp = length * 170;
        }
        console.log("cloud7", {
          Date,
          Workername,
          length,
          gdp
        });
        gdp_item.push({ Date, gdp, Workername });
      }
      console.log(gdp_item);
    } else if (Project == "珠海入库项目") {

      for (const work of works) {
        const { Date, Workername, message } = work;

        const lengthItem = message.find(item => item.infoName === '检测长度');
        const priceItem = message.find(item => item.infoName === '单价（仅项目经理可见）');

        let gdp = 0;
        if (lengthItem?.value && priceItem?.value) {
          const length = parseFloatSafe(lengthItem.value);
          const price = parseFloatSafe(priceItem.value);
          gdp = length * price;
        }

        gdp_item.push({ Date, gdp, Workername });
      }
      console.log(gdp_item);
    }else if (Project == "福田市政、小区清疏项目")
    {
      for (const work of works) {
        const { Date, Workername, message } = work;
        
        const gdpItem = message.find(item => item.infoName === '预估产值（仅项目经理可见）');
        console.log(gdpItem);
        let gdp = parseFloatSafe(gdpItem.value);

        gdp_item.push({ Date, gdp, Workername });
      }
      console.log(gdp_item);
    }


    return gdp_item;
  } catch (err) {
    return err;
  }
}


