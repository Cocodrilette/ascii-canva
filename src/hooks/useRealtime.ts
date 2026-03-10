import { useCallback, useEffect, useRef, useState } from "react";
import type { BaseElement } from "../extensions/types";
import { supabase } from "../lib/supabase";

export const useRealtime = (
  initialChannelId: string,
  onData?: (elements: BaseElement[]) => void,
) => {
  const [peerId] = useState(() =>
    Math.random().toString(36).substr(2, 6).toUpperCase(),
  );
  const [channelId, _setChannelId] = useState(initialChannelId);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "failed"
  >("idle");

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const onDataRef = useRef(onData);

  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  const sendData = useCallback(
    async (elements: BaseElement[]) => {
      if (!channelRef.current || status !== "connected") return;

      await channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: {
          sender_id: peerId,
          elements,
        },
      });
    },
    [peerId, status],
  );

  const setChannelId = (id: string) => {
    _setChannelId(id);
  };

  useEffect(() => {
    if (!channelId) return;

    console.log(`[REALTIME] Subscribing to channel: ${channelId}`);
    setStatus("connecting");

    const channel = supabase.channel(`canvas:${channelId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: peerId },
      },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "sync" }, ({ payload }) => {
        if (payload.sender_id === peerId) return;
        console.log(`[REALTIME] Received sync from ${payload.sender_id}`);
        if (onDataRef.current) onDataRef.current(payload.elements);
      })
      .on("broadcast", { event: "request-state" }, ({ payload }) => {
        if (payload.sender_id === peerId) return;
        console.log(`[REALTIME] State requested by ${payload.sender_id}`);
        // Notify the component to broadcast its state
        window.dispatchEvent(
          new CustomEvent("canvas:request-state", {
            detail: { requester_id: payload.sender_id },
          }),
        );
      })
      .subscribe((subStatus) => {
        console.log(`[REALTIME] Status: ${subStatus}`);
        if (subStatus === "SUBSCRIBED") {
          setStatus("connected");
          // Request current state from existing peers
          channel.send({
            type: "broadcast",
            event: "request-state",
            payload: { sender_id: peerId },
          });
        } else if (subStatus === "CHANNEL_ERROR") {
          setStatus("failed");
        }
      });

    return () => {
      console.log(`[REALTIME] Unsubscribing from channel: ${channelId}`);
      supabase.removeChannel(channel);
      channelRef.current = null;
      setStatus("idle");
    };
  }, [channelId, peerId]);

  return { peerId, channelId, status, setChannelId, sendData };
};
