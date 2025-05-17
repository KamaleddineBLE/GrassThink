import React, { createContext, useEffect, useRef, useState } from 'react';
import Paho from 'paho-mqtt';

export const MqttContext = createContext();

export const MqttProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState({});
  const clientRef = useRef(null);

  const onMessage = (message) => {
    try {
      console.log(message.payloadString)
      const payload = JSON.parse(message.payloadString);
      const greenhouseId = payload.id || '1';
      setSensorData((prev) => ({ ...prev, [greenhouseId]: payload }));
    } catch (err) {
      console.error("MQTT parsing error", err);
    }
  };

  const connectMqttBroker = () => {
    // WebSocket connection to HiveMQ Cloud (TLS Websocket URL)
    const client = new Paho.Client(
      "621175d07af342118eb57cf44f2fe4ca.s1.eu.hivemq.cloud",
      Number(8884),
      "/mqtt",
      "greenhouse-client-" + Math.random().toString(16).substr(2, 8)
    );

    clientRef.current = client;

    client.onConnectionLost = (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.log("MQTT connection lost. Reconnecting...");
        setTimeout(connectMqttBroker, 5000);
      }
    };

    client.onMessageArrived = onMessage;

    client.connect({
      useSSL: true,
      userName: "kamal", // <-- Replace with your HiveMQ username
      password: "Estinpfe25", // <-- Replace with your HiveMQ password
      onSuccess: () => {
        console.log("MQTT Connected");
        client.subscribe("your/topic"); // <-- Replace with your actual topic
      },
      onFailure: (err) => {
        console.error("MQTT Connection failed", err);
        setTimeout(connectMqttBroker, 5000);
      },
    });
  };

  useEffect(() => {
    connectMqttBroker();
    return () => clientRef.current?.disconnect();
  }, []);

  return (
    <MqttContext.Provider value={{ sensorData }}>
      {children}
    </MqttContext.Provider>
  );
};
