//api/index.js
const BASE_URL = "http://localhost:3000/api";
const app = getApp();

//查询
export function get_records(sensor_name, create_time) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${BASE_URL}/get_records`,
            data:{
                sensor_name,
                create_time: `${create_time}`,
            },
            success(respond){
                resolve(respond);
            },
            fail(e){
                reject(e);
            },
        });
    });
}
   
  //新增
  export function add_record(sensor_name, sensor_value) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${BASE_URL}/add_record`,
            method: "POST",
            data:{
                sensor_name, 
                sensor_value,
            },
            success(respond){
            },
            fail(e){
            },
        });
    });
}
  //删除
  export function del_record(id) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${BASE_URL}/del_record`,
            data:{
                id,
            },
            success(respond){
                wx.showToast({
                  title: '删除成功',
                  icon:"none"
                });
                resolve();
            },
            fail(e){
                wx.showToast({
                    title: '删除失败',
                    icon:"none"
                  });
                reject(e);
            },
        });
    });
}
  //修改
  export function update_record(id, sensor_value) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${BASE_URL}/update_record`,
            data:{
                id,
                sensor_value,
            },
            success(respond){
                resolve();
            },
            fail(e){
            },
        });
    });
}

  