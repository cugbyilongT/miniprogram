const cloud = require('wx-server-sdk')
cloud.init({  env: cloud.DYNAMIC_CURRENT_ENV  }) // 使用当前云环境
const db = cloud.database()

exports.main = async (event, context) => {
    const { id, gdp, Complete_workload } = event;
    console.log("event", event);
    console.log("_id", id);
    console.log("gdp", gdp);
    console.log("Complete_workload", Complete_workload);

    try {
        const updateData = {};

        if (gdp != null && gdp !== 0 && Complete_workload != null && Complete_workload !== 0) {
            updateData['gdp'] = gdp;
            updateData['Complete_workload'] = Complete_workload;
        }

        const res = await db.collection('works').doc(id).update({
            data: {
                $set: updateData
            }
        });

        console.log("update work", res);
        return {
            code: 0,
            data: res
        }
    } catch (err) {
        console.error("Error updating document:", err);
        return {
            code: -1,
            error: err.message
        }
    }
}
