const cloud = require('wx-server-sdk')
const jimp = require('jimp')

// 确保正确初始化环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const getLocationAndTime = (ocrResult) => {
  let location = '';
  let time = '';

  // 拼接所有识别出的文字,去掉空格,将中文符号替换为英文符号
  const allText = ocrResult.items
    .map(item => item.text.replace(/\s+/g, '').replace(/[，,。:：]/g, match => {
      const replacements = { '，': ',', ',': ',', '。': '.', ':': ':', '：': ':' };
      return replacements[match];
    }))
    .join('');

  // 使用正则表达式匹配地点和时间
  const timeRegex = /拍摄时间:(\d{4}\.\d{2}\.\d{2})(\d{2}:\d{2})/;
  const locationRegex = /地点:(.+)$/;

  const timeMatch = allText.match(timeRegex);
  if (timeMatch && timeMatch[1] && timeMatch[2]) {
    time = `${timeMatch[1]} ${timeMatch[2]}`.trim();
  }

  const locationMatch = allText.match(locationRegex);
  if (locationMatch && locationMatch[1]) {
    location = locationMatch[1].trim();
  }

  return { location, time };
};

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log('wxContext:', wxContext);
  const fileLink = event.fileID
  const fileObj = {
    fileID: fileLink,
    maxAge: 60 * 60 * 24 * 30,
  }

  console.log("fileLink",fileLink)
  console.log("fileObj",fileObj)

  // 获取临时链接
  const result = await cloud.getTempFileURL({ fileList: [fileObj] })

  console.log("result",result)
  if (!result) {
    return { error: 'failed to get temp file URL' }
  }
  const tempFileURL = result.fileList[0].tempFileURL
  console.log(tempFileURL)


  // 读取原始图片
  const image = await jimp.read(tempFileURL)
  const imageHeight = image.getHeight()
  const imageWidth = image.getWidth()

  console.log("imageHeight",imageHeight)
  console.log("imageWidth",imageWidth)

  // 计算需要裁剪的区域坐标
  const cropHeight = imageHeight / 10
  const cropX = 0
  const cropY = imageHeight - cropHeight
  const cropWidth = imageWidth
  console.log("cropHeight",cropHeight)
  console.log("cropX",cropX)
  console.log("cropY",cropY)
  console.log("cropWidth",cropWidth)

  // 裁剪图片
  const croppedImage = image.crop(cropX, cropY, cropWidth, cropHeight)
  console.log("croppedImage",croppedImage)
  // 将裁剪后的图片上传到云存储
  const uploadResult = await cloud.uploadFile({
    cloudPath: 'croppedImage.png', // 云存储路径
    fileContent: await croppedImage.getBufferAsync(croppedImage.getMIME()),
  })
  console.log("uploadResult",uploadResult)
  // 获取裁剪后图片的临时链接
  const croppedImageFileID = uploadResult.fileID
  const croppedImageTempFileURL = (
    await cloud.getTempFileURL({
      fileList: [{ fileID: croppedImageFileID, maxAge: 60 * 60 }],
    })
  ).fileList[0].tempFileURL
  console.log("croppedImageTempFileURL",croppedImageTempFileURL)

  // 调用云 API 进行文字识别
  const ocrResult = await cloud.openapi.ocr.printedText({
    type: 'photo',
    imgUrl: croppedImageTempFileURL,
    languageType: 'ZH',
    detectOrientation: true,
  })

  console.log("ocrResult",ocrResult)

  const { location, time } = getLocationAndTime(ocrResult);
  console.log(location, time)
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    location,
    time
  }
}
