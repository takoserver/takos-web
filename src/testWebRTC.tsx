import { Device } from "mediasoup-client";
import {
  Consumer,
  Producer,
  RtpParameters,
  Transport,
} from "mediasoup-client/types";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

// 型定義
interface PeerInfo {
  displayName?: string;
  hasVideo?: boolean;
  hasAudio?: boolean;
  audioMuted?: boolean;
  [key: string]: unknown;
}

interface ProducerInfo {
  id: string;
  peerId: string;
  kind: string;
}

interface ConsumerInfo {
  id: string;
  producerId: string;
  consumer: Consumer;
  peerId: string;
  kind: string;
}

interface JoinResponseMessage {
  type: "joinResponse";
  routerRtpCapabilities: any;
  sendTransport: any;
  recvTransport: any;
  roomInfo: any;
  producers: ProducerInfo[];
  participants: Array<{ id: string; active: boolean }>;
}

interface TransportConnectedMessage {
  type: "transportConnected";
  transportId: string;
}

interface ProducedMessage {
  type: "produced";
  producerId: string;
  kind: string;
}

interface ConsumedMessage {
  type: "consumed";
  consumer: any;
  producerId: string;
}

interface PeerEventMessage {
  type: "peerEvent";
  event: "joined" | "left" | "newProducer" | "info";
  peerId: string;
  roomId?: string;
  producerId?: string;
  kind?: string;
  info?: Record<string, unknown>;
}

type AnyMessage =
  | JoinResponseMessage
  | TransportConnectedMessage
  | ProducedMessage
  | ConsumedMessage
  | PeerEventMessage;

