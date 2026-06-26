#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <LittleFS.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WebSocketsServer.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

const char* ssid = "Zero";
const char* password = "helloworld";

unsigned long lastRefresh = 0;
const unsigned long REFRESH_INTERVAL = 16;

bool drawing = false;

int previousX = 0;
int previousY = 0;

enum Tool
{
    BRUSH,
    ERASER
};

Tool currentTool = BRUSH;

uint8_t brushSize = 1;

WebServer server(80);
WebSocketsServer webSocket(81);

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
    display.clearDisplay();

    server.send(
        200,
        "text/plain",
        "OK"
    );
}

uint16_t getCurrentColor()
{
    return (currentTool == BRUSH) ? SSD1306_WHITE : SSD1306_BLACK;
}

void drawPixelOnOLED(int x, int y) {
    int oledX = x / 4;
    int oledY = y / 4;

    Serial.printf(
        "Canvas:(%d,%d) -> OLED:(%d,%d)\n",
        x,
        y,
        oledX,
        oledY
    );

    display.drawPixel(oledX, oledY, getCurrentColor());
}

void drawBrush(int x, int y) {
    switch (brushSize)
    {
        case 1:
            display.drawPixel(x, y, getCurrentColor());
            break;

        case 2:
            display.fillCircle(x, y, 1, getCurrentColor());
            break;

        case 3:
            display.fillCircle(x, y, 2, getCurrentColor());
            break;
    }
}

void drawLineOnOLED(int x1, int y1, int x2, int y2) {
    int oledX1 = x1 / 4;
    int oledY1 = y1 / 4;

    int oledX2 = x2 / 4;
    int oledY2 = y2 / 4;

    Serial.printf(
        "Canvas:(%d,%d)->(%d,%d) -> OLED:(%d,%d)->(%d,%d)\n",
        x1,
        y1,
        x2,
        y2,
        oledX1,
        oledY1,
        oledX2,
        oledY2
    );

    int dx = oledX2 - oledX1;
    int dy = oledY2 - oledY1;

    int steps = max(abs(dx), abs(dy));

    if (steps == 0)
    {
        drawBrush(oledX1, oledY1);
    }
    else
    {
        for (int i = 0; i <= steps; i++)
        {
            int x = oledX1 + dx * i / steps;
            int y = oledY1 + dy * i / steps;

            drawBrush(x, y);
        }
    }
    display.display();
}

void onWebSocketEvent(
    uint8_t clientNum,
    WStype_t type,
    uint8_t *payload,
    size_t length
) {
    
    switch (type) {
        case WStype_CONNECTED:
            Serial.printf("Client %u connected\n", clientNum);
            break;

        case WStype_DISCONNECTED:
            Serial.printf("Client %u disconnected\n", clientNum);
            break;

        case WStype_TEXT: {
            String message = (char *)payload;
            if (message.startsWith("TOOL,"))
            {
                String toolName = message.substring(5);

                if (toolName == "BRUSH")
                {
                    currentTool = BRUSH;
                }
                else if (toolName == "ERASER")
                {
                    currentTool = ERASER;
                }

                Serial.printf("Tool: %s\n", toolName.c_str());
                return;
            }

            if (message.startsWith("SIZE,"))
            {
                brushSize = message.substring(5).toInt();
                Serial.printf("Brush Size: %u\n", brushSize);

                return;
            }

            if (message == "START") {
                drawing = true;
                previousX = -1;
                previousY = -1;

                return;
            }
            if (message == "END") {
                drawing = false;

                return;
            }
            if (message == "CLEAR") {
                display.clearDisplay();
                previousX = -1;
                previousY = -1;

                break;
            }

            int x, y;

            if (sscanf((char *)payload, "DRAW,%d,%d", &x, &y) == 2) {
                if (previousX == -1) {
                    drawPixelOnOLED(x, y);
                } else {
                    drawLineOnOLED(previousX, previousY, x, y);
                }

                previousX = x;
                previousY = y;
            }
            break;
        }

        default:
            break;
    }
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

    Wire.begin();
    Wire.setClock(400000);

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
    server.on("/style.css", handleCSS);
    server.on("/app.js", handleJS);

    Serial.println("[5] Starting Server");

    server.begin();

    webSocket.begin();
    webSocket.onEvent(onWebSocketEvent);

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
    webSocket.loop();

    if (millis() - lastRefresh >= REFRESH_INTERVAL)
    {
        display.display();
        lastRefresh += REFRESH_INTERVAL;
    }
}