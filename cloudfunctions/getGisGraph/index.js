const cloud = require('wx-server-sdk');

exports.main = async (event, context) => {
  const { project, work, date } = event;
  const env = cloud.DYNAMIC_CURRENT_ENV;

  try {
    // 构造图片文件 ID
    const fileName = `gis-graphs/${project}-${work}-${date}.png`;
    const fileID = `cloud://cloudbase-baas-7gioffo8b0741b20.636c-cloudbase-baas-7gioffo8b0741b20-1256603092/${fileName}`;
    return { success: true, fileID };
  } catch (error) {
    console.error(error);
    return { success: false, message: '获取图片失败，请重试' };
  }
};