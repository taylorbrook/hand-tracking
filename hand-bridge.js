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

    // Tracks whether hands were visible, so "nohands" is sent once per disappearance
    let handsVisible = false;

    ws.on("message", (message) => {
        try {
            const handData = JSON.parse(message);

            if (handData.length === 0) {
                if (handsVisible) {
                    handsVisible = false;
                    maxApi.outlet("nohands");
                }
                return;
            }
            handsVisible = true;

            // Output format: hand_index handedness landmark_index x y z
            handData.forEach((hand, handIdx) => {
                hand.landmarks.forEach((landmark, landmarkIdx) => {
                    maxApi.outlet([
                        handIdx,
                        hand.handedness,
                        landmarkIdx,
                        landmark.x,
                        landmark.y,
                        landmark.z
                    ]);
                });
            });
        } catch (error) {
            maxApi.post("Error parsing hand data:", error.message);
        }
    });

    ws.on("close", () => {
        maxApi.post("Browser disconnected");
        if (handsVisible) {
            maxApi.outlet("nohands");
        }
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
    // close() only stops accepting new connections, so drop the existing ones too
    wss.clients.forEach((client) => client.terminate());
    wss.close();
});

maxApi.addHandler("status", () => {
    maxApi.post(`Connected clients: ${wss.clients.size}`);
});
