import { useCallback, useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import useWebSocket, { ReadyState } from "react-use-websocket";

function App() {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8765");
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [userInMachine, setUserInMachine] = useState<string[]>([]);
  const [curMachine, setCurMachine] = useState("");

  useEffect(() => {
    if (lastMessage == null) return;
    console.log(lastMessage.data);
    try {
      const json = JSON.parse(lastMessage.data);
      console.log(json);
      if (json["event"] == "editors") {
        setUserInMachine(json["data"]["editors"]);
      }
    } catch (e) {}
  }, [lastMessage, setUserInMachine]);

  const handleClickSendMessage = useCallback(
    () =>
      sendMessage(
        JSON.stringify({
          event: "machine:edit",
          data: "abcc",
        })
      ),
    []
  );

  const switchMachine = (s: string) => {
    sendMessage(
      JSON.stringify({
        event: "machine:edit",
        data: s,
      })
    );
    setCurMachine(s);
  };

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  return (
    <div>
      <div>Current Machine = {curMachine}</div>
      <button onClick={() => switchMachine("machine_wow")}>machine_wow</button>
      <button onClick={() => switchMachine("machine_test")}>
        machine_test
      </button>
      <button onClick={() => switchMachine("machine_super")}>
        machine_super
      </button>
      {/* <button
        onClick={handleClickSendMessage}
        disabled={readyState !== ReadyState.OPEN}
      >
        Click Me to send 'Hello'
      </button> */}
      <span>The WebSocket is currently {connectionStatus}</span>
      <ul>
        {userInMachine.map((e) => (
          <li>{e}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
