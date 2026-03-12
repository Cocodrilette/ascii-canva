import {
  Book,
  Bot,
  Copy,
  Download,
  FileText,
  GripHorizontal,
  Key,
  Layers,
  Puzzle,
  Terminal,
  Trash2,
  Users,
  Wifi,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import type { BoxElement } from "../extensions/builtin/box";
import type { LineElement } from "../extensions/builtin/line";
import type { TextElement } from "../extensions/builtin/text";
import type { VectorElement } from "../extensions/builtin/vector";
import { getAllExtensions, getExtension, hasExtension } from "../extensions/registry";
import type { BaseElement } from "../extensions/types";
import { supabase } from "../lib/supabase";
import { useExtensions } from "../hooks/useExtensions";

import { useRealtime } from "../hooks/useRealtime";
import { isInside } from "../utils/geometry";
// Removed packElements and unpackElements imports as we use JSON now
import AiChat from "./AiChat";
import ApiKeyModal from "./ApiKeyModal";
import CollabModal from "./CollabModal";
import { ExtensionMarketplace } from "./ExtensionMarketplace";
import LayerManager from "./LayerManager";
import SpaceManagerModal from "./SpaceManagerModal";
import Taskbar from "./Taskbar";
import TutorialModal from "./TutorialModal";

const CELL_SIZE = 14;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;

const AsciiEditor: React.FC = () => {
  const { loading: extensionsLoading, autoInstallByTypes } = useExtensions();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<BaseElement[]>([]);
  const elementsRef = useRef<BaseElement[]>(elements);
  
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);
  
  // Auto-install missing extensions when elements update (especially on remote sync)
  useEffect(() => {
    if (elements.length > 0 && !extensionsLoading) {
      const types = Array.from(new Set(elements.map(el => el.type)));
      autoInstallByTypes(types);
    }
  }, [elements, extensionsLoading, autoInstallByTypes]);

  const [_history, setHistory] = useState<BaseElement[][]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const isRemoteUpdate = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);

  const [isResizing, setIsResizing] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(
    null,
  );
  const dragOffset = useRef({ x: 0, y: 0 });
  const [capturedIds, setCapturedIds] = useState<string[]>([]);

  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  const [ascii, setAscii] = useState("");
  const [showAscii, setShowAscii] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSpacesModal, setShowSpacesModal] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [activeApiKey, setActiveApiKey] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<BaseElement[]>([]);

  useEffect(() => {
    // Attempt to get an active API key for the current user
    const fetchActiveKey = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("api_keys")
        .select("key")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (data) setActiveApiKey(data.key);
    };
    fetchActiveKey();
  }, [showAiChat]); // Refresh when opening chat

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("ascii-seen-tutorial");
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem("ascii-seen-tutorial", "true");
    }
  }, []);
  const [newText, setNewText] = useState("");
  const [zoom, setZoom] = useState(1);
  const [touchDist, setTouchDist] = useState<number | null>(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    gridX: number;
    gridY: number;
    elementId: string | null;
    pointIndex?: number;
  } | null>(null);

  const getWelcomeElements = useCallback(() => {
    return [
      // Title & Welcome
      { ...getExtension("text").create(10, 5, { text: "WELCOME TO ASCII_CANVA" }), isCenter: true },
      getExtension("text").create(10, 7, { text: "A simple, collaborative ASCII workspace." }),
      
      // Quick Instructions
      getExtension("box").create(10, 10, { width: 38, height: 10 }),
      getExtension("text").create(12, 11, { text: "QUICK START GUIDE:" }),
      getExtension("text").create(12, 13, { text: "• Click tools above to add objects" }),
      getExtension("text").create(12, 14, { text: "• Drag objects to move them" }),
      getExtension("text").create(12, 15, { text: "• Double-click text to edit" }),
      getExtension("text").create(12, 16, { text: "• Right-click for context menu" }),
      getExtension("text").create(12, 17, { text: "• Use 'Export' to get .txt art" }),

      // Examples Area
      getExtension("text").create(50, 10, { text: "EXTENSIBLE PRIMITIVES:" }),
      
      // Box Example
      getExtension("box").create(70, 12, { width: 12, height: 5 }),
      getExtension("text").create(71, 13, { text: "Resizable" }),
      getExtension("text").create(71, 14, { text: "Containers" }),

      // A little bit of "Art"
      getExtension("text").create(10, 24, { text: "  _   _  " }),
      getExtension("text").create(10, 25, { text: " ( ) ( ) " }),
      getExtension("text").create(10, 26, { text: "  \\_ _/  " }),
      getExtension("text").create(10, 27, { text: "    V    " }),
      getExtension("text").create(14, 25, { text: "<-- Simple ASCII Art" }),
    ];
  }, []);

  const visualCellSize = CELL_SIZE * zoom;

  const getGridCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left - viewOffset.x) / visualCellSize);
      const y = Math.floor((clientY - rect.top - viewOffset.y) / visualCellSize);
      return { x, y };
    },
    [viewOffset, visualCellSize],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const pushToHistory = useCallback(() => {
    setHistory((prev) => {
      const newHistory = [...prev, elements];
      if (newHistory.length > 5) return newHistory.slice(1);
      return newHistory;
    });
  }, [elements]);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const lastState = prev[prev.length - 1];
      setElements(lastState);
      return prev.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isEditing) {
        // Only prevent if not typing in textarea
        if (document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "INPUT") {
          e.preventDefault();
          setSpacePressed(true);
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [isEditing]);

  // P2P Setup
  const centerView = useCallback(
    (els: BaseElement[]) => {
      const centerEl = els.find((el) => el.isCenter);
      if (centerEl) {
        const x = window.innerWidth / 2 - centerEl.x * visualCellSize;
        const y = window.innerHeight / 2 - centerEl.y * visualCellSize;
        setViewOffset({ x, y });
      }
    },
    [visualCellSize],
  );

  const spaceRef = useRef<any>(null);

  const onRemoteData = useCallback(
    (remoteElements: BaseElement[]) => {
      // If we are in a persistent space, we only trust granular Postgres changes.
      // Broadcast is only for ephemeral/local collaboration.
      if (spaceRef.current?.id) return;

      isRemoteUpdate.current = true;

      setElements((prev) => {
        const prevCenter = prev.find((e) => e.isCenter);
        const nextCenter = remoteElements.find((e) => e.isCenter);
        if (
          nextCenter &&
          (!prevCenter ||
            prevCenter.id !== nextCenter.id ||
            prevCenter.x !== nextCenter.x)
        ) {
          centerView(remoteElements);
        }
        return remoteElements;
      });

      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 100);
    },
    [centerView],
  );

  const inflateElement = useCallback((el: any) => {
    const flattened = { ...el, ...el.params };
    if ((flattened.type === "vector" || flattened.type === "line") && !flattened.points) {
      flattened.points = [
        { x: flattened.x, y: flattened.y },
        { x: flattened.x2 ?? flattened.x + 5, y: flattened.y2 ?? flattened.y + 3 }
      ];
    }
    return flattened as BaseElement;
  }, []);

  const onElementCreated = useCallback((el: any) => {
    const inflated = inflateElement(el);
    setElements(prev => {
      if (prev.find(e => e.id === inflated.id)) return prev;
      return [...prev, inflated];
    });
  }, [inflateElement]);

  const onElementUpdated = useCallback((el: any) => {
    const inflated = inflateElement(el);
    setElements(prev => prev.map(e => e.id === inflated.id ? inflated : e));
  }, [inflateElement]);

  const onElementDeleted = useCallback((id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
  }, []);

  const { 
    peerId, 
    slug: channelId, 
    space,
    status, 
    setSlug: setChannelId, 
    sendBroadcastSync: sendData,
    addElementToDb,
    updateElementInDb,
    deleteElementFromDb
  } = useRealtime(
    "",
    onRemoteData,
    onElementCreated,
    onElementUpdated,
    onElementDeleted
  );

  useEffect(() => {
    spaceRef.current = space;
  }, [space]);
  // Load existing elements from DB when joining a space
  useEffect(() => {
    if (space?.id) {
      const fetchElements = async () => {
        const { data, error } = await supabase
          .from("elements")
          .select("*")
          .eq("space_id", space.id);
        
        if (!error && data) {
          const inflated = data.map((el: any) => inflateElement(el));
          setElements(inflated);
        }
        setIsLoaded(true); // Signal that initial DB fetch is complete
      };
      fetchElements();
    }
  }, [space?.id, inflateElement]);

  const setCenter = useCallback(() => {
    if (selectedIds.length !== 1) return;
    pushToHistory();
    setElements((prev) => {
      const next = prev.map((el) => ({
        ...el,
        isCenter: el.id === selectedIds[0],
      }));
      centerView(next);
      return next;
    });
  }, [selectedIds, pushToHistory, centerView]);

  // Sync elements to peers (Bi-directional - only for ephemeral broadcast mode)
  useEffect(() => {
    if (isLoaded && !space?.id && status === "connected" && !isRemoteUpdate.current) {
      sendData(elements);
    }
  }, [elements, status, sendData, isLoaded, space?.id]);

  // Handle state request from new joiners
  useEffect(() => {
    const handleRequestState = () => {
      if (status === "connected") {
        sendData(elements);
      }
    };
    window.addEventListener("canvas:request-state", handleRequestState);
    return () =>
      window.removeEventListener("canvas:request-state", handleRequestState);
  }, [elements, status, sendData]);

  const startCollaboration = () => {
    const id = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newUrl = `${window.location.origin}${window.location.pathname}?join=${id}`;
    window.history.pushState({}, "", newUrl);
    setChannelId(id);
  };

  useEffect(() => {
    // Auto-join if channel in URL
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get("join");
    if (joinId && status === "idle") {
      const hasContent = elements.length > 0;
      if (hasContent) {
        if (
          window.confirm(
            "Joining a session will override your local drawing. Proceed?",
          )
        ) {
          setChannelId(joinId);
        } else {
          // Clean URL to prevent re-triggering
          window.history.pushState({}, "", window.location.pathname);
        }
      } else {
        setChannelId(joinId);
      }
    }
  }, [status, setChannelId, elements.length > 0]);

  useEffect(() => {
    if (isLoaded && elements.length > 0) {
      centerView(elements);
    }
  }, [isLoaded, centerView]); // Center only once when initially loaded

  // 1. Initial State Loading Logic (Pure Local Mode fallback)
  useEffect(() => {
    const initLoad = async () => {
      // If we are joining a space or in a registered space, skip local loading (handled by DB effect)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("join") || space?.id) return;

      if (!isLoaded) {
        const saved = localStorage.getItem("ascii-canvas-state");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.length > 0) {
              setElements(parsed);
            } else {
              setElements(getWelcomeElements());
            }
          } catch (e) {
            setElements(getWelcomeElements());
          }
        } else {
          setElements(getWelcomeElements());
        }
        setIsLoaded(true);
      }
    };
    initLoad();
  }, [getWelcomeElements, isLoaded, space?.id]);

  // 2. Persist to LocalStorage ONLY in local mode
  useEffect(() => {
    if (isLoaded && !space?.id) {
      localStorage.setItem("ascii-canvas-state", JSON.stringify(elements));
    }
  }, [elements, isLoaded, space?.id]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (
      canvas.width !== rect.width ||
      canvas.height !== rect.height
    ) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);

    // Grid
    ctx.strokeStyle = "#F0F0F0";
    ctx.lineWidth = 1;
    const startCol = Math.floor(-viewOffset.x / visualCellSize);
    const endCol = startCol + Math.ceil(canvas.width / visualCellSize) + 1;
    const startRow = Math.floor(-viewOffset.y / visualCellSize);
    const endRow = startRow + Math.ceil(canvas.height / visualCellSize) + 1;

    ctx.beginPath();
    for (let i = startCol; i <= endCol; i++) {
      ctx.moveTo(i * visualCellSize, startRow * visualCellSize);
      ctx.lineTo(i * visualCellSize, endRow * visualCellSize);
    }
    for (let j = startRow; j <= endRow; j++) {
      ctx.moveTo(startCol * visualCellSize, j * visualCellSize);
      ctx.lineTo(endCol * visualCellSize, j * visualCellSize);
    }
    ctx.stroke();

    // Culling and Rendering
    const visibleElements = elements.filter((el) => {
      if (el.hidden || !hasExtension(el.type)) return false;
      const ext = getExtension(el.type);
      const b = ext.getBounds(el);
      const screenX = b.left * visualCellSize + viewOffset.x;
      const screenY = b.top * visualCellSize + viewOffset.y;
      const screenW = (b.right - b.left) * visualCellSize;
      const screenH = (b.bottom - b.top) * visualCellSize;
      return (
        screenX + screenW > 0 &&
        screenX < canvas.width &&
        screenY + screenH > 0 &&
        screenY < canvas.height
      );
    });

    for (const el of visibleElements) {
      const ext = getExtension(el.type);
      ext.render(ctx, el, selectedIds.includes(el.id), visualCellSize);
    }

    // Draw selection marquee
    if (isSelectingArea) {
      ctx.restore(); // Exit grid coordinate space for pixel-based marquee
      ctx.save();
      ctx.strokeStyle = "#000080";
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(0, 0, 128, 0.1)";
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const w = Math.abs(selectionStart.x - selectionEnd.x);
      const h = Math.abs(selectionStart.y - selectionEnd.y);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
      ctx.save();
      ctx.translate(viewOffset.x, viewOffset.y);
    }

    ctx.restore();
  }, [elements, selectedIds, visualCellSize, viewOffset, isSelectingArea, selectionStart, selectionEnd]);

  useEffect(() => {
    let animationFrameId: number;
    const render = () => {
      draw();
      animationFrameId = window.requestAnimationFrame(render);
    };
    animationFrameId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [draw]);

  const handleMouseUp = useCallback(async () => {
    const wasSelecting = isSelectingArea;
    const wasDragging = hasDragged.current;
    
    // Reset UI states immediately for responsiveness
    setIsDragging(false);
    setIsResizing(false);
    setDraggedPointIndex(null);
    setIsPanning(false);
    setIsSelectingArea(false);

    if (wasSelecting) {
      const x1 = Math.min(selectionStart.x, selectionEnd.x);
      const y1 = Math.min(selectionStart.y, selectionEnd.y);
      const x2 = Math.max(selectionStart.x, selectionEnd.x);
      const y2 = Math.max(selectionStart.y, selectionEnd.y);

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const newlySelected = elementsRef.current.filter(el => {
          if (!hasExtension(el.type)) return false;
          const b = getExtension(el.type).getBounds(el);
          const screenL = b.left * visualCellSize + viewOffset.x + rect.left;
          const screenT = b.top * visualCellSize + viewOffset.y + rect.top;
          const screenR = b.right * visualCellSize + viewOffset.x + rect.left;
          const screenB = b.bottom * visualCellSize + viewOffset.y + rect.top;

          return screenL < x2 && screenR > x1 && screenT < y2 && screenB > y1;
        }).map(el => el.id);

        setSelectedIds(prev => Array.from(new Set([...prev, ...newlySelected])));
      }
    }

    if (wasDragging && space?.id) {
      const movedIds = [...selectedIds, ...capturedIds];
      const updates = movedIds.map(id => {
        const el = elementsRef.current.find(e => e.id === id);
        if (el) return updateElementInDb(id, el);
        return Promise.resolve();
      });
      await Promise.all(updates);
    }

    hasDragged.current = false;
    setCapturedIds([]);
  }, [isSelectingArea, selectionStart, selectionEnd, visualCellSize, viewOffset, space?.id, updateElementInDb, selectedIds, capturedIds]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);
    const clickedEl = [...elements]
      .reverse()
      .find((el) => {
        if (el.locked || el.hidden || !hasExtension(el.type)) return false;
        const ext = getExtension(el.type);
        const b = ext.getBounds(el);
        return (
          gridX >= b.left &&
          gridX < b.right &&
          gridY >= b.top &&
          gridY < b.bottom
        );
      });

    if (clickedEl?.type === "text" && !hasDragged.current) {
      setSelectedIds([clickedEl.id]);
      setIsEditing(true);
    }
  };
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);

      // Check if right-clicking a vector/line point handle first
      if (selectedIds.length === 1) {
        const selected = elements.find((el) => el.id === selectedIds[0]);
        if (selected?.type === "vector" || selected?.type === "line") {
          const vec = selected as VectorElement | LineElement;
          const points = vec.points;
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const px = p.x * visualCellSize + viewOffset.x + visualCellSize / 2;
            const py = p.y * visualCellSize + viewOffset.y + visualCellSize / 2;
            if (Math.abs(mouseX - px) < 15 && Math.abs(mouseY - py) < 15) {
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                gridX,
                gridY,
                elementId: selected.id,
                pointIndex: i,
              });
              return;
            }
          }
        }
      }

      // Logic to select element under right-click if not already selected
      const clickedEl = [...elements]
        .reverse()
        .find((el) => {
          if (el.locked || el.hidden || !hasExtension(el.type)) return false;
          const ext = getExtension(el.type);
          const b = ext.getBounds(el);
          return (
            gridX >= b.left &&
            gridX < b.right &&
            gridY >= b.top &&
            gridY < b.bottom
          );
        });

      if (clickedEl) {
        if (!selectedIds.includes(clickedEl.id)) {
          setSelectedIds([clickedEl.id]);
        }
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          gridX,
          gridY,
          elementId: clickedEl.id,
        });
      } else {
        // Right click on background - no selection change unless needed
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          gridX,
          gridY,
          elementId: null,
        });
      }
    },
    [elements, getGridCoords, selectedIds, visualCellSize, viewOffset],
  );

  const deleteVectorPoint = useCallback(
    (elementId: string, pointIndex: number) => {
      pushToHistory();
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === elementId && (el.type === "vector" || el.type === "line")) {
            const vec = el as VectorElement | LineElement;
            const points = vec.points;
            if (points.length <= 2) return el; // Minimum 2 points
            const newPoints = [...points];
            newPoints.splice(pointIndex, 1);
            return {
              ...vec,
              x: newPoints[0].x,
              y: newPoints[0].y,
              points: newPoints,
              // If we delete start/end, we might want to clear connection
              startElementId: pointIndex === 0 ? undefined : vec.startElementId,
              endElementId:
                pointIndex === points.length - 1
                  ? undefined
                  : vec.endElementId,
            };
          }
          return el;
        }),
      );
    },
    [pushToHistory],
  );
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);

      if (isSelectingArea) {
        setSelectionEnd({ x: e.clientX, y: e.clientY });
        return;
      }

      if (isResizing && selectedIds.length === 1) {
        setElements((prev) =>
          prev.map((el) => {
            if (el.id === selectedIds[0] && el.type === "box") {
              const box = el as BoxElement;
              const newWidth = Math.max(2, gridX - box.x + 1);
              const newHeight = Math.max(2, gridY - box.y + 1);
              const children = prev.filter((child) => isInside(child, box));
              if (children.length > 0) {
                const minR = Math.max(
                  ...children.map(
                    (c) => getExtension(c.type).getBounds(c).right,
                  ),
                );
                const minB = Math.max(
                  ...children.map(
                    (c) => getExtension(c.type).getBounds(c).bottom,
                  ),
                );
                return {
                  ...box,
                  width: Math.max(newWidth, minR - box.x),
                  height: Math.max(newHeight, minB - box.y),
                };
              }
              return { ...box, width: newWidth, height: newHeight };
            }
            return el;
          }),
        );
      } else if (draggedPointIndex !== null && selectedIds.length === 1) {
        setElements((prev) =>
          prev.map((el) => {
            if (el.id === selectedIds[0] && (el.type === "vector" || el.type === "line")) {
              const vec = el as VectorElement | LineElement;
              const points = vec.points;
              const isStart = draggedPointIndex === 0;
              const isEnd = draggedPointIndex === points.length - 1;

              let finalX = gridX;
              let finalY = gridY;
              let hitId: string | undefined;

              if (isStart || isEnd) {
                const hit = prev.find(
                  (other) =>
                    !selectedIds.includes(other.id) &&
                    other.type !== "vector" &&
                    other.type !== "line" &&
                    gridX >= getExtension(other.type).getBounds(other).left &&
                    gridX < getExtension(other.type).getBounds(other).right &&
                    gridY >= getExtension(other.type).getBounds(other).top &&
                    gridY < getExtension(other.type).getBounds(other).bottom,
                );

                if (hit) {
                  hitId = hit.id;
                  const b = getExtension(hit.type).getBounds(hit);
                  const left = b.left;
                  const right = b.right - 1;
                  const top = b.top;
                  const bottom = b.bottom - 1;

                  const dxL = Math.abs(gridX - left);
                  const dxR = Math.abs(gridX - right);
                  const dyT = Math.abs(gridY - top);
                  const dyB = Math.abs(gridY - bottom);

                  const min = Math.min(dxL, dxR, dyT, dyB);
                  if (min === dxL) finalX = left;
                  else if (min === dxR) finalX = right;
                  else if (min === dyT) finalY = top;
                  else finalY = bottom;
                }
              }

              const newPoints = [...points];
              newPoints[draggedPointIndex] = { x: finalX, y: finalY };

              return {
                ...vec,
                x: newPoints[0].x,
                y: newPoints[0].y,
                points: newPoints,
                startElementId: isStart ? hitId : vec.startElementId,
                endElementId: isEnd ? hitId : vec.endElementId,
              };
            }
            return el;
          }),
        );
      } else if (isDragging && selectedIds.length > 0) {
        const dx = gridX - dragOffset.current.x;
        const dy = gridY - dragOffset.current.y;
        if (dx !== 0 || dy !== 0) {
          hasDragged.current = true;
          const movedIds = [...selectedIds, ...capturedIds];
          setElements((prev) =>
            prev.map((el) => {
              if (movedIds.includes(el.id)) {
                if (el.type === "vector" || el.type === "line") {
                  const vec = el as VectorElement | LineElement;
                  const points = vec.points;
                  const newPoints = points.map((p) => ({
                    x: p.x + dx,
                    y: p.y + dy,
                  }));
                  return {
                    ...vec,
                    x: newPoints[0].x,
                    y: newPoints[0].y,
                    points: newPoints,
                  };
                }
                return { ...el, x: el.x + dx, y: el.y + dy };
              }
              if (el.type === "vector" || el.type === "line") {
                const vec = el as VectorElement | LineElement;
                let changed = false;
                const points = vec.points;
                const newPoints = [...points];
                if (
                  vec.startElementId &&
                  movedIds.includes(vec.startElementId)
                ) {
                  newPoints[0] = {
                    x: newPoints[0].x + dx,
                    y: newPoints[0].y + dy,
                  };
                  changed = true;
                }
                if (vec.endElementId && movedIds.includes(vec.endElementId)) {
                  const lastIdx = newPoints.length - 1;
                  newPoints[lastIdx] = {
                    x: newPoints[lastIdx].x + dx,
                    y: newPoints[lastIdx].y + dy,
                  };
                  changed = true;
                }
                if (changed) {
                  return {
                    ...vec,
                    x: newPoints[0].x,
                    y: newPoints[0].y,
                    points: newPoints,
                  };
                }
              }
              return el;
            }),
          );
          dragOffset.current = { x: gridX, y: gridY };
        }
      } else if (isPanning) {
        setViewOffset({ x: mouseX - panStart.x, y: mouseY - panStart.y });
      }
    },
    [
      isDragging,
      isResizing,
      isPanning,
      isSelectingArea,
      selectedIds,
      getGridCoords,
      panStart,
      capturedIds,
      draggedPointIndex,
    ],
  );
  const handleTouchEnd = useCallback(async () => {
    const wasDragging = hasDragged.current;
    
    setTouchDist(null);
    setIsDragging(false);
    setIsResizing(false);
    setDraggedPointIndex(null);
    setIsPanning(false);
    setIsSelectingArea(false);

    if (wasDragging && space?.id) {
      const movedIds = [...selectedIds, ...capturedIds];
      const updates = movedIds.map(id => {
        const el = elementsRef.current.find(e => e.id === id);
        if (el) return updateElementInDb(id, el);
        return Promise.resolve();
      });
      await Promise.all(updates);
    }

    hasDragged.current = false;
    setCapturedIds([]);
  }, [selectedIds, capturedIds, space?.id, updateElementInDb]);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && touchDist !== null) {
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY,
        );
        const delta = dist / touchDist;
        setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * delta)));
        setTouchDist(dist);
      } else if (e.touches.length === 1) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;

        const { x: gridX, y: gridY } = getGridCoords(
          touch.clientX,
          touch.clientY,
        );

        if (isResizing && selectedIds.length === 1) {
          setElements((prev) =>
            prev.map((el) => {
              if (el.id === selectedIds[0] && el.type === "box") {
                const box = el as BoxElement;
                const newWidth = Math.max(2, gridX - box.x + 1);
                const newHeight = Math.max(2, gridY - box.y + 1);
                const children = prev.filter((child) => isInside(child, box));
                if (children.length > 0) {
                  const minR = Math.max(
                    ...children.map(
                      (c) => getExtension(c.type).getBounds(c).right,
                    ),
                  );
                  const minB = Math.max(
                    ...children.map(
                      (c) => getExtension(c.type).getBounds(c).bottom,
                    ),
                  );
                  return {
                    ...box,
                    width: Math.max(newWidth, minR - box.x),
                    height: Math.max(newHeight, minB - box.y),
                  };
                }
                return { ...box, width: newWidth, height: newHeight };
              }
              return el;
            }),
          );
        } else if (draggedPointIndex !== null && selectedIds.length === 1) {
          setElements((prev) =>
            prev.map((el) => {
              if (el.id === selectedIds[0] && (el.type === "vector" || el.type === "line")) {
                const vec = el as VectorElement | LineElement;
                const points = vec.points;
                const isStart = draggedPointIndex === 0;
                const isEnd = draggedPointIndex === points.length - 1;

                let finalX = gridX;
                let finalY = gridY;
                let hitId: string | undefined;

                if (isStart || isEnd) {
                  const hit = prev.find(
                    (other) =>
                      !selectedIds.includes(other.id) &&
                      other.type !== "vector" &&
                      other.type !== "line" &&
                      gridX >= getExtension(other.type).getBounds(other).left &&
                      gridX < getExtension(other.type).getBounds(other).right &&
                      gridY >= getExtension(other.type).getBounds(other).top &&
                      gridY < getExtension(other.type).getBounds(other).bottom,
                  );

                  if (hit) {
                    hitId = hit.id;
                    const b = getExtension(hit.type).getBounds(hit);
                    const left = b.left;
                    const right = b.right - 1;
                    const top = b.top;
                    const bottom = b.bottom - 1;

                    const dxL = Math.abs(gridX - left);
                    const dxR = Math.abs(gridX - right);
                    const dyT = Math.abs(gridY - top);
                    const dyB = Math.abs(gridY - bottom);

                    const min = Math.min(dxL, dxR, dyT, dyB);
                    if (min === dxL) finalX = left;
                    else if (min === dxR) finalX = right;
                    else if (min === dyT) finalY = top;
                    else finalY = bottom;
                  }
                }

                const newPoints = [...points];
                newPoints[draggedPointIndex] = { x: finalX, y: finalY };

                return {
                  ...vec,
                  x: newPoints[0].x,
                  y: newPoints[0].y,
                  points: newPoints,
                  startElementId: isStart ? hitId : vec.startElementId,
                  endElementId: isEnd ? hitId : vec.endElementId,
                };
              }
              return el;
            }),
          );
        }
 else if (isDragging && selectedIds.length > 0) {
          const dx = gridX - dragOffset.current.x;
          const dy = gridY - dragOffset.current.y;
          if (dx !== 0 || dy !== 0) {
            hasDragged.current = true;
            const movedIds = [...selectedIds, ...capturedIds];
            setElements((prev) =>
              prev.map((el) => {
                if (movedIds.includes(el.id)) {
                  if (el.type === "vector" || el.type === "line") {
                    const vec = el as VectorElement | LineElement;
                    const newPoints = vec.points.map((p) => ({
                      x: p.x + dx,
                      y: p.y + dy,
                    }));
                    return {
                      ...vec,
                      x: newPoints[0].x,
                      y: newPoints[0].y,
                      points: newPoints,
                    };
                  }
                  return { ...el, x: el.x + dx, y: el.y + dy };
                }
                if (el.type === "vector" || el.type === "line") {
                  const vec = el as VectorElement | LineElement;
                  let changed = false;
                  const newPoints = [...vec.points];
                  if (
                    vec.startElementId &&
                    movedIds.includes(vec.startElementId)
                  ) {
                    newPoints[0] = {
                      x: newPoints[0].x + dx,
                      y: newPoints[0].y + dy,
                    };
                    changed = true;
                  }
                  if (vec.endElementId && movedIds.includes(vec.endElementId)) {
                    const lastIdx = newPoints.length - 1;
                    newPoints[lastIdx] = {
                      x: newPoints[lastIdx].x + dx,
                      y: newPoints[lastIdx].y + dy,
                    };
                    changed = true;
                  }
                  if (changed) {
                    return {
                      ...vec,
                      x: newPoints[0].x,
                      y: newPoints[0].y,
                      points: newPoints,
                    };
                  }
                }
                return el;
              }),
            );
            dragOffset.current = { x: gridX, y: gridY };
          }
        } else if (isPanning) {
          setViewOffset({
            x: mouseX - panStart.x,
            y: mouseY - panStart.y,
          });
        }
      }
    },
    [
      isDragging,
      isResizing,
      isPanning,
      selectedIds,
      getGridCoords,
      dragOffset,
      panStart,
      capturedIds,
      touchDist,
      draggedPointIndex,
    ],
  );

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    } else {
      setViewOffset((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas?.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      canvas?.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    closeContextMenu();
    setIsEditing(false);
    hasDragged.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);
    
    // Only allow resizing/point dragging if exactly one element is selected
    if (selectedIds.length === 1) {
      const selected = elements.find((el) => el.id === selectedIds[0]);

      if (selected?.type === "box") {
        const box = selected as BoxElement;
        const handleX = (box.x + box.width) * visualCellSize + viewOffset.x;
        const handleY = (box.y + box.height) * visualCellSize + viewOffset.y;
        if (
          Math.abs(mouseX - handleX) < 15 &&
          Math.abs(mouseY - handleY) < 15
        ) {
          pushToHistory();
          setIsResizing(true);
          hasDragged.current = true;
          return;
        }
      }

      if (selected?.type === "vector" || selected?.type === "line") {
        const vec = selected as VectorElement | LineElement;
        const points = vec.points;
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const px = p.x * visualCellSize + viewOffset.x + visualCellSize / 2;
          const py = p.y * visualCellSize + viewOffset.y + visualCellSize / 2;

          if (Math.abs(mouseX - px) < 15 && Math.abs(mouseY - py) < 15) {
            if (e.detail === 2 && points.length < 10) {
              // Double click: add point after this one
              pushToHistory();
              const nextIdx = (i + 1) % points.length;
              const nextP = points[nextIdx];
              const newP = {
                x: Math.round((p.x + nextP.x) / 2),
                y: Math.round((p.y + nextP.y) / 2),
              };
              setElements((prev) =>
                prev.map((el) => {
                  if (el.id === selectedIds[0]) {
                    const v = el as VectorElement | LineElement;
                    const vPoints = v.points;
                    const newPoints = [...vPoints];
                    newPoints.splice(i + 1, 0, newP);
                    return { ...v, points: newPoints };
                  }
                  return el;
                }),
              );
              return;
            }
            pushToHistory();
            setDraggedPointIndex(i);
            hasDragged.current = true;
            return;
          }
        }
      }
    }

    // Selection logic
    const clickedEl = [...elements]
      .reverse()
      .find((el) => {
        if (el.locked || el.hidden || !hasExtension(el.type)) return false;
        const ext = getExtension(el.type);
        const b = ext.getBounds(el);
        return (
          gridX >= b.left &&
          gridX < b.right &&
          gridY >= b.top &&
          gridY < b.bottom
        );
      });

    const isCtrl = e.ctrlKey || e.metaKey;

    if (clickedEl) {
      pushToHistory();
      
      let nextIds: string[];
      if (isCtrl) {
        if (selectedIds.includes(clickedEl.id)) {
          nextIds = selectedIds.filter(id => id !== clickedEl.id);
        } else {
          nextIds = [...selectedIds, clickedEl.id];
        }
      } else {
        if (selectedIds.includes(clickedEl.id)) {
          nextIds = selectedIds;
        } else {
          nextIds = [clickedEl.id];
        }
      }
      
      setSelectedIds(nextIds);
      setIsDragging(true);
      dragOffset.current = { x: gridX, y: gridY };
      
      // Captured IDs logic (for children inside boxes)
      const allCaptured: string[] = [];
      for (const id of nextIds) {
        const el = elements.find(e => e.id === id);
        if (el?.type === "box") {
          const children = elements.filter(child => isInside(child, el) && !nextIds.includes(child.id));
          allCaptured.push(...children.map(c => c.id));
        }
      }
      setCapturedIds(allCaptured);
    } else {
      if (spacePressed || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: mouseX - viewOffset.x, y: mouseY - viewOffset.y });
      } else {
        if (!isCtrl) {
          setSelectedIds([]);
        }
        setIsSelectingArea(true);
        setSelectionStart({ x: e.clientX, y: e.clientY });
        setSelectionEnd({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY,
      );
      setTouchDist(dist);
    } else if (e.touches.length === 1) {
      closeContextMenu();
      setIsEditing(false);
      hasDragged.current = false;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;

      const { x: gridX, y: gridY } = getGridCoords(
        touch.clientX,
        touch.clientY,
      );
      if (selectedIds.length === 1) {
        const selected = elements.find((el) => el.id === selectedIds[0]);
        if (selected?.type === "box") {
          const box = selected as BoxElement;
          const handleX = (box.x + box.width) * visualCellSize + viewOffset.x;
          const handleY = (box.y + box.height) * visualCellSize + viewOffset.y;
          if (
            Math.abs(mouseX - handleX) < 30 &&
            Math.abs(mouseY - handleY) < 30
          ) {
            pushToHistory();
            setIsResizing(true);
            hasDragged.current = true;
            return;
          }
        }

        if (selected?.type === "vector" || selected?.type === "line") {
          const vec = selected as VectorElement | LineElement;
          const points = vec.points;
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const px = p.x * visualCellSize + viewOffset.x + visualCellSize / 2;
            const py = p.y * visualCellSize + viewOffset.y + visualCellSize / 2;

            if (
              Math.abs(mouseX - px) < 30 &&
              Math.abs(mouseY - py) < 30
            ) {
              pushToHistory();
              setDraggedPointIndex(i);
              hasDragged.current = true;
              return;
            }
          }
        }
      }
      const clickedEl = [...elements]
        .reverse()
        .find((el) => {
          if (el.locked || el.hidden || !hasExtension(el.type)) return false;
          const ext = getExtension(el.type);
          const b = ext.getBounds(el);
          return (
            gridX >= b.left &&
            gridX < b.right &&
            gridY >= b.top &&
            gridY < b.bottom
          );
        });
      if (clickedEl) {
        pushToHistory();
        setSelectedIds([clickedEl.id]);
        setIsDragging(true);
        dragOffset.current = { x: gridX, y: gridY };
        if (clickedEl.type === "box") {
          const children = elements.filter((el) => isInside(el, clickedEl));
          setCapturedIds(children.map((c) => c.id));
        } else {
          setCapturedIds([]);
        }
      } else {
        setSelectedIds([]);
        setIsPanning(true);
        setPanStart({
          x: mouseX - viewOffset.x,
          y: mouseY - viewOffset.y,
        });
      }
    }
  };

  const addExtensionElement = async (type: string) => {
    if (elements.length >= 100) {
      sileo.error({
        title: "System Capacity Reached",
        description: "Maximum 100 neural objects allowed per sector."
      });
      return;
    }
    pushToHistory();
    const ext = getExtension(type);
    const newEl = ext.create(
      Math.floor((window.innerWidth / 2 - viewOffset.x) / visualCellSize),
      Math.floor((window.innerHeight / 2 - viewOffset.y) / visualCellSize),
      type === "text" ? { text: newText.trim() || "NEW TEXT" } : {},
    );

    // Persistence: Add to DB if in a space
    if (space?.id) {
      const res = await addElementToDb(newEl);
      if (res) {
        const { data, error } = res;
        if (error) {
          sileo.error({ title: "Registration Failure", description: error.message });
        } else if (data) {
          // useRealtime will trigger onElementCreated, which adds it to local state.
          // We don't necessarily need to add it here, but for "optimistic" UI we could.
          // However, to avoid duplicates, let's just wait for the realtime event or add it if not already there.
          const inflated = inflateElement(data);
          setElements(prev => {
            if (prev.find(e => e.id === inflated.id)) return prev;
            return [...prev, inflated];
          });
          setSelectedIds([inflated.id]);
        }
      }
    } else {
      setElements(prev => [...prev, newEl]);
      setSelectedIds([newEl.id]);
    }
    
    setNewText("");
  };

  const saveProject = () => {
    try {
      const data = JSON.stringify(elements, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "canvas_project.json";
      a.click();
      URL.revokeObjectURL(url);
      sileo.success({
        title: "Sequence Archived",
        description: "Project manifest successfully exported to local storage."
      });
    } catch (err) {
      sileo.error({ title: "Archival Failure", description: "Failed to serialize current canvas state." });
    }
  };

  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedElements = JSON.parse(event.target?.result as string);
        pushToHistory();
        setElements(loadedElements);
        sileo.info({
          title: "Sequence Restored",
          description: `Successfully materialized ${loadedElements.length} objects.`
        });
      } catch (_err) {
        sileo.error({ title: "Materialization Error", description: "Invalid project manifest detected." });
      }
    };
    reader.readAsText(file);
  };

  const downloadAscii = () => {
    const blob = new Blob([ascii], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascii_art.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToImage = () => {
    if (elements.length === 0) return;

    // 1. Calculate bounds
    const registeredElements = elements.filter(el => hasExtension(el.type));
    if (registeredElements.length === 0) return;

    const bounds = registeredElements.map((el) => getExtension(el.type).getBounds(el));
    const minX = Math.min(...bounds.map((b) => b.left));
    const maxX = Math.max(...bounds.map((b) => b.right));
    const minY = Math.min(...bounds.map((b) => b.top));
    const maxY = Math.max(...bounds.map((b) => b.bottom));

    const width = (maxX - minX + 2) * CELL_SIZE; // +2 for padding
    const height = (maxY - minY + 2) * CELL_SIZE;

    // 2. Setup high-fidelity offscreen canvas (2x for crispness)
    const scale = 2;
    const offscreen = document.createElement("canvas");
    offscreen.width = width * scale;
    offscreen.height = height * scale;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    // 3. Render
    ctx.scale(scale, scale);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    ctx.translate(
      (-minX + 1) * CELL_SIZE,
      (-minY + 1) * CELL_SIZE
    );

    for (const el of registeredElements) {
      const ext = getExtension(el.type);
      ext.render(ctx, el, false, CELL_SIZE);
    }

    // 4. Download
    const link = document.createElement("a");
    link.download = `ascii_canva_${new Date().getTime()}.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();
  };

  const updateSelectedText = (text: string) => {
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.includes(el.id) && el.type === "text"
          ? { ...(el as TextElement), text }
          : el,
      ),
    );
  };

  const copySelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selectedElements = elementsRef.current.filter((el) => selectedIds.includes(el.id));
    setClipboard(JSON.parse(JSON.stringify(selectedElements)));
    sileo.info({ title: "System", description: `${selectedElements.length} object(s) copied to clipboard.` });
  }, [selectedIds]);

  const paste = useCallback(async (targetX?: number, targetY?: number) => {
    if (clipboard.length === 0) return;
    
    pushToHistory();
    
    let offsetX = 2;
    let offsetY = 2;

    if (targetX !== undefined && targetY !== undefined) {
      // Calculate the bounding box of the clipboard elements
      const bounds = clipboard.map(el => {
        if (!hasExtension(el.type)) return { left: el.x, top: el.y };
        return getExtension(el.type).getBounds(el);
      });
      
      const minX = Math.min(...bounds.map(b => b.left));
      const minY = Math.min(...bounds.map(b => b.top));
      
      offsetX = targetX - minX;
      offsetY = targetY - minY;
    }

    const newElements: BaseElement[] = [];
    const newIds: string[] = [];

    for (const el of clipboard) {
      if (!hasExtension(el.type)) continue;
      const ext = getExtension(el.type);
      
      // Clean up metadata from copied element to create a fresh one
      const { id: _, x, y, created_at, updated_at, space_id, created_by, isCenter, ...params } = el as any;
      
      const newEl = ext.create(x + offsetX, y + offsetY, params);
      
      if (space?.id) {
        const res = await addElementToDb(newEl);
        if (res?.data) {
          const inflated = inflateElement(res.data);
          newElements.push(inflated);
          newIds.push(inflated.id);
        }
      } else {
        newElements.push(newEl);
        newIds.push(newEl.id);
      }
    }

    if (newElements.length > 0) {
      setElements((prev) => [...prev, ...newElements]);
      setSelectedIds(newIds);
      
      // Update clipboard with new positions for subsequent "blind" pastes
      setClipboard(newElements.map(el => JSON.parse(JSON.stringify(el))));
      
      sileo.success({ title: "System", description: `${newElements.length} object(s) materialized.` });
    }
  }, [clipboard, space?.id, addElementToDb, pushToHistory, inflateElement]);

  const deleteSelected = useCallback(
    async (id?: string) => {
      const targets = id ? [id] : selectedIds;
      if (targets.length === 0) return;
      pushToHistory();
      setElements((prev) => prev.filter((el) => !targets.includes(el.id)));
      setSelectedIds(prev => prev.filter(id => !targets.includes(id)));

      // Persistence: Delete from DB if in a space
      if (space?.id) {
        for (const targetId of targets) {
          await deleteElementFromDb(targetId);
        }
      }
    },
    [selectedIds, pushToHistory, space?.id, deleteElementFromDb],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts should be disabled when editing text in our custom textarea
      if (isEditing) return;

      const isMod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (isMod && e.key === "z") {
        if (isInput) return;
        e.preventDefault();
        undo();
      } else if (isMod && e.key === "c") {
        if (isInput) return;
        e.preventDefault();
        copySelected();
      } else if (isMod && e.key === "v") {
        if (isInput) return;
        e.preventDefault();
        paste();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        // Only trigger delete if not in an input/textarea
        if (isInput) return;
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, copySelected, paste, deleteSelected, isEditing]);
  const generateAscii = () => {
    if (elements.length === 0) return;
    const registeredElements = elements.filter(el => hasExtension(el.type));
    if (registeredElements.length === 0) return;
    
    const bounds = registeredElements.map((el) => getExtension(el.type).getBounds(el));
    const minX = Math.min(...bounds.map((b) => b.left));
    const maxX = Math.max(...bounds.map((b) => b.right));
    const minY = Math.min(...bounds.map((b) => b.top));
    const maxY = Math.max(...bounds.map((b) => b.bottom));

    const width = maxX - minX;
    const height = maxY - minY;
    const grid: string[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => " "),
    );

    for (const el of registeredElements) {
      getExtension(el.type).toAscii(el, grid, { x: minX, y: minY });
    }

    setAscii(grid.map((row) => row.join("")).join("\n"));
    setShowAscii(true);
  };

  const selectedElement = selectedIds.length === 1 ? elements.find((el) => el.id === selectedIds[0]) : null;

  const selectAndCenterElement = useCallback(
    (id: string | null) => {
      if (id) {
        setSelectedIds([id]);
        const el = elements.find((e) => e.id === id);
        if (el && hasExtension(el.type)) {
          const ext = getExtension(el.type);
          const b = ext.getBounds(el);
          const centerX = (b.left + b.right) / 2;
          const centerY = (b.top + b.bottom) / 2;
          setViewOffset({
            x: window.innerWidth / 2 - centerX * visualCellSize,
            y: window.innerHeight / 2 - centerY * visualCellSize,
          });
        }
      } else {
        setSelectedIds([]);
      }
    },
    [elements, visualCellSize],
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-(--os-bg) select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onContextMenu={handleContextMenu}
        className={`fixed inset-0 w-full h-full block bg-[#f1f5f9] ${
          isPanning ? "cursor-grabbing" : spacePressed ? "cursor-grab" : "cursor-default"
        }`}
      />

      {isEditing && selectedElement?.type === "text" && (
        <textarea
          className="fixed z-200 bg-white border-2 border-(--os-border-dark) font-mono resize-none outline-none overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
          style={{
            left: selectedElement.x * visualCellSize + viewOffset.x + (canvasRef.current?.getBoundingClientRect().left || 0),
            top: selectedElement.y * visualCellSize + viewOffset.y + (canvasRef.current?.getBoundingClientRect().top || 0),
            width:
              Math.max(
                ...(selectedElement as TextElement).text
                  .split("\n")
                  .map((l) => l.length),
                1,
              ) *
                visualCellSize +
              10,
            height:
              (selectedElement as TextElement).text.split("\n").length *
                visualCellSize +
              10,
            fontSize: `${visualCellSize}px`,
            lineHeight: `${visualCellSize}px`,
            padding: "2px",
          }}
          value={(selectedElement as TextElement).text}
          onChange={(e) => updateSelectedText(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            if (space?.id && selectedElement) {
              updateElementInDb(selectedElement.id, selectedElement);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
        />
      )}

      {/* Main UI Header - Glass Redesign */}
      <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <div className="glass-surface rounded-2xl p-2 flex items-center justify-between shadow-2xl pointer-events-auto border-white/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl text-zinc-900">
              <span className="font-bold text-xs tracking-tight">ascii_canva</span>
            </div>

            <div className="h-6 w-px bg-zinc-200" />

            <div className="flex items-center gap-1">
              {/* File Actions */}
              <div className="flex gap-1 bg-white/40 p-1 rounded-xl border border-white/40">
                <button
                  type="button"
                  onClick={saveProject}
                  className="genesis-button h-8 px-3 text-[11px]"
                >
                  Save
                </button>
                <label className="genesis-button h-8 px-3 text-[11px] cursor-pointer">
                  Open
                  <input type="file" onChange={loadProject} className="hidden" accept=".json" />
                </label>
                <button
                  type="button"
                  onClick={generateAscii}
                  className="genesis-button genesis-button-primary h-8 px-4 text-[11px]"
                >
                  Export ASCII
                </button>
              </div>

              {/* Tools */}
              <div className="flex gap-1 ml-2">
                {getAllExtensions().map((ext) => (
                  <button
                    key={ext.type}
                    type="button"
                    onClick={() => addExtensionElement(ext.type)}
                    className="genesis-button h-8 px-3"
                    title={`Add ${ext.label}`}
                  >
                    <ext.icon size={14} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAiChat(!showAiChat)}
              className={`genesis-button h-8 px-3 ${showAiChat ? "bg-green-100 border-green-200 text-green-700" : ""}`}
            >
              <Bot size={14} /> <span className="text-[11px] font-bold">AI</span>
            </button>
            
            <div className="h-6 w-px bg-zinc-300/50 mx-1" />

            <button onClick={() => setShowExplorer(!showExplorer)} className="genesis-button h-8 px-3" title="Explorer">
              <Layers size={14} />
            </button>
            <button onClick={() => setShowTutorial(true)} className="genesis-button h-8 px-3" title="Tutorial">
              <Book size={14} />
            </button>
            <Link href="/docs" target="_blank" className="genesis-button h-8 px-3" title="Documentation">
              <Puzzle size={14} />
            </Link>
            <button onClick={() => setShowSpacesModal(true)} className="genesis-button h-8 px-3" title="Spaces">
              <Users size={14} />
            </button>
            <button onClick={() => setShowApiKeyModal(true)} className="genesis-button h-8 px-3" title="API Keys">
              <Key size={14} />
            </button>
            
            <div className="flex gap-1 ml-2">
              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Contextual Property Bar */}
        {selectedIds.length > 0 && (
          <div className="glass-surface self-center rounded-xl px-4 py-2 flex items-center gap-6 shadow-xl border-white/20 animate-in slide-in-from-top-4 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Selection:</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-100">
                {selectedIds.length} object(s)
              </span>
            </div>
            <div className="flex gap-3">
              {selectedIds.length === 1 && (
                <button
                  type="button"
                  onClick={setCenter}
                  className={`flex items-center gap-1 text-[10px] font-bold hover:text-[#000080] transition-colors ${elements.find((e) => e.id === selectedIds[0])?.isCenter ? "text-blue-600" : "text-zinc-500"}`}
                >
                  <GripHorizontal size={14} /> Center
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteSelected()}
                className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed window-raised z-[110] shadow-[2px_2px_0_rgba(0,0,0,0.5)] p-[2px] min-w-[120px] bg-white"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
          role="menu"
        >
          {contextMenu.elementId && (
            <button
              type="button"
              onClick={() => {
                copySelected();
                closeContextMenu();
              }}
              className="w-full text-left px-4 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
            >
              <Copy size={14} className="text-zinc-400" /> Copy
            </button>
          )}

          {clipboard.length > 0 && (
            <button
              type="button"
              onClick={() => {
                paste(contextMenu.gridX, contextMenu.gridY);
                closeContextMenu();
              }}
              className="w-full text-left px-4 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
            >
              <FileText size={14} className="text-zinc-400" /> Paste
            </button>
          )}

          {(contextMenu.elementId || clipboard.length > 0) && (
            <div className="h-px bg-zinc-100 my-1 mx-1" />
          )}

          {contextMenu.pointIndex !== undefined ? (
            <button
              type="button"
              onClick={() => {
                deleteVectorPoint(
                  contextMenu.elementId!,
                  contextMenu.pointIndex!,
                );
                closeContextMenu();
              }}
              className="w-full text-left px-4 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete Point
            </button>
          ) : contextMenu.elementId ? (
            <button
              type="button"
              onClick={() => {
                deleteSelected(contextMenu.elementId!);
                closeContextMenu();
              }}
              className="w-full text-left px-4 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete
            </button>
          ) : null}
        </div>
      )}
      {showAscii && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent">
          <div className="window-raised w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[4px_4px_0_rgba(0,0,0,0.5)] m-4">
            <div className="title-bar cursor-default">
              <span className="flex items-center gap-2 font-bold">
                <FileText className="w-3 h-3" /> ASCII_Manifest.txt
              </span>
              <button
                type="button"
                onClick={() => setShowAscii(false)}
                className="retro-button px-1 py-0 leading-none h-4 w-4 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-2 flex-1 flex flex-col gap-2 overflow-hidden bg-(--os-bg)">
              <div className="window-sunken flex-1 overflow-auto p-2">
                <pre className="terminal-output whitespace-pre m-0 min-h-full">
                  {ascii}
                </pre>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={downloadAscii}
                  className="retro-button flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download .txt
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(ascii)}
                  className="retro-button flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  type="button"
                  onClick={() => setShowAscii(false)}
                  className="retro-button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CollabModal
        isOpen={showCollab}
        onClose={() => setShowCollab(false)}
        peerId={peerId}
        channelId={channelId}
        status={status}
        onStartHost={startCollaboration}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

      <SpaceManagerModal
        isOpen={showSpacesModal}
        onClose={() => setShowSpacesModal(false)}
        onSwitchSpace={(slug) => {
          window.location.href = `${window.location.pathname}?join=${slug}`;
        }}
        activeSpaceId={space?.id}
      />

      {showMarketplace && (
        <ExtensionMarketplace onClose={() => setShowMarketplace(false)} />
      )}

      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}

      <LayerManager
        isOpen={showExplorer}
        onClose={() => setShowExplorer(false)}
        elements={elements}
        setElements={setElements}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onDeleteElement={deleteSelected}
      />

      <AiChat 
        isOpen={showAiChat} 
        onClose={() => setShowAiChat(false)}
        spaceId={space?.id || ""}
        apiKey={activeApiKey}
        elements={elements}
        onNewElement={(el) => {
          // Handled by realtime subscriptions
        }}
      />

      <Taskbar status={status} />
    </div>
  );
};

export default AsciiEditor;
