var express = require('express'); //espress框架
var router = express.Router();
const connection = require("../options/mysqlOption.js");
const handledata = require("../options/handletime.js");
connection.connect((err) => {
  if (!err) {
    //数据库连接成功
    console.log("数据库连接成功！");
  } else {
    console.log("数据库连接失败！", err);
  }
});

/* GET home page. */
//路由接口router.get('/'),负责处理客户端请求，当客户端访问‘/’时，会执行SQL语句
router.get('/', function (req, res, next) {
  //
  // let sqlStr = 'select * from esp32_data';
  // let sqlStr = "update esp32_data set sensor_value = 60 where id =2;";
  // let sqlStr = "delete from esp32_data where id = 12;";
  // let sqlStr = "insert into esp32_data (sensor_name , sensor_value) values ('smoke',60);";
  // connection.query(sqlStr, (err, result, fields) => {
    // if (!err) {
      // console.log(result);
      // let resultData = result.map(item => {
      //   return {
      //     ...item,
      //     create_time: handledata(item.create_time),
      //     update_time: handledata(item.update_time)
      //   }

      // })
  //     res.json({ data: resultData });

  //     res.json({ msg: '操作成功' });
  //   } else {
  //     res.json({ msg: '操作失败' });
  //     console.log('错误信息:', err);
  //   }
  //   console.log(fields);

  // });
  res.send('hello!');
});

//查询接口
router.get('/api/get_records', function (req, res, next) {
  //解构赋值
  let { sensor_name, create_time } = req.query;
  let sqlStr = `select * from esp32_data where sensor_name = '${sensor_name}' and 
  date(create_time) = '${create_time}'`;
  //localhost:3000/api/get_records?sensor_name=smoke&create_time=2025-11-11
  console.log(sqlStr);
  connection.query(sqlStr, (err, result, fields) => {
    if (!err) {
      console.log("查询结果：" + result.length + "条");
      //对查询结果进行处理
      let resultData = result.map(item => {
        return {
          ...item,
          create_time: handledata(item.create_time),//调用工具函数处理时间
          update_time: handledata(item.update_time),
        };

      });
      res.json({ code: 200, msg: "查询成功", data: resultData });
      return;

    }
    res.json({ code: 404, msg: "查询失败" });
  });
});

//新增
router.post('/api/add_record', function (req, res, next) {
  //从请求体中获得sensor_name和sensor_value
  let { sensor_name, sensor_value } = req.body;
  //拼接sql语句
  let sqlStr = `insert into esp32_data (sensor_name,sensor_value) values 
  ('${sensor_name}',${sensor_value})`;
  //在控制台打印需要执行的sql语句
  console.log(sqlStr);
  connection.query(sqlStr, (err, result, fields) => {
    if (!err) {
      res.json({ code: 200, msg: "添加成功" });
      return;

    }
    res.json({ code: 404, msg: "添加失败" ,error:err.message});
  });

});

//删除
router.post('/api/del_record', function (req, res, next) {
  let { id } = req.body;
  let sqlStr = `delete from esp32_data where id = ${id}`;
  console.log(sqlStr);
  connection.query(sqlStr, (err, result, fields) => {
    if (!err) {
      res.json({ code: 200, msg: "删除成功" });
      return;

    }
    res.json({ code: 404, msg: "删除失败" });
  });
});

//修改
router.post('/api/update_record', function (req, res, next) {
  let { id, sensor_value } = req.body;
  let sqlStr = `update esp32_data set sensor_value = ${sensor_value} where id = ${id};`;
  console.log(sqlStr);
  connection.query(sqlStr, (err, result, fields) => {
    if (!err) {
      res.json({ code: 200, msg: "修改成功" });
      return;

    }
    res.json({ code: 404, msg: "修改失败" });
  });
});
module.exports = router;
