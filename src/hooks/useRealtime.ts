import { useCallback, useEffect, useRef, useState } from "react";
import type { BaseElement } from "../extensions/types";
import { supabase } from "../lib/supabase";

export interface SpaceMetadata {
  id: string;
  slug: string;
  name?: string;
  owner_id?: string;
}

export const useRealtime = (
  initialSlug: string,
  onRemoteSync?: (elements: BaseElement[]) => void, // Fallback for broadcast
  onElementCreated?: (element: BaseElement) => void,
  onElementUpdated?: (element: BaseElement) => void,
  onElementDeleted?: (id: string) => void,
) => {
  const [peerId] = useState(() =>
    Math.random().toString(36).substr(2, 6).toUpperCase(),
  );
  const [slug, setSlug] = useState(initialSlug);
  const [space, setSpace] = useState<SpaceMetadata | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "connected" | "failed"
  >("idle");

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 1. Load/Ensure Space (Attempt Persistence)
  useEffect(() => {
    if (!slug) {
      setStatus("idle");
      setSpace(null);
      return;
    }

    const loadSpace = async () => {
      setStatus("loading");
      
      try {
        let { data: spaceData } = await supabase
          .from("spaces")
          .select("*")
          .eq("slug", slug)
          .single();

        if (!spaceData) {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: newSpace, error: createError } = await supabase
            .from("spaces")
            .insert({ slug, owner_id: user?.id, name: `Space ${slug}` })
            .select()
            .single();
          
          if (!createError) spaceData = newSpace;
        }

        if (spaceData) {
          setSpace(spaceData);
        }
      } catch (err) {
        console.warn("[REALTIME] Database unavailable, falling back to ephemeral mode.");
      }
      
      setStatus("connected");
    };

    loadSpace();
  }, [slug]);

  // 2. Combined Subscription (Postgres + Broadcast)
  useEffect(() => {
    if (!slug) return;

    const channelName = space?.id ? `space:${space.id}` : `broadcast:${slug}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    // A. Listen to Broadcast (Offline/Ephemeral Fallback)
    channel.on("broadcast", { event: "sync" }, ({ payload }) => {
      if (payload.sender_id === peerId) return;
      onRemoteSync?.(payload.elements);
    });

    // B. Listen to Postgres Changes (If Space exists)
    if (space?.id) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "elements",
          filter: `space_id=eq.${space.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            onElementCreated?.(payload.new as BaseElement);
          } else if (payload.eventType === "UPDATE") {
            onElementUpdated?.(payload.new as BaseElement);
          } else if (payload.eventType === "DELETE") {
            onElementDeleted?.(payload.old.id);
          }
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [slug, space?.id, peerId, onRemoteSync, onElementCreated, onElementUpdated, onElementDeleted]);

  // Sync Helpers
  const sendBroadcastSync = useCallback((elements: BaseElement[]) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "sync",
      payload: { sender_id: peerId, elements },
    });
  }, [peerId]);

  const addElementToDb = useCallback(async (element: any) => {
    if (!space?.id) return null;
    const { data: { user } } = await supabase.auth.getUser();
    
    // Extract extension params
    const { id, type, x, y, z_index, ...params } = element;
    
    const payload: any = {
      type,
      x,
      y,
      z_index: z_index || 0,
      params,
      space_id: space.id,
      created_by: user?.id
    };

    if (id && id.length > 10) { // Assume it's a valid ID (UUID or similar)
      payload.id = id;
    }

    return await supabase.from("elements").insert(payload).select().single();
  }, [space?.id]);

  const updateElementInDb = useCallback(async (id: string, element: any) => {
    if (!space?.id) return;
    
    // Extract extension params
    const { id: _, type, x, y, z_index, space_id, created_at, updated_at, created_by, ...params } = element;
    
    const payload: any = {
      type,
      x,
      y,
      z_index: z_index || 0,
      params,
      updated_at: new Date().toISOString()
    };

    return await supabase.from("elements")
      .update(payload)
      .eq("id", id);
  }, [space?.id]);

  const deleteElementFromDb = useCallback(async (id: string) => {
    if (!space?.id) return;
    return await supabase.from("elements")
      .delete()
      .eq("id", id);
  }, [space?.id]);

  return { 
    peerId, 
    slug, 
    space, 
    status, 
    setSlug, 
    sendBroadcastSync,
    addElementToDb,
    updateElementInDb,
    deleteElementFromDb 
  };
};
