import { render } from "solid-js/web";
import App from "./App";
import { Router } from "@solidjs/router";
import "./styles/loading.css";
import { TestWebRTC } from "./testWebRTC";
const root = document.getElementById("root");

const routes = [
  {
    path: "/",
    component: () => <App />,
  },
  {
    path: "/login",
    component: () => <App />,
  },
  {
    path: "/home",
    component: () => <App page="home" />,
  },
  {
    path: "/home/:roomId",
    component: () => <App page="home" />,
  },
  {
    path: "/talk",
    component: () => <App page="talk" />,
  },
  {
    path: "/talk/:roomId",
    component: () => <App page="talk" />,
  },
  {
    path: "/friend",
    component: () => <App page="friend" />,
  },
  {
    path: "/friend/:roomId",
    component: () => <App page="friend" />,
  },
  {
    path: "/notification",
    component: () => <App page="notification" />,
  },
  {
    path: "/notification/:roomId",
    component: () => <App page="notification" />,
  },
  {
    path: "/test",
    component: () => <TestWebRTC />,
  },
];

render(() => <Router>{routes}</Router>, root!);

export default App;

import { createEffect, createSignal, For } from "solid-js";

export function Test() {
  // デバイスリストと選択状態を管理するシグナル
  const [audioInputs, setAudioInputs] = createSignal<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = createSignal<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = createSignal<string>("");
  const [selectedOutput, setSelectedOutput] = createSignal<string>("");
  const [error, setError] = createSignal<string>("");
  const [message, setMessage] = createSignal<string>("");

  // デバイスリストを取得する関数
  async function getDevices() {
    try {
      // マイクの使用許可を得る（これがないとデバイス名が「Default」などになる）
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // デバイス一覧を取得
      const devices = await navigator.mediaDevices.enumerateDevices();

      // マイクとスピーカーを分類
      const inputs = devices.filter((device) => device.kind === "audioinput");
      const outputs = devices.filter((device) => device.kind === "audiooutput");

      setAudioInputs(inputs);
      setAudioOutputs(outputs);

      // デフォルト選択
      if (inputs.length > 0) setSelectedInput(inputs[0].deviceId);
      if (outputs.length > 0) setSelectedOutput(outputs[0].deviceId);

      setMessage("デバイスリストを更新しました");
    } catch (err) {
      setError(
        `デバイスの取得に失敗しました: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  // テスト音を再生する関数
  async function playTestSound() {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // サイン波で440Hz（ラの音）を生成
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // 音量調整

      oscillator.connect(gainNode);

      // HTMLAudioElementを使用して出力デバイスを指定
      if (window.AudioContext && "setSinkId" in HTMLAudioElement.prototype) {
        const dest = audioContext.createMediaStreamDestination();
        gainNode.connect(dest);

        const audio = new Audio();
        audio.srcObject = dest.stream;

        // @ts-ignore - setSinkIdはまだ標準のTypeScript型定義に含まれていない
        await audio.setSinkId(selectedOutput());
        await audio.play();
      } else {
        // setSinkIdがサポートされていない場合はデフォルト出力
        gainNode.connect(audioContext.destination);
        setMessage(
          "注意: お使いのブラウザは出力デバイスの選択に対応していません",
        );
      }

      // 音を鳴らして0.5秒後に停止
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);

      // リソース解放
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
        audioContext.close();
      }, 600);
    } catch (err) {
      setError(
        `テスト音の再生に失敗しました: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  // コンポーネント初期化時にデバイスリストを取得
  createEffect(() => {
    getDevices();

    // デバイス変更を検知してリストを更新
    navigator.mediaDevices.addEventListener("devicechange", getDevices);

    // クリーンアップ
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getDevices);
    };
  });

  return (
    <div class="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 class="text-2xl font-bold mb-6 text-center text-gray-800">
        音声デバイス設定
      </h1>

      {error() && (
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p>{error()}</p>
        </div>
      )}

      {message() && (
        <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded">
          <p>{message()}</p>
        </div>
      )}

      <div class="mb-6">
        <label
          class="block text-gray-700 text-sm font-bold mb-2"
          for="microphone"
        >
          マイク:
        </label>
        <select
          id="microphone"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedInput()}
          onChange={(e) => setSelectedInput(e.target.value)}
        >
          <For each={audioInputs()}>
            {(device) => (
              <option value={device.deviceId}>
                {device.label || `マイク ${device.deviceId.substring(0, 5)}...`}
              </option>
            )}
          </For>
        </select>
      </div>

      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="speaker">
          スピーカー:
        </label>
        <select
          id="speaker"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedOutput()}
          onChange={(e) => setSelectedOutput(e.target.value)}
        >
          <For each={audioOutputs()}>
            {(device) => (
              <option value={device.deviceId}>
                {device.label ||
                  `スピーカー ${device.deviceId.substring(0, 5)}...`}
              </option>
            )}
          </For>
        </select>
      </div>

      <div class="flex space-x-4">
        <button
          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
          onClick={playTestSound}
        >
          スピーカーテスト
        </button>

        <button
          class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-200"
          onClick={getDevices}
        >
          デバイス更新
        </button>
      </div>
    </div>
  );
}
