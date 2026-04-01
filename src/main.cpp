#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Servo.h>
#include <DHT.h>
#include <DHT_U.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_MPU6050.h>

void callback(const char* topic, uint8_t* payload, unsigned int length);
void taskDHT(void *pvParameters);
void taskMPU(void *pvParameters);
void taskLight(void *pvParameters);

// ==================== WIFI & MQTT ====================
const char* mqtt_client_id = "ESP32_Sensor_123";
//WIFI账号和密码
const char* ssid = "";
const char* password = "";
//主机网络ip
const char* mqtt_broker = "";
const char* topic_publisher = "esp32_sensor";
const char* topic_subscribe = "esp32_driver";
//用户名及密码
const char* mqtt_username = "";
const char* mqtt_password = "";
uint16_t mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

//==================== DRIVE====================
#define LED_PIN 14
#define MOTOR_PIN 15
#define SERVO_PIN 27
void LED_Init();
void MOTOR_Init();
void SERVO_Init();
void Servo_SetAngle(int angle) ;
void callback(const char* topic, uint8_t* payload, unsigned int length);
Servo myServo;


//====================SENSOR====================

#define DHTPIN 4
#define LIGHT_PIN 34   
#define DHTTYPE DHT11
void taskDHT(void *pvParameters);
void taskMPU(void *pvParameters);
void taskLight(void *pvParameters);
void MPU6050_Init();
void DHT_Init();

DHT_Unified dht(DHTPIN, DHTTYPE);
Adafruit_MPU6050 mpu;
sensors_event_t a,g,temp;
String jsonDHT = "{\"status\":\"idle\"}";
float currentSpeed = 0.0;
unsigned long lastTime = 0;
float horizontalSpeedX = 0, horizontalSpeedY = 0;
float light_percent=0;
     

// ==================== MQTT 回调函数 ====================
void callback(const char* topic, uint8_t* payload, unsigned int length){
  Serial.print("收到MQTT消息,主题:");
  Serial.println(topic);
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  if (!error) {
    if (doc.containsKey("LIGHT")) {
      const char* status = doc["LIGHT"];
      if(strcmp(status,"ON")==0)
      {
         digitalWrite(LED_PIN, 1); 
         Serial.println("LIGHT ON");
      }
      else{
        digitalWrite(LED_PIN, 0); 
        Serial.println("LIGHT OFF");
      }
    }
    if (doc.containsKey("FAN")) {
      const char* status = doc["FAN"];
      Serial.println(strcmp(status,"ON")==0 ? "FAN ON" : "FAN OFF");
      if(strcmp(status,"ON")==0)
      {
         digitalWrite(MOTOR_PIN, 1); 
         Serial.println("FAN ON");
      }
      else{
         digitalWrite(MOTOR_PIN, 0); 
        Serial.println("FAN OFF");
      }
    }
    if (doc.containsKey("CURTAIN")) {
      const char* status = doc["CURTAIN"];
      if(strcmp(status,"ON")==0)
      {
          Servo_SetAngle(180);
         Serial.println("CURTAIN ON");
      }
      else{
         Servo_SetAngle(0);
        Serial.println("CURTAIN OFF");
      }
    }
  }
}

 void setup()
 {
  Serial.begin(115200);
  Wire.begin();

  MPU6050_Init();
  DHT_Init();
  LED_Init();
  MOTOR_Init();
  SERVO_Init();

  // WIFI
  WiFi.begin(ssid, password);
  while (!WiFi.isConnected()) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi 连接成功!");
 

  // MQTT
  client.setServer(mqtt_broker, mqtt_port);
  client.setCallback(callback);
  while (!client.connected()) {
    client.connect(mqtt_client_id, mqtt_username, mqtt_password);
    delay(1000);
  }
  client.subscribe(topic_subscribe);
  Serial.println("MQTT 连接成功!");

  // ==================== 创建任务 ====================
 
  xTaskCreate(taskDHT, "TaskDHT", 2048, NULL, 1, NULL);
  xTaskCreate(taskMPU, "TaskMPU", 2048, NULL, 2, NULL);
  xTaskCreate(taskLight,"taskLight",2048,NULL,3,NULL);

}


//==================== LOOP ====================
void loop() {
  client.loop();
  client.publish(topic_publisher, jsonDHT.c_str());
  delay(3000);
}

void LED_Init()
{
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, 0);
}

void MOTOR_Init()
{
    pinMode(MOTOR_PIN, OUTPUT);  
    digitalWrite(MOTOR_PIN, 0);
}

//任意角度（0~180）
void Servo_SetAngle(int angle) {
  angle = constrain(angle, 0, 180); // 限制范围
  myServo.write(angle);
}

void SERVO_Init()
{
    myServo.attach(SERVO_PIN);  
    Servo_SetAngle(0);
}


void DHT_Init(){
     dht.begin();
}

void MPU6050_Init(){
    if (!mpu.begin()) {
    Serial.println("MPU6050初始化失败!");
    while (1) delay(1000);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  lastTime = millis();
  Serial.println("MPU6050初始化成功!");
}

//==================== 任务1:DHT 温湿度 ====================
void taskDHT(void *pvParameters) {
  sensors_event_t event;
  while (1) {
    static unsigned long lastRead = 0;
    if (millis() - lastRead > 2000) {
      lastRead = millis();

      JsonDocument doc;
      float temp = NAN, humi = NAN;

      dht.temperature().getEvent(&event);
      if (!isnan(event.temperature)) temp = event.temperature;

      dht.humidity().getEvent(&event);
      if (!isnan(event.relative_humidity)) humi = event.relative_humidity;

      if (isnan(temp) || isnan(humi)) {
        doc["status"] = "error";
      } else {
        doc["TEMPERATURE"] = round(temp * 10) / 10.0;
        doc["HUMIDITY"] = round(humi * 10) / 10.0;
        doc["LIGHT_INTENDITY"] = light_percent;
        doc["LOCATION_DEG"] = currentSpeed;
      }
      serializeJson(doc, jsonDHT);
      Serial.println("更新数据: " + jsonDHT);
    }
    vTaskDelay(20 / portTICK_PERIOD_MS);
  }
}

// ==================== 任务2：MPU6050 核心：计算水平移动速度 ====================
void taskMPU(void *pvParameters) {
  while (1) {
    unsigned long currentTime = millis();
    float dt = (currentTime - lastTime) / 1000.0;
    lastTime = currentTime;
// 读取加速度计数据（仅水平轴X/Y）
    mpu.getEvent(&a, &g, &temp);
    float accX = a.acceleration.x;
    float accY = a.acceleration.y;
// 积分计算速度(简化)
    horizontalSpeedX += accX * dt;
    horizontalSpeedY += accY * dt;
// 限幅：过滤异常值
    horizontalSpeedX = constrain(horizontalSpeedX, -10.0, 10.0);
    horizontalSpeedY = constrain(horizontalSpeedY, -10.0, 10.0);
    float speed = sqrt(horizontalSpeedX*horizontalSpeedX + horizontalSpeedY*horizontalSpeedY);
    currentSpeed = round(speed * 100) / 100.0;

    vTaskDelay(20 / portTICK_PERIOD_MS);
  }
}
// ==================== 任务3:光照程度===================
void taskLight(void *pvParameters)
{
   while (1) 
   {
      int light = analogRead(LIGHT_PIN);
      // 0-4065模拟值转换成 0-100亮度
      light_percent = round(((4095 - light) / 4095.0) * 100);
      vTaskDelay(20 / portTICK_PERIOD_MS);
   }
}
