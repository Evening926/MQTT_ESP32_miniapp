// #include <Arduino.h>
// #include <DHT.h>
// #include <DHT_U.h>
// #include <Adafruit_Sensor.h>
// #include <ArduinoJson.h>
// #include <Adafruit_MPU6050.h>
// #include <Wire.h>
// // ==================== DHT11 ====================
// #define DHTPIN 4
// #define DHTTYPE DHT11
// DHT_Unified dht(DHTPIN, DHTTYPE);

// // ==================== MPU6050 ====================
// Adafruit_MPU6050 mpu;
// sensors_event_t a;

// // ==================== light_sensor====================
// #define LIGHT_PIN 34   

// // ==================== FreeRTOS 全局数据 ====================
// String jsonDHT = "{\"status\":\"idle\"}";
// float currentSpeed = 0.0;
// unsigned long lastTime = 0;
// float horizontalSpeedX = 0, horizontalSpeedY = 0;
// float light_percent=0;

// void DHT_Init(){
//      dht.begin();
// }

// void MPU6050_Init(){
//     if (!mpu.begin()) {
//     Serial.println("MPU6050初始化失败!");
//     while (1) delay(1000);
//   }
//   mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
//   lastTime = millis();
//   Serial.println("MPU6050初始化成功!");
// }

// // ==================== 任务1：DHT 温湿度 ====================
// void taskDHT(void *pvParameters) {
//   sensors_event_t event;
//   while (1) {
//     static unsigned long lastRead = 0;
//     if (millis() - lastRead > 2000) {
//       lastRead = millis();

//       JsonDocument doc;
//       float temp = NAN, humi = NAN;

//       dht.temperature().getEvent(&event);
//       if (!isnan(event.temperature)) temp = event.temperature;

//       dht.humidity().getEvent(&event);
//       if (!isnan(event.relative_humidity)) humi = event.relative_humidity;

//       if (isnan(temp) || isnan(humi)) {
//         doc["status"] = "error";
//       } else {
//         doc["TEMPERATURE"] = round(temp * 10) / 10.0;
//         doc["HUMIDITY"] = round(humi * 10) / 10.0;
//         doc["LIGHT_INTENDITY"] = light_percent;
//         doc["LOCATION_DEG"] = currentSpeed;
//       }
//       serializeJson(doc, jsonDHT);
//       Serial.println("更新数据: " + jsonDHT);
//     }
//     vTaskDelay(20 / portTICK_PERIOD_MS);
//   }
// }

// // ==================== 任务2：MPU6050 核心：计算水平移动速度 ====================
// void taskMPU(void *pvParameters) {
//   while (1) {
//     unsigned long currentTime = millis();
//     float dt = (currentTime - lastTime) / 1000.0;
//     lastTime = currentTime;
// // 读取加速度计数据（仅水平轴X/Y）
//     mpu.getEvent(&a, NULL, NULL);
//     float accX = a.acceleration.x;
//     float accY = a.acceleration.y;
// // 积分计算速度(简化)
//     horizontalSpeedX += accX * dt;
//     horizontalSpeedY += accY * dt;
// // 限幅：过滤异常值
//     horizontalSpeedX = constrain(horizontalSpeedX, -10.0, 10.0);
//     horizontalSpeedY = constrain(horizontalSpeedY, -10.0, 10.0);
//     float speed = sqrt(horizontalSpeedX*horizontalSpeedX + horizontalSpeedY*horizontalSpeedY);
//     currentSpeed = round(speed * 100) / 100.0;

//     vTaskDelay(20 / portTICK_PERIOD_MS);
//   }
// }
// // ==================== 任务3:光照程度===================
// void taskLight(void *pvParameters)
// {
//    while (1) 
//    {
//       int light = analogRead(LIGHT_PIN);
//       // 0-4065模拟值转换成 0-100亮度
//       light_percent = round(((4095 - light) / 4095.0) * 100);
//       vTaskDelay(20 / portTICK_PERIOD_MS);
//    }
// }
