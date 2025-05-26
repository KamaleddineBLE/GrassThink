// components/MqttSensorListener.js
import { useEffect, useState, useRef } from "react";
import Paho from "paho-mqtt";

const MqttSensorListener = ({ topic, onData, onControl }) => {
  const clientRef = useRef(null);

  useEffect(() => {
    const clientId = "client-" + Math.random().toString(16).substr(2, 8);

    const client = new Paho.Client(
      "621175d07af342118eb57cf44f2fe4ca.s1.eu.hivemq.cloud",
      Number(8884),
      "/mqtt",
      clientId
    );

    clientRef.current = client;

    client.onMessageArrived = (message) => {
      try {
        // console.log("MQTT message arrived:", message);
        const data = JSON.parse(message.payloadString);
        onData(data);
      } catch (err) {
        console.error("MQTT parsing error", err);
      }
    };

    client.onConnectionLost = () => {
      console.warn(`MQTT lost for ${topic}, reconnecting...`);
      setTimeout(() => client.connect(connectOptions), 3000);
    };

    const connectOptions = {
      useSSL: true,
      userName: "kamal", // <-- Replace with your HiveMQ username
      password: "Estinpfe25",
      onSuccess: () => {
        console.log(`MQTT connected: subscribing to ${topic}`);
        client.subscribe(topic);
        if (onControl) {
          onControl((subTopic, msg) => {
            const mqttMessage = new Paho.Message(JSON.stringify(msg));
            mqttMessage.destinationName = subTopic;
            client.send(mqttMessage);
          });
        }
      },

      onFailure: (err) => {
        console.error("MQTT failed", err);
        setTimeout(() => client.connect(connectOptions), 3000);
      },
    };

    client.connect(connectOptions);

    return () => {
      if (client && client.isConnected()) {
        client.unsubscribe(topic);
        client.disconnect();
      }
    };
  }, [topic]);

  return null; // no UI, just logic
};

export default MqttSensorListener;
