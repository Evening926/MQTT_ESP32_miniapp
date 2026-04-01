//数据库基本信息
const mysql2 = require("mysql2");
let options = {
    host: "localhost",
    user: "root",
    password: "2005926323ywl",
    database: "esp32_records",
};
//创建与数据库进行连接的连接对象
const connection = mysql2.createConnection(options);
module.exports = connection;