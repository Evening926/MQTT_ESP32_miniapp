import { get_records } from "../../api/index"

// pages/record_crud/record_crud.js
Page({

    data: {
        title:"ESP32应用小程序",
        revealList:["列表"],
        revealTypeIndex:"0",//0为连接列表  图标尚未开发

        timeValue:"2025-12-8",//获取当天时间的工具，此处省略
        sensorNameList:["温度","湿度","光照","方位"],
        sensorEnList:["TEPERATURE","HUMIDITY","LIGHT_INTENDITY","LOCATION_DEG"],
        sensorNameIndex:"0",
        sensorInfoList:[],
    },

  
    onLoad(options) {

    },

    // selectData(){
    //     get_records("TEPERATURE",timeValue).then(
    //         (response)=>{
    //             sensorInfoList:response.data.data
    //         }
    //     )
    // }
    // 页面中的 selectData 方法
selectData() {
    // 1. 先获取页面 data 中的 timeValue（注意作用域）
    const { timeValue } = this.data;
    
    // 2. 调用接口（修正拼写错误：TEPERATURE → TEMPERATURE）
    get_records("TEMPERATURE", timeValue)
      .then((respond) => {
        // 3. 必须用 this.setData 更新页面数据，才能渲染到wxml
        this.setData({
          sensorInfoList: respond.data.data // 把后端返回的数据赋值给sensorInfoList
        });
        console.log("查询成功，数据：", respond.data.data);
      })
      .catch((err) => {
        // 4. 新增错误捕获，排查问题
        console.error("查询失败：", err);
        wx.showToast({
          title: '查询失败',
          icon: 'none'
        });
      });
  }
})