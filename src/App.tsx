import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { Buffer } from "buffer";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    let unsub: UnlistenFn;
    (async () => {
      unsub = await listen("media_updated", () => {
        console.log("media updated");
      });
    })();
    return () => {
      unsub && unsub();
    };
  }, []);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
    const data: any = await invoke("get_media").catch(console.log);
    console.log(data);
    // setImage(
    //   `data:image/png;base64,${Buffer.from(data.thumbnail).toString("base64")}`
    // );
    await invoke("media_action", {
      playerId: data[0].player_id,
      action: "position",
      position: 10000,
    }).catch(console.log);
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}>
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
        {image && <img src={image} />}
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
