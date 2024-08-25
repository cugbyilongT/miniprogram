// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前环境
})

const db = cloud.database()


// 云函数入口函数
exports.main = async (event, context) => {
  const { id, wellNumber } = event;
  console.log("Received event:", event);
  console.log("Well number:", wellNumber);
  console.log("Document ID:", id);

  try {
    // 构造要添加的对象
    const newWellNumberObject = {
      Wellnumber: wellNumber
    };
    console.log("New well number object:", newWellNumberObject);
    const result = await db.collection('WellNumber').doc(id).update({
      // 使用数据库命令对象 db.command 来操作数组
      data: {
        dalong: db.command.push(newWellNumberObject)
      }
    });

    return {
      success: true,
      data: result,
      message: 'Record updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      errorMessage: error.message
    };
  }
}


// 云函数入口函数
// exports.main = async (event, context) => {
//   const { wellNumber } = event
//   const id = event.id
//   console.log("addwellNumber1111",event)
//   console.log("addwellNumber1111",wellNumber)
//   console.log("addwellNumber1111",id)
//   try {
//     const addResult = await db.collection('wellNumber').add({
//       data: {
//         wellNumber: wellNumber
//       }
//     })
//     return {
//       success: true,
//       id: addResult._id // 返回新增记录的ID
//     }
//   } catch (e) {
//     return {
//       success: false,
//       error: e
//     }
//   }
// }