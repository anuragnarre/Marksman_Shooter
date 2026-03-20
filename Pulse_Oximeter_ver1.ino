#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>     
#include <time.h>           
#include "MAX30105.h"       
#include "spo2_algorithm.h" 
#include "thingProperties.h"

// --- Hardware Definitions ---
#define I2C_SDA 6
#define I2C_SCL 5
#define CONTACT_THRESHOLD 80000 

MAX30105 particleSensor;

// --- Vercel API Credentials ---
const char* vercel_url = "https://www.marksmanspro.com/api/vitals";
#define DEVICE_API_KEY "3833900fbc675b5e5de7b962b3ef5742711fcd98415cb5443bd38ab797196c40" 

// --- OS State Machine ---
enum SystemState {
  OS_BOOTING,
  OS_RUNNING_LOCAL,
  OS_STARTING_NETWORK,
  OS_RUNNING_CONNECTED,
  OS_NETWORK_RECOVERING
};
SystemState currentState = OS_BOOTING;

// --- OS Global & Telemetry Variables ---
volatile int32_t safe_heart_rate = 0;
volatile int32_t safe_spo2 = 0;
volatile bool is_worn = false; 

unsigned long os_timer = 0;
unsigned long last_successful_connection = 0; 
unsigned long last_diagnostic_print = 0; 

// Telemetry Metrics
volatile unsigned long sensor_lag_us = 0; 
unsigned long cloud_sync_lag_ms = 0;
long wifi_rssi = 0;

// NTP Time Tracking
bool time_synced = false;

// Sensor buffers
#define BUFFER_SIZE 100
uint32_t irBuffer[BUFFER_SIZE];   
uint32_t redBuffer[BUFFER_SIZE];  
int32_t bufferLength = BUFFER_SIZE;
int32_t spo2_calc;      
int8_t validSPO2;       
int32_t heartRate_calc; 
int8_t validHeartRate;  

// ================================================================
// Vercel POST Function (Your Specific Implementation)
// ================================================================
void sendToVercel(String read_type, int hr, int spo2) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure *client = new WiFiClientSecure;
    if(client) {
      client->setInsecure(); // Bypass SSL cert validation for speed
      
      HTTPClient https;
      // Posts directly to the NestJS backend
      if (https.begin(*client, "https://www.marksmanspro.com/api/vitals")) {
        
        https.addHeader("Content-Type", "application/json");
        https.addHeader("X-Device-Key", DEVICE_API_KEY);

        // Build JSON Payload — use camelCase field names to match backend DTO
        String jsonPayload = "{\"type\":\"" + read_type + "\",\"heartRate\":" + String(hr) + ",\"spo2\":" + String(spo2) + "}";
        
        unsigned long http_start = millis();
        int httpCode = https.POST(jsonPayload);
        unsigned long http_time = millis() - http_start;
        
        if (httpCode > 0) {
          Serial.printf("[Vercel API] %s: HTTP %d (Took %d ms)\n", read_type.c_str(), httpCode, (int)http_time);
        } else {
          Serial.printf("[Vercel API] FAILED. Error: %s\n", https.errorToString(httpCode).c_str());
        }
        https.end();
      }
      delete client; // Free up memory
    }
  }
}

// ================================================================
// OS Background Service: Health Task
// ================================================================
void HealthServiceTask(void *pvParameters) {
  vTaskDelay(pdMS_TO_TICKS(5000)); 

  while (1) { 
    unsigned long start_read = micros();
    long irValue = particleSensor.getIR();
    sensor_lag_us = micros() - start_read; 
    
    if (irValue < CONTACT_THRESHOLD) {
      if (is_worn == true) {
        is_worn = false;
        safe_heart_rate = 0;
        safe_spo2 = 0;
      }
      vTaskDelay(pdMS_TO_TICKS(500)); 
    } else {
      if (is_worn == false) {
         is_worn = true;
         for (byte i = 0 ; i < bufferLength ; i++) {
            while (particleSensor.available() == false) particleSensor.check();
            redBuffer[i] = particleSensor.getRed();
            irBuffer[i] = particleSensor.getIR();
            particleSensor.nextSample();
            vTaskDelay(pdMS_TO_TICKS(10)); 
         }
      }

      maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2_calc, &validSPO2, &heartRate_calc, &validHeartRate);

      if (validSPO2 && validHeartRate) {
        if (heartRate_calc >= 40 && heartRate_calc <= 200 && spo2_calc >= 70 && spo2_calc <= 100) {
          safe_heart_rate = heartRate_calc;
          safe_spo2 = spo2_calc;
        }
      }

      // Buffer Shift
      for (byte i = 25; i < 100; i++) {
        redBuffer[i - 25] = redBuffer[i];
        irBuffer[i - 25] = irBuffer[i];
      }
      for (byte i = 75; i < 100; i++) {
        while (particleSensor.available() == false) particleSensor.check();
        redBuffer[i] = particleSensor.getRed();
        irBuffer[i] = particleSensor.getIR();
        particleSensor.nextSample();
        vTaskDelay(pdMS_TO_TICKS(10)); 
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA, I2C_SCL); 
  while (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    delay(2000);
  }
  particleSensor.setup(60, 4, 2, 100, 411, 4096);
  xTaskCreate(HealthServiceTask, "HealthTask", 4096, NULL, 1, NULL);
  currentState = OS_RUNNING_LOCAL;
  os_timer = millis();
}

void loop() {
  switch(currentState) {
    case OS_RUNNING_LOCAL:
      if (millis() - os_timer > 2000) currentState = OS_STARTING_NETWORK;
      break;

    case OS_STARTING_NETWORK:
      initProperties();
      ArduinoCloud.begin(ArduinoIoTPreferredConnection);
      configTime(0, 0, "pool.ntp.org");
      currentState = OS_RUNNING_CONNECTED;
      break;

    case OS_RUNNING_CONNECTED: { 
      ArduinoCloud.update();
      wifi_rssi = WiFi.RSSI(); 

      if (is_worn) {
         cloud_heartRate = safe_heart_rate;
         cloud_spo2 = safe_spo2;
      } else {
        cloud_heartRate = 0; cloud_spo2 = 0;
      }

      // Sync to Vercel every 2 seconds — only send when worn with valid readings
      if (millis() - last_diagnostic_print >= 2000) {
        last_diagnostic_print = millis();

        if (is_worn && safe_heart_rate >= 40 && safe_spo2 >= 50) {
          sendToVercel("optimal_read", (int)safe_heart_rate, (int)safe_spo2);
        }

        Serial.printf("[DASH] Worn: %s | HR: %d | SpO2: %d%% | RSSI: %d\n",
          is_worn ? "YES" : "NO", (int)safe_heart_rate, (int)safe_spo2, (int)wifi_rssi);
      }
      break;
    } 

    case OS_NETWORK_RECOVERING:
      if (ArduinoCloud.connected()) currentState = OS_RUNNING_CONNECTED;
      break;
  }
  delay(10); 
}