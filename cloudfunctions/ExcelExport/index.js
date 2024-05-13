const axios = require('axios');
const cloud = require('wx-server-sdk');

cloud.init({
  // 环境配置
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
        // 构造GET请求的参数
        const params = event.data;
        console.log(params);
          
        // 使用 axios 发起 GET 请求并设置响应类型为 'arraybuffer' 以接收二进制数据
        // 附加URL参数
        const response = await axios.get('https://1325508152-6z3g11h0xj-gz.scf.tencentcs.com', {
          params: params, // 将event中的数据作为GET请求的参数
          responseType: 'arraybuffer' // 确保接收到的是一个二进制流
    });

    // 将二进制数据转换为Buffer
    const buffer = Buffer.from(response.data, 'binary');

    // 上传文件到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: 'excelFiles/my-excel-file.xlsx', // 云存储路径
      fileContent: buffer, // 文件内容
    });

    // 获取并返回fileID
    const fileID = uploadResult.fileID;
    return {
      success: true,
      fileID: fileID, // 这里返回上传后的fileID
      message: 'Excel文件已成功上传'
    };
  } catch (error) {
    // 错误处理
    console.error(error);
    return {
      success: false,
      error: error.message
    };
  }
};

/*const cloud = require('wx-server-sdk');
const ExcelJS = require('exceljs');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 根据value获取对应的label
function getLabelFromOptions(message, value) {
  if (!message || !message.options || value === undefined) return '';
  const label = message.options[value];
  return label || ''; // 如果label不存在，返回空字符串
}

// 修改后的downloadImage函数，自动确定图片格式
async function downloadImage(url) {
  try {
    const response = await cloud.downloadFile({
      fileID: url,
    });
    // 假设response.fileContent是一个Buffer类型
    const buffer = response.fileContent;

    // 这里的逻辑是根据文件的buffer内容来确定文件类型，比如使用image-type库
    // 如果你不能使用外部库，你可能需要其他方式来确定文件类型
    const  { default: imageType } = await import('image-type');
    const type = imageType(buffer);

    if (!type) {
      throw new Error('Unable to determine the image type');
    }

    return {
      buffer,
      extension: type.ext, // 使用从文件内容推断出的扩展名
    };
  } catch (e) {
    console.error('Failed to download image:', e);
    return null;
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const dataList = event.data; // 假设 dataList 是包含所有数据的数组

  // 创建一个新的工作簿
  const workbook = new ExcelJS.Workbook();
  // 添加一个名为 "Sheet1" 的工作表
  const sheet = workbook.addWorksheet('Sheet1');

  // 设置表头
  sheet.columns = [
    { header: '项目名称', key: 'project' },
    { header: '日期', key: 'date' },
    { header: '路段', key: 'section' },
    { header: '任务', key: 'task' },
    { header: '工作内容', key: 'work' },
    { header: '起始井号编号', key: 'wellNumber1' },
    { header: '终点井号编号', key: 'wellNumber2' },
    { header: '井类型选项', key: 'wellType' },
    { header: '异常情况选项', key: 'abnormalCondition' },
    { header: '井口照片', key: 'photo' }
  ];

    // 设置单元格样式，使文本居中
    sheet.columns.forEach(column => {
      column.alignment = { vertical: 'middle', horizontal: 'center' };
    });

  // 遍历数据并添加到工作表
  for (const item of dataList) {
    const rowValues = {
      project: item.Project || '',
      date: item.DateMouthDay || '',
      section: item.Section || '',
      task: item.Task || '',
      work: item.Work || '',
      wellNumber1: item.message[0]?.value || '',
      wellNumber2: item.message[1]?.value || '',
      wellType: getLabelFromOptions(item.message[2], item.message[2]?.value),
      abnormalCondition: item.message[3]?.value.filter(v => v != null).join(', ') || '',
      photo: '' // 先设为空，稍后插入图片
    };

    const newRow = sheet.addRow(rowValues);

    newRow.height = 20;

    // 遍历所有单元格，设置水平和垂直居中
    newRow.eachCell({ includeEmpty: true }, function(cell, colNumber) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // 自动调整列宽以适应内容
    sheet.columns.forEach(column => {
      let maxColumnLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        let cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxColumnLength) {
          maxColumnLength = cellLength;
        }
      });
      column.width = maxColumnLength < 12 ? 12 : maxColumnLength + 2; // 确保列宽至少为12，并为内容留出空间
    });
    
    // 处理图片
    const photos = item.message[4]?.value;
    if (photos && photos.length > 0) {
      let imageColNum = sheet.columns.length + 1; // 获取图片应插入的列数
      for (const [index, photo] of photos.entries()) {
        if (photo.url) {
          const downloadResult = await downloadImage(photo.url);
          if (downloadResult && downloadResult.buffer) {
            const imageId = workbook.addImage({
              buffer: downloadResult.buffer,
              extension: downloadResult.extension,
            });

            // 图片插入的位置需要根据实际情况进行调整
            sheet.addImage(imageId, {
              tl: { col: imageColNum, row: newRow.number },
              ext: { width: 100, height: 100 } // 根据需要设置图片大小
            });
            imageColNum++;
          }
        }
      }
    }
  }


  try {
    // 写入文件到buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 将文件存储到云存储中
    const fileID = await cloud.uploadFile({
      cloudPath: 'excel/report.xlsx',
      fileContent: buffer,
    });

    return {
      success: true,
      fileID: fileID.fileID, // 返回文件 ID
    };
  } catch (e) {
    return {
      success: false,
      errorMessage: e.message,
    };
  }
};*/


