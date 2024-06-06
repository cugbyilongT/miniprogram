
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

    // 获取当前日期并格式化为 ISO 字符串
    const today = new Date().toISOString();
    // 添加日期范围的查询条件
    const startDate = dateRange.start ? new Date(`${dateRange.start}T00:00:00.000Z`) : null;
    const endDate = dateRange.end ? new Date(`${dateRange.end}T23:59:59.999Z`) : null;

    // 默认起始时间设定为一个较早的时间点，例如 1970 年 1 月 1 日
    const defaultStartDate = new Date('1970-01-01T00:00:00.000Z');

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
    }else{
            // 没有时间选择时，设定默认时间范围
      condition.Date = _.and([
        _.gte(defaultStartDate.toISOString()),
        _.lt(today)
      ]);
      console.log('默认日期范围查询条件:', { startDate: defaultStartDate.toISOString(), endDate: today });
    }

    // 添加下拉菜单选项的查询条件
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
    

    // 查询数据
    const res = await query.get();
    console.log("cloud1", res)
     // 过滤掉包含 deleted: true 的条目
    const filteredData = res.data.filter(entry => !entry.deleted);
    const works = filteredData;
    console.log("cloud2", works)

    // 处理清疏台账数据计算产值
    let gdp_item = [];
    if (selectedOptions.Work == "清疏台账") {
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
      
      for (let i = 0; i < works.length; i++) {
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
        const PipeWashCount = PipeWashCountObj ? PipeWashCountObj.value : 0;

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
          pipe_length_final = works[i].message.find(item => item.infoName === '明渠长度（米）').value;
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
            pipe_length_final = works[i].message.find(item => item.infoName === '管道长度（米）').value;
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

            gdp = pipe_value_final * pipe_length_final;
            break;
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
        let Date = works[i].Date;
        let Workername = works[i].Workername
        gdp_item.push({ Date, gdp ,Workername});
      }
      console.log("cloud8", gdp_item);
    }


    return gdp_item;
  } catch (err) {
    return err;
  }
}


