// #include <Arduino.h>
// #include <ArduinoJson.h>
// #include <Servo.h>
// // ==================== LED====================
// #define LED_PIN 14
// //==================== FAN====================
// //此处只驱动电机开始/停止运作
// #define MOTOR_PIN 15
// //==================== Servo====================
// #define SERVO_PIN 27
// Servo myServo;
// void LED_Init()
// {
//     pinMode(LED_PIN, OUTPUT);
//     digitalWrite(LED_PIN, 0);
// }

// void MOTOR_Init()
// {
//     pinMode(MOTOR_PIN, OUTPUT);  
//     digitalWrite(MOTOR_PIN, 0);
// }

// // 任意角度（0~180）
// void Servo_SetAngle(int angle) {
//   angle = constrain(angle, 0, 180); // 限制范围
//   myServo.write(angle);
// }

// void SERVO_Init()
// {
//     myServo.attach(SERVO_PIN);  
//     Servo_SetAngle(0);
// }

// // ==================== MQTT 回调函数 ====================
// void callback(const char* topic, uint8_t* payload, unsigned int length){
//   Serial.print("收到MQTT消息,主题:");
//   Serial.println(topic);
//   StaticJsonDocument<256> doc;
//   DeserializationError error = deserializeJson(doc, payload, length);
//   if (!error) {
//     if (doc.containsKey("LIGHT")) {
//       const char* status = doc["LIGHT"];
//       if(strcmp(status,"ON")==0)
//       {
//          digitalWrite(LED_PIN, 1); 
//          Serial.println("LIGHT ON");
//       }
//       else{
//         digitalWrite(LED_PIN, 0); 
//         Serial.println("LIGHT OFF");
//       }
//     }
//     if (doc.containsKey("FAN")) {
//       const char* status = doc["FAN"];
//       Serial.println(strcmp(status,"ON")==0 ? "FAN ON" : "FAN OFF");
//       if(strcmp(status,"ON")==0)
//       {
//          digitalWrite(MOTOR_PIN, 1); 
//          Serial.println("FAN ON");
//       }
//       else{
//         digitalWrite(MOTOR_PIN, 0); 
//         Serial.println("FAN OFF");
//       }
//     }
//     if (doc.containsKey("CURTAIN")) {
//       const char* status = doc["CURTAIN"];
//       if(strcmp(status,"ON")==0)
//       {
//          Servo_SetAngle(180);
//          Serial.println("CURTAIN ON");
//       }
//       else{
//         Servo_SetAngle(0);
//         Serial.println("CURTAIN OFF");
//       }
//     }
//   }
// }
