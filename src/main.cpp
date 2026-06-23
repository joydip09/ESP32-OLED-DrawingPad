#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

const char* ssid = "Zero";
const char* password = "helloworld";

WebServer server(80);

Adafruit_SSD1306 display(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    &Wire,
    -1
);

void listFiles()
{
    Serial.println("\n===== FILE LIST =====");

    File root = LittleFS.open("/");

    if (!root)
    {
        Serial.println("Failed to open root directory");
        return;
    }

    File file = root.openNextFile();

    while (file)
    {
        Serial.print("FILE: ");
        Serial.print(file.name());
        Serial.print(" | SIZE: ");
        Serial.println(file.size());

        file = root.openNextFile();
    }

    Serial.println("=====================\n");
}

void handleRoot()
{
    Serial.println("\nGET /");

    File file = LittleFS.open("/index.html", "r");

    if (!file)
    {
        Serial.println("ERROR: /index.html not found");

        server.send(
            404,
            "text/plain",
            "index.html not found"
        );

        return;
    }

    Serial.println("Serving /index.html");

    server.streamFile(
        file,
        "text/html"
    );

    file.close();
}


void handleCSS()
{
    File file = LittleFS.open("/style.css", "r");

    server.streamFile(file, "text/css");

    file.close();
}

void handleJS()
{
    File file = LittleFS.open("/app.js", "r");

    server.streamFile(file, "application/javascript");

    file.close();
}

void handleClear()
{
    uint32_t start = millis();

    Serial.println("GET /clear");

    display.clearDisplay();
    display.display();
    
    uint32_t oledTime = millis() - start;

    server.send(200, "text/plain", String(oledTime));

    Serial.printf(
        "Clear time: %lu ms\n",
        millis() - start
    );

    server.send(
        200,
        "text/plain",
        "OK"
    );
}

void handleRect()
{
    uint32_t start = millis();

    display.clearDisplay();

    display.drawRect(
        20,
        10,
        80,
        40,
        SSD1306_WHITE
    );

    display.display();

    uint32_t oledTime = millis() - start;

    server.send(200, "text/plain", String(oledTime));

    Serial.printf(
        "Rect draw time: %lu ms\n",
        millis() - start
    );

    server.send(
        200,
        "text/plain",
        "OK"
    );
}

void handleCircle()
{
    uint32_t start = millis();

    Serial.println("GET /circle");

    display.clearDisplay();

    display.drawCircle(
        64,
        32,
        20,
        SSD1306_WHITE
    );

    display.display();

    uint32_t oledTime = millis() - start;

    server.send(200, "text/plain", String(oledTime));

    Serial.printf(
        "Circle draw time: %lu ms\n",
        millis() - start
    );

    server.send(
        200,
        "text/plain",
        "OK"
    );
}

void setup()
{
    Serial.begin(115200);

    delay(2000);

    Serial.println("\n==============================");
    Serial.println("ESP32 OLED DRAWING PAD");
    Serial.println("==============================");

    Serial.println("\n[1] Mounting LittleFS");

    if (!LittleFS.begin(true))
    {
        Serial.println("FAILED: LittleFS mount");

        while (true)
        {
            delay(1000);
        }
    }

    Serial.println("SUCCESS: LittleFS mounted");

    listFiles();

    Serial.println("[2] Initializing OLED");

    if (!display.begin(
        SSD1306_SWITCHCAPVCC,
        0x3C))
    {
        Serial.println("FAILED: OLED");

        while (true)
        {
            delay(1000);
        }
    }

    Serial.println("SUCCESS: OLED initialized");

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("Boot OK");
    display.display();

    Serial.println("[3] Connecting WiFi");

    WiFi.begin(
        ssid,
        password
    );

    int attempts = 0;

    while (
        WiFi.status() != WL_CONNECTED &&
        attempts < 30
    )
    {
        delay(1000);

        Serial.print(".");

        attempts++;
    }

    Serial.println();

    Serial.print("WiFi Status: ");
    Serial.println(WiFi.status());

    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("FAILED: WiFi");
    }
    else
    {
        Serial.println("SUCCESS: WiFi");

        Serial.print("IP Address: ");
        Serial.println(
            WiFi.localIP()
        );
    }

    WiFi.setSleep(false);

    Serial.println("[4] Registering Routes");

    server.on("/", handleRoot);
    server.on("/clear", handleClear);
    server.on("/rect", handleRect);
    server.on("/circle", handleCircle);
    server.on("/style.css", handleCSS);
    server.on("/app.js", handleJS);

    Serial.println("[5] Starting Server");

    server.begin();

    Serial.println("SUCCESS: Server Started");
    Serial.println("==============================\n");
    Serial.printf(
    "PSRAM: %u bytes\n",
    ESP.getPsramSize()
    );
}

void loop()
{
    server.handleClient();
}