// index.js
import { add_record } from "../../api/index"
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
import mqtt from "../../utils/mqtt.min"; 
const MQTTADDRESS = "";//mqtt服务器地址
let client = null;//mqtt服务器
const KEY = '60d89086807d5959cc69ab858bb95876';

Page({
    data:{
        title:"ESP32应用小程序",
        weather:"正在连接中......",
        location:"",
        temperature:"",
        isConnect:false, //是否连接
        isPush:false,//是否订阅
        isSubscr:false,//是否添加
        mqttConnectDialog:false,//mqtt打开连接弹窗
        sensorList:[
            {
                img: "/images/temp.jpg",
                name: "DHT22",
                parameter:"温度",
                value:0,
                unit:"℃",
                idx:0,
            },
            {
                img:"/images/wet.webp",
                name: "DHT22",
                parameter:"湿度",
                value:0,
                unit:"%rh",
                idx:1,
            },
            {
                img:"/images/sun.webp",
                name: "TEMT6000",
                parameter:"光照",
                value:0,
                unit:"lx",
                idx:2,
            },
            {
                img:"/images/compass.jpg",
                name: "MPU6050",
                parameter:"方位",
                value:0,
                unit:"°",
                idx:3,
            }
        ],
        othersensorlist:[
            {img: "/images/light.webp",name:"照明",isopen:false},
            {img:"/images/fun.png",name:"风扇",isopen:false},
            {img:"/images/curtain.webp",name:"窗帘",schedule:0,isopen:false},
        ],
        
        /*连接输入框 */
        address:wx.getStorageSync('address')||'',
        port:wx.getStorageSync('port')||'',
        username:wx.getStorageSync('username')||'',
        password:wx.getStorageSync('password')||'',
        push:wx.getStorageSync('push')||'',//订阅地址
        subscr:wx.getStorageSync('subscr')||'',//发布地址
        thresholdDialog : false,//弹窗状态
        top:'',
        bottom:'',
        clickindex:0,
    },
    onLoad() {
        this.getUserLocation();
        if(
        wx.getStorageSync('address'),
        wx.getStorageSync('port'),
        wx.getStorageSync('username'),
        wx.getStorageSync('password')
        )
        {
            this.connectMqtt()
        }
    },
    onUnload() {
        this.disconnectMqtt();
    },
    //打开连接弹窗
    openDialog(){
        this.setData({mqttConnectDialog:true});
    },
    onClose(){
        this.setData({mqttConnectDialog:false});
    },
    getUserLocation:function (){
        let that = this;
        wx.getSetting({
            success:(res)=>{
                console.log(res,JSON.stringify(res));
                //res.authSetting['scope.userLocation']==undefined 表示初始化进入该页面
                //res.authSetting['scope.userLocation']==false 表示非初始化进入该页面，且未授权
                //res.authSetting['scope.userLocation']==表示地理位置授权
                if(
                    res.authSetting["scope.userLocation"] !=undefined&&
                    res.authSetting["scope.userLocation"] !=true
                ){
                    wx.showModal({
                        title:"请求授权当前地理位置",
                        content:"需要获取您的地理位置，请确认授权",
                        success:function(res){
                            if(res.cancel){
                                wx.showToast({
                                    title:"拒绝授权",
                                    icon:"none",
                                    duration:1000,
                                });
                            }else if(res.confirm){
                                wx.openSetting({
                                    success: function (dataAu){
                                        if(dataAu.authSetting["scope.userLocation"]==true){
                                            wx.showToast({
                                                title:"授权成功",
                                                icon:"success",
                                                duration:1000,
                                            });
                                            //再次授权，调用wx.getLocation的API
                                            that.getLocation();
                                        }else{
                                            wx.showToast({
                                              title: "授权失败",
                                              icon:"none",
                                              duration:1000,
                                            });
                                        }
                                    },
                                });
                            }
                        },
                    });
                }else if (res.authSetting["scope.userLocation"]==
                undefined){
                    //调用wx.getLocation的API
                    that.getLocation();
                }else{
                    //res.authSetting['scope.userLocation']==true
                    //调用wx.getLocation的API
                    that.getLocation();
                }
            },
        });
    },
    getLocation:function (){
        let that = this;
        wx.getLocation({
            type:"wgs84",
            success:(res)=>{
                console.log("经纬度",res);
               
                if(res?.errMsg=="getLocation:ok"){
                    //通过经纬度获取地区编码
                    wx.request({
                        url:"https://restapi.amap.com/v3/geocode/regeo?parameters",
                        data:{
                            key: KEY,
                            location: res.longitude + "," + res.latitude,//传入经纬度
                        },
                        header:{
                            "content-type": "application/json",
                        },
                        success:function(res){
                            console.log("坐标转换与查询天气",res.data);
                            wx.setStorageSync('city', res.data.regeocode.addressComponent.adcode   //地区编码
                            );
                            that.setData({
                                location:
                                res.data.regeocode.addressComponent.city + " " +
                                res.data.regeocode.addressComponent.district,
                            });

                            wx.request({
                                url:"https://restapi.amap.com/v3/weather/weatherInfo",
                                data:{
                                    key: KEY,
                                    city:res.data.regeocode.addressComponent.adcode//传入地区编码
                                },
                                header:{
                                    "content-type": "application/json",
                                },
                                success:function(weather){
                                    console.log("天气",weather.data);
                                    that.setData({
                                       temperature: weather.data.lives[0].temperature+"°C",
                                       weathertext: weather.data.lives[0].weather,
                                       weather: "欢迎欢迎！今天的天气是"+weather.data.lives[0].weather,
                                });
                        },
                    });
                  },
                });
            }
            },
             // 看定位失败的具体原因
    fail: (err) => {
        wx.hideLoading();
        console.error("wx.getLocation失败原因：", err); 
        // 给用户提示具体错误
        if (err.errMsg.includes("system permission denied")) {
          wx.showToast({ title: "系统拒绝定位权限", icon: "none" });
        } else if (err.errMsg.includes("auth deny")) {
          wx.showToast({ title: "微信拒绝定位权限", icon: "none" });
        } else if (err.errMsg.includes("network")) {
          wx.showToast({ title: "网络异常，定位失败", icon: "none" });
        } else if (err.errMsg.includes("fail")) {
          wx.showToast({ title: `定位失败：${err.errMsg}`, icon: "none" });
        }
  }
        });
    },

    //mqtt的连接
    connectMqtt()
    {
        if (client) {
            this.disconnectMqtt();
        };
        let that = this;
        const options = {
            connectTimeout:4000,
            address: this.data.address,
            port: this.data.port,
            username: this.data.username,
            password: this.data.password,
        };
        console.log("address是：","wxs://"+options.address+":"+options.port+"/mqtt");
        client = mqtt.connect("wxs://"+options.address+":"+options.port+"/mqtt",options);
        client.on("connect",(e)=>{
            console.log('连接成功');
            that.setData({isConnect:true});
            wx.setStorageSync('address', options.address);
            wx.setStorageSync('port', options.port);
            wx.setStorageSync('username', options.username);
            wx.setStorageSync('password', options.password);
            if(wx.getStorageSync('push'))
            {
                this.addpush()
            }
            if(wx.getStorageSync('subscr'))
            {
                this.subscr()
            }
        });
       
        client.on("message",(topic,message)=>{
        // //     //温度 TEPERATURE 湿度HUMIDITY 光照LIGHT_INTENDITY 方位LOCATION_DEG
            console.log("收到消息：",message.toString());
        // //     //wx.showToast({
        // //         //icon:"none";
        // //         //title:message.toString()
        // //     //});
            let getMessageObj = {};//收到的消息
            getMessageObj=JSON.parse(message);//收到的消息转换成为json对象
            console.log(getMessageObj);
            if(getMessageObj.hasOwnProperty("TEMPERATURE"))
            this.setData({
                "sensorList[0].value":Number(getMessageObj.TEMPERATURE)
            });
            add_record("TEMPERATURE",Number(getMessageObj.TEMPERATURE));

            if(getMessageObj.hasOwnProperty("HUMIDITY"))
            this.setData({
                "sensorList[1].value":Number(getMessageObj.HUMIDITY)
            });
            add_record("HUMIDITY",Number(getMessageObj.HUMIDITY));

            if(getMessageObj.hasOwnProperty("LIGHT_INTENDITY"))
            this.setData({
                "sensorList[2].value":Number(getMessageObj.LIGHT_INTENDITY)
            });
            add_record("LIGHT_INTENDITY",Number(getMessageObj.LIGHT_INTENDITY));

            if(getMessageObj.hasOwnProperty("LOCATION_DEG"))
            this.setData({
                "sensorList[3].value":Number(getMessageObj.LOCATION_DEG)
            });
            add_record("LOCATION_DEG",Number(getMessageObj.LOCATION_DEG));
        });

        client.on("reconnect",(error)=> {
            console.log("正在重连：", error);
            wx.showToast({
                icon: "none",
                title: "正在重连",
            });
        });
        client.on("error",(error)=> {
            console.log("连接失败：", error);
            wx.showToast({
                icon: "none",
                title: "mqtt连接失败",
            });
        });
    },
    disconnectMqtt() {
        client.end();
        this.setData({isConnect:false,isPush:false,isSubscr:false});
        if(!this.data.isConnect){
            console.log("Mqtt已断开");
            wx.showToast({
              icon:"none",
              title: '已断开',
            })
            }
    },
    //添加订阅
    addpush(){
        let that = this;
        const options = {
           push:  this.data.push
        };
        if(!this.data.isConnect){
            wx.showToast({
                icon:"none",
                title: '请先连接',
              });
              return
        }
        client.subscribe(this.data.push,{qos:0},function(err){
            if(!err){
                console.log("订阅成功");
                wx.showToast({
                  icon:"none",
                  title: '订阅成功',
                });
                wx.setStorageSync('push',options.push);
                that.setData({isPush:true});
            }
        });
    },
    //取消订阅
    undopush(){
        let that = this;
        client.unsubscribe(this.data.push,function(err){
            if(!err){
                console.log("取消成功");
                wx.showToast({
                  icon:"none",
                  title: '取消成功',
                });
                that.setData({isPush:false});
            }
        });
    },
    //发布消息
    subscr(){
        let that = this;
        if(!this.data.isConnect){
            wx.showToast({
                icon:"none",
                title: '请先连接',
              });
              return
        }
        const options = {
            subscr: this.data.subscr
         };
        client.subscribe(this.data.subscr,{qos:0},function(err){
        if(!err){
            console.log("添加成功");
            wx.setStorageSync('subscr',options.subscr);
            wx.showToast({
                icon:"none",
                title: '添加成功',
              });
            that.setData({isSubscr:true});
            // console.log("发出的",msg);
            // client.publish(this.data.subscr,JOSN.stringify(msg));//转化称为josn格式
        }
        });
    },
    systemChange(e){
        let ClickData = e.target.dataset.param;
        let value = e.detail.value;
        // console.log(e);
        let msg
        const options = {
            subscr: this.data.subscr
         };
        console.log(ClickData);
        if(ClickData.name=='照明')
        {
            if(!value)
            {
                msg={LIGHT: "OFF"}
            }else{
                msg={LIGHT: "ON"}
            }
        }
        if(ClickData.name=='风扇')
        {
            if(!value)
            {
                msg={FAN: "OFF"}
            }else{
                msg={FAN: "ON"}
            }
        }
        if(ClickData.name=='窗帘')
        {
            if(!value)
            {
                msg={CURTAIN: "OFF"}
            }else{
                msg={CURTAIN: "ON"}
            }
        }
        client.subscribe(options.subscr,{qos:0},function(err){
            if(!err){
                console.log("发出的",msg);
                client.publish(options.subscr,JSON.stringify(msg));//转化称为josn格式
            }
            });
    },
    //点击传感器设置阈值
    ClickSystem(e){
        let data = e.currentTarget.dataset.param;
        let index = data.idx;
        let that = this;
        console.log(e);
        that.setData({thresholdDialog:true,clickindex : index, top:'',
        bottom:''});
    },
    //弹窗确定按钮
    thresholdDialogClose(){
        let [index,top,bottom] = [this.data.clickindex,Number(this.data.top),Number(this.data.bottom)]
        console.log(index,top,bottom);
        this.setData({
            ["sensorList["+index+"].top"]:top,
            ["sensorList["+index+"].bottom"]:bottom,
        })
        console.log(this.data.sensorList);
    }
});
