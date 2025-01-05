const fs = require('fs');
const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000; // Port for the REST API

// Enable CORS for all routes
app.use(cors());

// MQTT connection setup
const protocol = 'mqtts';
const host = 'k11bbfa7.ala.us-east-1.emqxsl.com';
const port = '8883';
const clientId = `gobind_id`;

const connectUrl = `${protocol}://${host}:${port}`;

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'aiinfox',
  reconnectPeriod: 1000,
  ca: fs.readFileSync('./emqxsl-ca.crt'),
});

const topic = 't/#';

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

// Function to generate dynamic meter readings
const generateMeterReading = () => {
  const randomMeterReading = (Math.random() * (500 - 100) + 100).toFixed(3);
  const now = new Date();
  const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, '/');
  const formattedTime = now.toTimeString().split(' ')[0];
  const randomID = Math.floor(Math.random() * 10000).toString();

  return {
    Type: 'MR',
    ID: randomID,
    DATE: formattedDate,
    TIME: formattedTime,
    SL_ID: '1',
    RegAd: '3021',
    Length: '2',
    D1: randomMeterReading,
  };
};

// REST API to subscribe to topics
app.get('/subscribe', (req, res) => {
  const data = generateMeterReading();

  // Subscribe to the topic
  client.subscribe(data, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${data}`);
      res.json({
        success: true,
        message: `Subscribed to topic: ${data}`,
        data,
      });
    } else {
      console.error('Error in subscribing:', err);
      res.status(500).json({ success: false, message: 'Failed to subscribe', error: err });
    }
  });
});

// Handle received messages
client.on('message', (topic, payload) => {
  console.log('Received Message:', topic, payload.toString());
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`REST API server is running on http://localhost:${PORT}`);
});