export function TestWebRTC() {
  // 基本的な接続情報
  const [roomId, setRoomId] = createSignal<string>("test-room");
  const [peerId, setPeerId] = createSignal<string>(
    `user-${Math.random().toString(36).substring(7)}`,
  );
  const [displayName, setDisplayName] = createSignal<string>(
    `ユーザー${Math.floor(Math.random() * 1000)}`,
  );
  const [serverUrl, setServerUrl] = createSignal<string>(
    "ws://192.168.0.32:8000/ws",
  );

  // 接続状態
  const [status, setStatus] = createSignal<string>("切断");
  const [wsConnection, setWsConnection] = createSignal<WebSocket | null>(null);

  // mediasoup関連
  const [device, setDevice] = createSignal<Device | null>(null);
  const [sendTransport, setSendTransport] = createSignal<Transport | null>(
    null,
  );
  const [recvTransport, setRecvTransport] = createSignal<Transport | null>(
    null,
  );
  const [producers, setProducers] = createSignal<ProducerInfo[]>([]);
  const [consumers, setConsumers] = createSignal<ConsumerInfo[]>([]);

  // メディア関連
  const [localStream, setLocalStream] = createSignal<MediaStream | null>(null);
  const [audioMuted, setAudioMuted] = createSignal<boolean>(false);
  const [videoEnabled, setVideoEnabled] = createSignal<boolean>(true);
  const [audioEnabled, setAudioEnabled] = createSignal<boolean>(true);
  const [transportReady, setTransportReady] = createSignal<boolean>(false);
  const [mediaStarting, setMediaStarting] = createSignal<boolean>(false);

  // 参加者情報
  const [remotePeers, setRemotePeers] = createSignal<string[]>([]);
  const [peerInfos, setPeerInfos] = createSignal<Record<string, PeerInfo>>({});

  // オーディオ関連
  const [audioInitialized, setAudioInitialized] = createSignal<boolean>(false);
  const [audioContext, setAudioContext] = createSignal<AudioContext | null>(
    null,
  );

  // DOM参照
  let localVideo: HTMLVideoElement;
  let audioContainer: HTMLElement | null;

  // マイク初期化状態のトラッキングを追加
  const [micInitialized, setMicInitialized] = createSignal<boolean>(false);
  const [micError, setMicError] = createSignal<string | null>(null);
  const [audioDevices, setAudioDevices] = createSignal<MediaDeviceInfo[]>([]);

  onMount(() => {
    // ページ離脱時のクリーンアップ
    window.addEventListener("beforeunload", cleanup);

    // ページ内クリックで音声をアンロック
    document.addEventListener("click", initAudio, { once: false });
    document.addEventListener("touchstart", initAudio, { once: false });

    // オーディオコンテナ作成
    if (!document.getElementById("audio-container")) {
      const container = document.createElement("div");
      container.id = "audio-container";
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "1px";
      container.style.height = "1px";
      container.style.overflow = "hidden";
      document.body.appendChild(container);
      audioContainer = container;
    } else {
      audioContainer = document.getElementById("audio-container");
    }

    // ページロード時に一度試行
    setTimeout(() => {
      initAudio();
    }, 1000);

    // 利用可能なオーディオデバイスを確認
    checkAudioDevices();
  });

  onCleanup(() => {
    cleanup();
    window.removeEventListener("beforeunload", cleanup);
    document.removeEventListener("click", initAudio);
    document.removeEventListener("touchstart", initAudio);

    const auditContextValue = audioContext();
    if (auditContextValue) {
      auditContextValue.close().catch((err) =>
        console.error("AudioContext close error:", err)
      );
    }

    // オーディオ要素を削除
    if (audioContainer) {
      while (audioContainer.firstChild) {
        audioContainer.removeChild(audioContainer.firstChild);
      }
    }
  });

  // 音声初期化関数
  const initAudio = (): void => {
    if (audioInitialized()) return;

    try {
      console.log("🔊 音声初期化を実行...");
      const AudioContextClass = window.AudioContext ||
        (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        setAudioContext(ctx);

        // 無音再生で音声システムを起動
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.001;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(0);
        oscillator.stop(0.5);

        setAudioInitialized(true);
        showNotification("音声が有効化されました");
      }
    } catch (error) {
      console.error("音声初期化エラー:", error);
    }
  };

  // 通知表示
  const showNotification = (
    message: string | null,
    duration: number = 3000,
  ): void => {
    const notificationId = "audio-notification";
    let notification = document.getElementById(notificationId);

    if (!notification) {
      notification = document.createElement("div");
      notification.id = notificationId;
      notification.style.position = "fixed";
      notification.style.bottom = "20px";
      notification.style.right = "20px";
      notification.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      notification.style.color = "white";
      notification.style.padding = "10px 20px";
      notification.style.borderRadius = "4px";
      notification.style.zIndex = "9999";
      document.body.appendChild(notification);
    }

    if (notification) {
      notification.textContent = message;
      notification.style.display = "block";

      setTimeout(() => {
        if (notification) notification.style.display = "none";
      }, duration);
    }
  };

  // クリーンアップ処理
  const cleanup = (): void => {
    const ws = wsConnection();
    if (ws) {
      ws.close();
    }

    const stream = localStream();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    const sTransport = sendTransport();
    if (sTransport) {
      sTransport.close();
    }

    const rTransport = recvTransport();
    if (rTransport) {
      rTransport.close();
    }

    setWsConnection(null);
    setDevice(null);
    setSendTransport(null);
    setRecvTransport(null);
    setLocalStream(null);
    setProducers([]);
    setConsumers([]);
    setTransportReady(false);
    setMediaStarting(false);
    setStatus("切断");
  };

  // WebSocket接続処理
  const connect = async (): Promise<void> => {
    if (wsConnection()) return;

    setStatus("接続中...");

    try {
      const ws = new WebSocket(serverUrl());

      ws.onopen = (): void => {
        setWsConnection(ws);
        setStatus("接続済み");

        // ルーム参加
        ws.send(JSON.stringify({
          type: "join",
          roomId: roomId(),
          peerId: peerId(),
        }));
      };

      // メッセージハンドラ
      ws.onmessage = async (event: MessageEvent): Promise<void> => {
        try {
          const message = JSON.parse(event.data) as AnyMessage;

          // イベント処理を統合
          if (message.type === "peerEvent") {
            handlePeerEvent(message);
          } // ルーム参加レスポンス
          else if (message.type === "joinResponse") {
            await handleJoinResponse(message);
          } // トランスポート接続の通知
          else if (message.type === "transportConnected") {
            handleTransportConnected(message);
          } // プロデューサー作成完了の通知
          else if (message.type === "produced") {
            handleProducerCreated(message);
          } // コンシューマー作成完了の通知
          else if (message.type === "consumed") {
            await handleConsumerCreated(message);
          } // ピア更新完了の通知
          else if (message.type === "peerUpdated") {
            // 特に処理は不要
          } // エラー処理
          else if ((message as any).type === "error") {
            console.error("サーバーエラー:", (message as any).message);
            setStatus(`エラー: ${(message as any).message}`);
          }
        } catch (error) {
          console.error("メッセージ処理エラー:", error);
        }
      };

      ws.onclose = (): void => {
        setStatus("切断");
        cleanup();
      };

      ws.onerror = (): void => {
        setStatus("接続エラー");
      };
    } catch (error: any) {
      setStatus(`接続エラー: ${error.message}`);
    }
  };

  // 統合型ピアイベントハンドラ
  const handlePeerEvent = (message: PeerEventMessage): void => {
    const event = message.event;
    const remotePeerId = message.peerId;

    // イベントタイプに基づいて処理
    switch (event) {
      case "joined":
        // 新しいピアが参加
        setRemotePeers((current) => [...current, remotePeerId]);
        break;

      case "left":
        // ピアが退出
        setRemotePeers((current) => current.filter((p) => p !== remotePeerId));
        break;

      case "info":
        // ピア情報の更新
        setPeerInfos((prev) => ({
          ...prev,
          [remotePeerId]: message.info as PeerInfo || {},
        }));
        break;

      case "newProducer":
        // 新しいプロデューサー通知
        const producerId = message.producerId;
        const kind = message.kind;

        if (!producerId || !kind) return;

        // 既に購読しているか確認
        const existingProducer = producers().find((p) => p.id === producerId);
        if (existingProducer) return;

        // 新しいプロデューサーを記録
        setProducers((current) => [...current, {
          id: producerId,
          peerId: remotePeerId,
          kind,
        }]);

        // 自動的に購読を開始
        consumeProducer(producerId, kind);
        break;
    }
  };

  // ルーム参加レスポンス処理
  const handleJoinResponse = async (
    message: JoinResponseMessage,
  ): Promise<void> => {
    try {
      console.log("ルーム参加レスポンス受信:");

      // 1. mediasoup Deviceの初期化
      const newDevice = new Device();
      await newDevice.load({
        routerRtpCapabilities: message.routerRtpCapabilities,
      });
      setDevice(newDevice);
      console.log("mediasoup Device初期化成功");

      // 2. トランスポート初期化 - 送信
      await initializeSendTransport(message.sendTransport);

      // 3. トランスポート初期化 - 受信
      await initializeRecvTransport(message.recvTransport);

      // 4. 現在のプロデューサー情報を保存
      setProducers(message.producers || []);

      // 5. 現在の参加者情報を保存
      const activeParticipants = message.participants || [];
      setRemotePeers(activeParticipants.map((p) => p.id));

      // すべての準備完了
      setTransportReady(true);
      setStatus("接続準備完了");

      // 既存のプロデューサーを自動購読
      for (const producer of message.producers || []) {
        // 自分のプロデューサーは除外
        if (producer.peerId !== peerId()) {
          consumeProducer(producer.id, producer.kind);
        }
      }

      // 保留中のメディア開始があれば実行
      if (mediaStarting()) {
        console.log("保留中のメディア開始を実行");
        startLocalMedia();
      }

      // 初回のピア情報を送信
      updatePeerInfo();
    } catch (error) {
      console.error("参加処理エラー:", error);
      setStatus(`初期化エラー: ${(error as Error).message}`);
    }
  };

  // メディア処理関連
  const startLocalMedia = async (): Promise<void> => {
    if (!transportReady()) {
      setMediaStarting(true);
      setStatus("接続準備中...");
      return;
    }

    try {
      setStatus("カメラ・マイク取得中...");

      // 制約を詳細に指定
      const constraints: MediaStreamConstraints = {
        video: videoEnabled()
          ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
          : false,
        audio: audioEnabled()
          ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
          : false,
      };

      console.log("メディア取得開始:", constraints);

      if (!constraints.video && !constraints.audio) {
        throw new Error("カメラかマイクを有効にしてください");
      }

      // オーディオコンテキストを事前に初期化
      if (audioEnabled() && !audioContext()) {
        const AudioContextClass = window.AudioContext ||
          (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === "suspended") {
            await ctx.resume();
          }
          setAudioContext(ctx);
        }
      }

      // メディア取得
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // メディアトラック情報出力
      stream.getTracks().forEach((track) => {
        console.log(
          `トラック取得: ${track.kind} - ${track.label} (enabled: ${track.enabled})`,
        );
      });

      setLocalStream(stream);

      // ローカルビデオ表示
      if (
        localVideo && constraints.video && stream.getVideoTracks().length > 0
      ) {
        localVideo.srcObject = stream;
        await localVideo.play().catch(console.error);
      }

      // メディア送信処理
      const sTransport = sendTransport();
      if (!sTransport) {
        throw new Error("送信用トランスポートがありません");
      }

      // ビデオ送信
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        await sTransport.produce({ track: videoTrack });
      }

      // オーディオ送信
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        await sTransport.produce({ track: audioTrack });
      }

      // ピア情報更新
      updatePeerInfo();
    } catch (error) {
      console.error("メディア取得エラー:", error);
      setStatus(`エラー: ${(error as Error).message}`);
      setMediaStarting(false);

      // シンプルなエラーメッセージ表示
      showNotification(`メディア取得エラー: ${(error as Error).name}`);
    }
  };

  // 送信用トランスポート初期化のヘルパー関数
  const initializeSendTransport = async (transport: any): Promise<void> => {
    if (!transport || !device()) return;

    console.log("送信用トランスポート作成開始");
    const newSendTransport = device()!.createSendTransport({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
    });

    newSendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log("送信用トランスポートconnectイベント", dtlsParameters);
          const ws = wsConnection();
          if (!ws) {
            errback(new Error("WebSocket connection not established"));
            return;
          }

          ws.send(JSON.stringify({
            type: "connectTransport",
            roomId: roomId(),
            peerId: peerId(),
            transportId: transport.id,
            dtlsParameters,
          }));

          // Callbackは transportConnected メッセージを受け取った後に実行
          (newSendTransport as any).connectPromiseCallback = callback;
          (newSendTransport as any).connectPromiseErrback = errback;
        } catch (error) {
          console.error("送信用トランスポート接続エラー:", error);
          errback(error as Error);
        }
      },
    );

    newSendTransport.on(
      "produce",
      async ({ kind, rtpParameters }, callback, errback) => {
        try {
          console.log(`プロデュース開始: ${kind}`);
          const ws = wsConnection();
          if (!ws) {
            errback(new Error("WebSocket connection not established"));
            return;
          }

          ws.send(JSON.stringify({
            type: "produce",
            roomId: roomId(),
            peerId: peerId(),
            transportId: transport.id,
            kind,
            rtpParameters,
          }));

          // Callbackは producerCreated メッセージを受け取った後に実行
          (newSendTransport as any).producePromiseCallback = callback;
          (newSendTransport as any).producePromiseKind = kind;
        } catch (error) {
          console.error("プロデューサー作成エラー:", error);
          errback(error as Error);
        }
      },
    );

    // ICE接続状態の監視を追加
    newSendTransport.on("connectionstatechange", (state: string) => {
      console.log(`送信用トランスポート接続状態変更: ${state}`);
    });

    setSendTransport(newSendTransport);
    console.log("送信用トランスポート作成成功:", newSendTransport.id);
  };

  // 受信用トランスポート初期化のヘルパー関数
  const initializeRecvTransport = async (transport: any): Promise<void> => {
    if (!transport || !device()) return;

    console.log("受信用トランスポート作成開始");
    const newRecvTransport = device()!.createRecvTransport({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
    });

    newRecvTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log("受信用トランスポートconnectイベント");
          const ws = wsConnection();
          if (!ws) {
            errback(new Error("WebSocket connection not established"));
            return;
          }

          ws.send(JSON.stringify({
            type: "connectTransport",
            roomId: roomId(),
            peerId: peerId(),
            transportId: transport.id,
            dtlsParameters,
          }));

          (newRecvTransport as any).connectPromiseCallback = callback;
          (newRecvTransport as any).connectPromiseErrback = errback;
        } catch (error) {
          console.error("受信用トランスポート接続エラー:", error);
          errback(error as Error);
        }
      },
    );

    // ICE接続状態の監視を追加
    newRecvTransport.on("connectionstatechange", (state: string) => {
      console.log(`受信用トランスポート接続状態変更: ${state}`);
    });

    setRecvTransport(newRecvTransport);
    console.log("受信用トランスポート作成成功:", newRecvTransport.id);
  };

  const handleTransportConnected = (
    message: TransportConnectedMessage,
  ): void => {
    const transportId = message.transportId;
    const sTransport = sendTransport();
    const rTransport = recvTransport();

    // 送信用トランスポートの接続コールバック実行
    if (
      sTransport && sTransport.id === transportId &&
      (sTransport as any).connectPromiseCallback
    ) {
      (sTransport as any).connectPromiseCallback();
      delete (sTransport as any).connectPromiseCallback;
      delete (sTransport as any).connectPromiseErrback;
    }

    // 受信用トランスポートの接続コールバック実行
    if (
      rTransport && rTransport.id === transportId &&
      (rTransport as any).connectPromiseCallback
    ) {
      (rTransport as any).connectPromiseCallback();
      delete (rTransport as any).connectPromiseCallback;
      delete (rTransport as any).connectPromiseErrback;
    }
  };

  const handleProducerCreated = (message: ProducedMessage): void => {
    const producerId = message.producerId;
    const sTransport = sendTransport();

    if (sTransport && (sTransport as any).producePromiseCallback) {
      // 種類情報も付与されている
      (sTransport as any).producePromiseCallback({ id: producerId });

      delete (sTransport as any).producePromiseCallback;
      delete (sTransport as any).producePromiseKind;
    }
  };

  const handleConsumerCreated = async (
    message: ConsumedMessage,
  ): Promise<void> => {
    const consumer = message.consumer;
    if (!consumer) {
      console.error("コンシューマー情報が空です");
      return;
    }

    console.log(`コンシューマー作成: ${consumer.id}, タイプ: ${consumer.kind}`);

    try {
      // mediasoup-clientのコンシューマーオブジェクトを作成
      const rTransport = recvTransport();
      const deviceObj = device();

      if (!rTransport || !deviceObj) {
        console.error("トランスポートまたはデバイスが初期化されていません");
        return;
      }

      const newConsumer = await rTransport.consume({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });

      // コンシューマーリストに追加
      setConsumers((prev) => {
        // 重複チェック
        const exists = prev.some((c) => c.id === consumer.id);
        if (exists) return prev;

        const sourcePeerId = consumer.producerId.split("-")[0]; // IDからピアIDを抽出
        console.log(`受信元ピア: ${sourcePeerId}, 種類: ${consumer.kind}`);

        // リストに追加
        return [...prev, {
          id: consumer.id,
          producerId: consumer.producerId,
          consumer: newConsumer,
          peerId: sourcePeerId,
          kind: consumer.kind,
        }];
      });

      // ストリームの作成
      const stream = new MediaStream();
      stream.addTrack(newConsumer.track);
      // メディア種類に応じた処理
      if (consumer.kind === "video") {
        handleVideoConsumer(consumer.id, stream);
      } else if (consumer.kind === "audio") {
        handleAudioConsumer(
          consumer.id,
          stream,
          consumer.producerId.split("-")[0],
        );
      }
    } catch (error) {
      console.error(`コンシューマー作成エラー: ${consumer.id}`, error);
    }
  };

  // ビデオ消費者の処理
  const handleVideoConsumer = async (
    consumerId: string,
    stream: MediaStream,
  ): Promise<void> => {
    // ビデオ要素の関連付けは最大5回試行
    for (let i = 0; i < 5; i++) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, i === 0 ? 100 : 300)
      );

      const videoElem = document.getElementById(
        `consumer-video-${consumerId}`,
      ) as HTMLVideoElement | null;
      if (videoElem) {
        try {
          videoElem.srcObject = stream;
          await videoElem.play();
          console.log(`📹 ビデオ再生開始: ${consumerId}`);
          break;
        } catch (error) {
          console.warn(
            `ビデオ再生エラー(試行 ${i + 1}/5): ${consumerId}`,
            error,
          );
        }
      } else {
        console.log(
          `ビデオ要素がまだ作成されていません: consumer-video-${consumerId}`,
        );
      }
    }
  };

  // 音声消費者の処理
  const handleAudioConsumer = (
    consumerId: string,
    stream: MediaStream,
    sourcePeerId: string,
  ): void => {
    console.log(`🎧 音声処理開始: ${consumerId} (元: ${sourcePeerId})`);

    // 1. 通常のHTML Audio要素を作成
    try {
      if (!audioContainer) {
        console.error("オーディオコンテナが見つかりません");
        return;
      }

      // 既存の要素を確認
      let audioElem = document.getElementById(
        `consumer-audio-${consumerId}`,
      ) as HTMLAudioElement;
      if (!audioElem) {
        audioElem = document.createElement("audio");
        audioElem.id = `consumer-audio-${consumerId}`;
        audioElem.autoplay = true;
        audioElem.controls = false; // デバッグの場合はtrueに
        audioElem.dataset.peerId = sourcePeerId;
        audioContainer.appendChild(audioElem);
      }

      // ストリームを設定
      audioElem.srcObject = stream;

      // 音声の再生を試みる
      console.log(`🔈 音声再生試行: ${consumerId}`);
      const playPromise = audioElem.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log(`✅ 音声再生開始: ${consumerId}`))
          .catch((error) => {
            console.warn(`⚠️ 自動再生が拒否されました: ${consumerId}`, error);
            // 自動再生ポリシーによるブロックの場合
            showNotification("🔊 画面をクリックして音声を有効化してください");
          });
      }
    } catch (error) {
      console.error(`オーディオ要素の作成エラー: ${consumerId}`, error);
    }

    // 2. WebAudio APIを使用した代替手法
    try {
      const ctx = audioContext();
      if (ctx) {
        const source = ctx.createMediaStreamSource(stream);
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0; // 通常の音量

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        console.log(`🔊 WebAudio接続完了: ${consumerId}`);
      }
    } catch (error) {
      console.error(`WebAudio接続エラー: ${consumerId}`, error);
    }
  };

  // 自分のピア情報を送信する関数
  const updatePeerInfo = (): void => {
    const ws = wsConnection();
    if (!ws) return;

    ws.send(JSON.stringify({
      type: "updatePeer",
      roomId: roomId(),
      peerId: peerId(),
      info: {
        displayName: displayName(),
        hasVideo: localStream()
          ? localStream()!.getVideoTracks().length > 0
          : false,
        hasAudio: localStream()
          ? localStream()!.getAudioTracks().length > 0
          : false,
        audioMuted: audioMuted(),
      },
    }));
  };

  const toggleAudioMute = (): void => {
    const stream = localStream();
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const newState = !audioMuted();
    setAudioMuted(newState);

    audioTrack.enabled = !newState;
    updatePeerInfo();
  };

  // メディア消費リクエスト
  const consumeProducer = async (
    producerId: string,
    kind: string,
  ): Promise<void> => {
    const rTransport = recvTransport();
    const deviceObj = device();
    const ws = wsConnection();

    if (!rTransport || !deviceObj || !ws || !producerId) {
      console.error("消費に必要なオブジェクトがありません");
      return;
    }

    console.log(`プロデューサー消費リクエスト: ${producerId} (${kind})`);

    try {
      // サーバーにコンシューマー作成リクエスト
      ws.send(JSON.stringify({
        type: "consume",
        roomId: roomId(),
        peerId: peerId(),
        transportId: rTransport.id,
        producerId: producerId,
        rtpCapabilities: deviceObj.rtpCapabilities,
      }));
    } catch (error) {
      console.error(`消費リクエストエラー: ${(error as Error).message}`);
    }
  };

  // オーディオデバイス確認関数
  const checkAudioDevices = async (): Promise<void> => {
    try {
      // 権限を確認
      const permissions = await navigator.permissions.query({
        name: "microphone" as any,
      });
      console.log(`マイク権限状態: ${permissions.state}`);

      // デバイス一覧を取得
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((device) => device.kind === "audioinput");
      setAudioDevices(mics);

      console.log(`検出したマイク: ${mics.length}台`);
      mics.forEach((mic, i) => {
        console.log(`マイク${i + 1}: ${mic.label || "(ラベルなし)"}`);
      });

      if (mics.length === 0) {
        setMicError("マイクデバイスが検出されませんでした。");
      }
    } catch (err) {
      console.error("マイク確認エラー:", err);
      setMicError(`マイク確認エラー: ${(err as Error).message}`);
    }
  };

  // マイク専用のテスト機能
  const testMicrophone = async (): Promise<void> => {
    try {
      setMicError(null);
      console.log("マイクテスト開始...");

      // マイクのみを取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      console.log(
        "マイク取得成功:",
        stream.getAudioTracks().map((t) => t.label).join(", "),
      );

      // トラックの状態確認
      const track = stream.getAudioTracks()[0];
      if (track) {
        console.log(
          `マイクトラック: ${track.label} (enabled: ${track.enabled}, muted: ${track.muted})`,
        );

        // メーターで音声レベル表示
        const audioCtx =
          new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // アクティブ度合いを確認するために短時間待機
        setTimeout(() => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((acc, val) => acc + val, 0) /
            dataArray.length;
          console.log(`マイク音量レベル: ${average.toFixed(2)}/255`);

          // メーターや状態表示をリセット
          source.disconnect();
          audioCtx.close();
          stream.getTracks().forEach((track) => track.stop());

          setMicInitialized(true);
          showNotification("マイクテスト成功 ✓");
        }, 1000);
      } else {
        setMicError("マイクトラックが取得できませんでした");
        setMicInitialized(false);
      }
    } catch (err) {
      console.error("マイクテストエラー:", err);
      setMicError((err as Error).message || "マイクテスト失敗");
      setMicInitialized(false);

      // 詳細なエラーメッセージ
      if (
        (err as Error).name === "NotFoundError" ||
        (err as Error).name === "DevicesNotFoundError"
      ) {
        setMicError("マイクが見つかりません。デバイスを接続してください。");
      } else if (
        (err as Error).name === "NotAllowedError" ||
        (err as Error).name === "PermissionDeniedError"
      ) {
        setMicError(
          "マイクへのアクセス許可が必要です。ブラウザの設定を確認してください。",
        );
      } else if (
        (err as Error).name === "NotReadableError" ||
        (err as Error).name === "AbortError"
      ) {
        setMicError(
          "マイクが他のアプリケーションで使用中か、ハードウェアエラーが発生しています。",
        );
      }
    }
  };

  // シンプルなUI
  return (
    <div class="webrtc-container">
      <h1>Takos WebRTC</h1>

      <div class="status-bar">
        状態: {status()}
      </div>

      <Show when={!wsConnection()}>
        <div class="setup-panel">
          <div class="form-group">
            <label>ルームID:</label>
            <input
              type="text"
              value={roomId()}
              onInput={(e) => setRoomId(e.target.value)}
              placeholder="ルーム名を入力"
            />
          </div>

          <div class="form-group">
            <label>表示名:</label>
            <input
              type="text"
              value={displayName()}
              onInput={(e) => setDisplayName(e.target.value)}
              placeholder="あなたの名前"
            />
          </div>

          <div class="form-group">
            <label>サーバー:</label>
            <input
              type="text"
              value={serverUrl()}
              onInput={(e) => setServerUrl(e.target.value)}
            />
          </div>

          <div class="media-options">
            <label>
              <input
                type="checkbox"
                checked={videoEnabled()}
                onChange={(e) => setVideoEnabled(e.target.checked)}
              />
              カメラを使用
            </label>

            <label>
              <input
                type="checkbox"
                checked={audioEnabled()}
                onChange={(e) => setAudioEnabled(e.target.checked)}
              />
              マイクを使用
            </label>
          </div>

          {/* マイク情報表示を追加 */}
          <div class="mic-status">
            <div class="mic-info">
              <span>
                マイク: {audioDevices().length > 0
                  ? `${audioDevices().length}台検出`
                  : "検出されませんでした"}
              </span>
              <button
                onClick={testMicrophone}
                class="mic-test-button"
                title="マイクへのアクセスをテストします"
              >
                マイクテスト
              </button>
            </div>

            <Show when={micError()}>
              <div class="mic-error">⚠️ {micError()}</div>
            </Show>

            <Show when={micInitialized()}>
              <div class="mic-success">✓ マイク使用可能</div>
            </Show>
          </div>

          <button class="primary-button" onClick={connect}>
            参加
          </button>
        </div>
      </Show>

      <Show when={!!wsConnection()}>
        <div class="call-controls">
          <div class="participant-info">
            参加者: {remotePeers().length + 1}人
            {remotePeers().length > 0 && (
              <span class="peer-names">
                ({remotePeers().map((p) => peerInfos()[p]?.displayName || p)
                  .join(", ")})
              </span>
            )}
          </div>

          <div class="control-buttons">
            <Show when={!localStream() && !mediaStarting()}>
              <button
                onClick={startLocalMedia}
                disabled={!transportReady()}
                class="primary-button"
              >
                {transportReady() ? "カメラ・マイク開始" : "接続準備中..."}
              </button>
            </Show>

            <Show
              when={!!localStream() && !!localStream().getAudioTracks().length}
            >
              <button
                onClick={toggleAudioMute}
                class={audioMuted() ? "warning-button" : "success-button"}
              >
                {audioMuted() ? "ミュート解除" : "ミュート"}
              </button>
            </Show>

            <button onClick={initAudio} class="secondary-button">
              音声初期化
            </button>

            {/* マイクテストボタン */}
            <button onClick={testMicrophone} class="secondary-button">
              マイク確認
            </button>

            <button onClick={cleanup} class="warning-button">
              退室
            </button>
          </div>
        </div>

        <div class="video-area">
          <div class="local-video">
            <h3>自分の映像</h3>
            <div class="video-wrapper">
              <video ref={localVideo} autoplay muted playsInline></video>
              <div class="name-tag">{displayName()}</div>
            </div>
          </div>

          <div class="remote-videos">
            <h3>参加者</h3>
            <div class="remote-grid">
              <For each={remotePeers()}>
                {(remotePeerId) => {
                  const videoConsumer = consumers().find((c) =>
                    c.kind === "video" && c.peerId === remotePeerId
                  );

                  const peerName = peerInfos()[remotePeerId]?.displayName ||
                    remotePeerId;
                  const hasAudio = peerInfos()[remotePeerId]?.hasAudio || false;
                  const audioMuted = peerInfos()[remotePeerId]?.audioMuted ||
                    false;

                  return (
                    <div class="participant-tile">
                      <div class="video-wrapper">
                        {videoConsumer
                          ? (
                            <video
                              id={`consumer-video-${videoConsumer.id}`}
                              autoplay
                              playsinline
                            >
                            </video>
                          )
                          : (
                            <div class="no-video">
                              <div class="avatar">
                                {peerName.substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                          )}
                        <div class="name-tag">
                          {peerName}
                          {hasAudio && (
                            <span class={audioMuted ? "mic-off" : "mic-on"}>
                              {audioMuted ? "🔇" : "🔊"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>

      {/* 音声初期化インジケータ */}
      <Show when={!audioInitialized()}>
        <div class="audio-status-warning">
          ⚠️ 音声が無効です - 「音声初期化」ボタンをクリックしてください
        </div>
      </Show>

      <style>
        {`
        .webrtc-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .status-bar {
          background: #f8f9fa;
          padding: 10px 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-weight: 500;
          text-align: center;
        }
        
        .setup-panel {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 600px;
          margin: 0 auto;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .media-options {
          display: flex;
          gap: 20px;
          margin: 15px 0;
        }
        
        .media-options label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        
        button {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .primary-button {
          background: #4285f4;
          color: white;
          font-size: 16px;
          width: 100%;
        }
        
        .primary-button:hover {
          background: #3367d6;
        }
        
        .secondary-button {
          background: #f8f9fa;
          color: #333;
        }
        
        .warning-button {
          background: #dc3545;
          color: white;
        }
        
        .success-button {
          background: #28a745;
          color: white;
        }
        
        .call-controls {
          background: #fff;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .participant-info {
          margin-bottom: 15px;
          font-weight: 500;
        }
        
        .peer-names {
          font-weight: normal;
          margin-left: 5px;
          color: #555;
        }
        
        .control-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .video-area {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        .local-video h3, .remote-videos h3 {
          margin-top: 0;
          margin-bottom: 15px;
          font-weight: 500;
        }
        
        .video-wrapper {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 4/3;
        }
        
        .video-wrapper video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .name-tag {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.5);
          color: white;
          padding: 5px 10px;
          display: flex;
          justify-content: space-between;
        }
        
        .remote-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 15px;
        }
        
        .participant-tile {
          border-radius: 8px;
          overflow: hidden;
        }
        
        .no-video {
          width: 100%;
          height: 100%;
          background: #eee;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #6c757d;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
        }
        
        .mic-on, .mic-off {
          margin-left: 5px;
        }
        
        .audio-status-warning {
          background: #fff3cd;
          color: #856404;
          padding: 10px 15px;
          text-align: center;
          border-radius: 4px;
          margin-top: 20px;
        }
        
        .mic-status {
          margin-top: 15px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        
        .mic-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .mic-test-button {
          padding: 5px 10px;
          background: #6c757d;
          color: white;
          font-size: 12px;
        }
        
        .mic-error {
          color: #dc3545;
          margin-top: 5px;
          font-size: 14px;
        }
        
        .mic-success {
          color: #28a745;
          margin-top: 5px;
          font-size: 14px;
        }
        
        @media (min-width: 768px) {
          .video-area {
            grid-template-columns: 300px 1fr;
          }
        }
        `}
      </style>
    </div>
  );
}
