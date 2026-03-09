import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const useP2P = (initialChannelId: string, onData?: (data: Uint8Array) => void, onConnect?: (isHost: boolean, send: (data: Uint8Array) => void) => void) => {
  const [peerId] = useState(() => Math.random().toString(36).substr(2, 6).toUpperCase());
  const [channelId, _setChannelId] = useState(initialChannelId);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "failed">("idle");
  const [isHost, setIsHost] = useState(false);
  
  const channelRef = useRef<any>(null);
  const channelIdRef = useRef(initialChannelId);
  const isHostRef = useRef(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

  const onDataRef = useRef(onData);
  const onConnectRef = useRef(onConnect);
  
  useEffect(() => { onDataRef.current = onData; }, [onData]);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);

  const setChannelId = (id: string) => {
    channelIdRef.current = id;
    _setChannelId(id);
  };

  const sendSignalingMessage = useCallback(async (type: string, payload: any, targetId?: string) => {
    if (!channelRef.current) return;
    
    console.log(`P2P [SIGNAL]: Sending ${type} to ${targetId || "ALL"}`);
    await channelRef.current.send({
      type: "broadcast",
      event: "signal",
      payload: {
        sender_id: peerId,
        type,
        data: payload,
        targetId,
      },
    });
  }, [peerId]);

  const processIceQueue = useCallback(async () => {
    if (!pc.current || !pc.current.remoteDescription) return;
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await pc.current.addIceCandidate(candidate);
        } catch (e) {
          console.warn("P2P [ICE]: Error adding queued candidate", e);
        }
      }
    }
  }, []);

  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dataChannel.current = dc;
    dc.onopen = () => {
      console.log("P2P [CONNECTED]: Data Channel Opened");
      setStatus("connected");
      if (onConnectRef.current) onConnectRef.current(isHostRef.current, sendData);
    };
    dc.onmessage = (event) => {
      if (onDataRef.current) onDataRef.current(new Uint8Array(event.data));
    };
    dc.onclose = () => {
      console.log("P2P [CLOSED]: Data Channel Closed");
      setStatus("idle");
    };
    dc.onerror = (e) => {
      console.error("P2P [ERROR]: Data Channel Error", e);
      setStatus("failed");
    };
  }, []);

  const initPeer = useCallback(() => {
    if (pc.current) pc.current.close();
    const peer = new RTCPeerConnection(ICE_SERVERS);
    pc.current = peer;

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage("ice-candidate", event.candidate);
      }
    };

    peer.onconnectionstatechange = () => {
      console.log("P2P [STATE]:", peer.connectionState);
      if (peer.connectionState === "connected") setStatus("connected");
      if (peer.connectionState === "failed") setStatus("failed");
    };

    return peer;
  }, [sendSignalingMessage]);

  const startHost = useCallback((id: string) => {
    setChannelId(id);
    setIsHost(true);
    isHostRef.current = true;
    setStatus("connecting");
    console.log("P2P [HOST]: Starting session", id);
  }, []);

  const startJoin = useCallback((id: string) => {
    setChannelId(id);
    setIsHost(false);
    isHostRef.current = false;
    setStatus("connecting");
    console.log("P2P [JOINER]: Joining session", id);
  }, []);

  useEffect(() => {
    const currentId = channelId;
    if (!currentId) return;

    console.log("P2P [REALTIME]: Subscribing to", currentId);
    const channel = supabase.channel(`signaling:${currentId}`, {
      config: { broadcast: { self: false } }
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "signal" }, async ({ payload }) => {
        const { sender_id, type, data, targetId } = payload;
        if (sender_id === peerId) return;
        if (targetId && targetId !== peerId) return;

        console.log(`P2P [SIGNAL]: Received ${type} from ${sender_id}`);

        try {
          if (type === "join-request" && isHostRef.current) {
            const peer = initPeer();
            const dc = peer.createDataChannel("ascii-sync");
            setupDataChannel(dc);
            
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            await sendSignalingMessage("offer", offer, sender_id);
          } 
          else if (type === "offer" && !isHostRef.current) {
            const peer = initPeer();
            peer.ondatachannel = (event) => setupDataChannel(event.channel);
            await peer.setRemoteDescription(new RTCSessionDescription(data));
            await processIceQueue();
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await sendSignalingMessage("answer", answer, sender_id);
          } 
          else if (type === "answer" && pc.current) {
            if (pc.current.signalingState === "have-local-offer") {
              await pc.current.setRemoteDescription(new RTCSessionDescription(data));
              await processIceQueue();
            }
          } 
          else if (type === "ice-candidate" && pc.current) {
            const candidate = new RTCIceCandidate(data);
            if (pc.current.remoteDescription) {
              await pc.current.addIceCandidate(candidate);
            } else {
              iceCandidatesQueue.current.push(candidate);
            }
          }
        } catch (err) {
          console.error("P2P [SIGNAL ERROR]:", err);
        }
      })
      .subscribe((subStatus) => {
        console.log("P2P [REALTIME] Status:", subStatus);
        if (subStatus === "SUBSCRIBED" && !isHostRef.current) {
          // Joiners send their request immediately upon subscription
          sendSignalingMessage("join-request", {});
        }
      });

    return () => {
      console.log("P2P [REALTIME]: Cleaning up channel", currentId);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelId, peerId, initPeer, setupDataChannel, sendSignalingMessage, processIceQueue]);

  const sendData = (data: Uint8Array) => {
    if (dataChannel.current?.readyState === "open") {
      dataChannel.current.send(data);
    }
  };

  return { peerId, channelId, status, isHost, startHost, startJoin, sendData };
};
