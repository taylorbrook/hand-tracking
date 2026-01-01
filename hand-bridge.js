autowatch = 1;

// hand-bridge.js - Run this with [node.script hand-bridge.js] in Max/MSP
// This bridges WebSocket data from the browser to Max outlets

const maxApi = require("max-api");
const WebSocket = require("ws");

// Create WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

maxApi.post("Hand detection bridge started on port 8080");
maxApi.post("Waiting for browser connection...");

wss.on("connection", (ws) => {
    maxApi.post("Browser connected!");
    
    ws.on("message", (message) => {
        try {
            const handData = JSON.parse(message);
            
            // Send data through Max outlets
            handData.forEach((hand, handIdx) => {
                // Output format: hand_index handedness landmark_index x y z
                hand.landmarks.forEach((landmark, landmarkIdx) => {
                    // Send as list: [hand_index, handedness, landmark_index, x, y, z]
                    maxApi.outlet([
                        handIdx,
                        hand.handedness,
                        landmarkIdx,
                        parseFloat(landmark.x),
                        parseFloat(landmark.y),
                        parseFloat(landmark.z)
                    ]);
                });
            });
        } catch (error) {
            maxApi.post("Error parsing hand data:", error.message);
        }
    });
    
    ws.on("close", () => {
        maxApi.post("Browser disconnected");
    });
    
    ws.on("error", (error) => {
        maxApi.post("WebSocket error:", error.message);
    });
});

wss.on("error", (error) => {
    maxApi.post("Server error:", error.message);
});

// Handle Max messages (optional - for controlling the bridge)
maxApi.addHandler("stop", () => {
    maxApi.post("Stopping bridge server...");
    wss.close();
});

maxApi.addHandler("status", () => {
    maxApi.post(`Connected clients: ${wss.clients.size}`);
});