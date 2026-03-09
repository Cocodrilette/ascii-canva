import { Copy, Download, FileText, GripHorizontal, MousePointer2, Plus, Square, Trash2, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { translateCanvasToAscii } from "../utils/ascii";

type ElementType = "text" | "box";

interface BaseElement {
	id: string;
	type: ElementType;
	x: number; // grid x
	y: number; // grid y
}

interface TextElement extends BaseElement {
	type: "text";
	text: string;
}

interface BoxElement extends BaseElement {
	type: "box";
	width: number;
	height: number;
}

type EditorElement = TextElement | BoxElement;

const CELL_SIZE = 14; // base visual size of a cell in pixels
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;

const AsciiEditor: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [elements, setElements] = useState<EditorElement[]>([
		{ id: "1", type: "text", text: "GENESIS ASCII", x: 10, y: 10 },
		{ id: "2", type: "box", x: 8, y: 8, width: 20, height: 6 },
	]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [capturedIds, setCapturedIds] = useState<string[]>([]);
	
	const [ascii, setAscii] = useState("");
	const [showAscii, setShowAscii] = useState(false);
	const [newText, setNewText] = useState("");
	const [zoom, setZoom] = useState(1);
	const [touchDist, setTouchDist] = useState<number | null>(null);
	const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState(false);
	const [panStart, setPanStart] = useState({ x: 0, y: 0 });

	const visualCellSize = CELL_SIZE * zoom;

	const getGridCoords = useCallback(
		(clientX: number, clientY: number) => {
			const x = Math.floor((clientX - viewOffset.x) / visualCellSize);
			const y = Math.floor((clientY - viewOffset.y) / visualCellSize);
			return { x, y };
		},
		[viewOffset, visualCellSize],
	);

	const getElementBounds = (el: EditorElement) => {
		if (el.type === "text") {
			return { left: el.x, top: el.y, right: el.x + el.text.length, bottom: el.y + 1 };
		}
		return { left: el.x, top: el.y, right: el.x + el.width, bottom: el.y + el.height };
	};

	const isInside = (child: EditorElement, parent: BoxElement) => {
		if (child.id === parent.id) return false;
		const cb = getElementBounds(child);
		const pb = getElementBounds(parent);
		return cb.left >= pb.left && cb.right <= pb.right && cb.top >= pb.top && cb.bottom <= pb.bottom;
	};

	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) return;

		if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(viewOffset.x, viewOffset.y);

		// Grid
		ctx.strokeStyle = "rgba(0,0,0,0.03)";
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
			ctx.beginPath();
			ctx.moveTo(startCol * visualCellSize, j * visualCellSize);
			ctx.lineTo(endCol * visualCellSize, j * visualCellSize);
		}
		ctx.stroke();

		// Spatial Culling + Rendering Order (Boxes then Text)
		const visibleElements = elements.filter(el => {
			const b = getElementBounds(el);
			const screenX = b.left * visualCellSize + viewOffset.x;
			const screenY = b.top * visualCellSize + viewOffset.y;
			const screenW = (b.right - b.left) * visualCellSize;
			const screenH = (b.bottom - b.top) * visualCellSize;
			return screenX + screenW > 0 && screenX < canvas.width && screenY + screenH > 0 && screenY < canvas.height;
		});

		const sortedElements = [...visibleElements].sort((a, b) => {
			if (a.type === b.type) return 0;
			return a.type === "box" ? -1 : 1;
		});

		ctx.font = `${visualCellSize}px monospace`;
		ctx.textBaseline = "top";

		for (const el of sortedElements) {
			const isSelected = el.id === selectedId;
			const b = getElementBounds(el);

			if (isSelected) {
				ctx.shadowColor = "transparent";
				ctx.shadowBlur = 0;
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;
				ctx.fillStyle = "rgba(0, 102, 255, 0.05)";
				ctx.fillRect(el.x * visualCellSize, el.y * visualCellSize, (b.right - b.left) * visualCellSize, (b.bottom - b.top) * visualCellSize);
				ctx.strokeStyle = "rgba(0, 102, 255, 0.2)";
				ctx.strokeRect(el.x * visualCellSize, el.y * visualCellSize, (b.right - b.left) * visualCellSize, (b.bottom - b.top) * visualCellSize);
			}

			ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
			ctx.shadowBlur = 4 * zoom;
			ctx.shadowOffsetX = 2 * zoom;
			ctx.shadowOffsetY = 2 * zoom;

			if (el.type === "text") {
				ctx.fillStyle = isSelected ? "#0066ff" : "#18181b";
				for (let i = 0; i < el.text.length; i++) {
					ctx.fillText(el.text[i], (el.x + i) * visualCellSize + visualCellSize * 0.15, el.y * visualCellSize);
				}
			} else if (el.type === "box") {
				ctx.strokeStyle = isSelected ? "#0066ff" : "#18181b";
				ctx.lineWidth = 2 * zoom;
				ctx.strokeRect(el.x * visualCellSize + 2, el.y * visualCellSize + 2, el.width * visualCellSize - 4, el.height * visualCellSize - 4);
				
				if (isSelected) {
					ctx.fillStyle = "#0066ff";
					ctx.fillRect((el.x + el.width) * visualCellSize - 6, (el.y + el.height) * visualCellSize - 6, 12, 12);
				}
			}
		}

		ctx.restore();
		ctx.shadowColor = "transparent";
	}, [elements, selectedId, visualCellSize, zoom, viewOffset]);

	useEffect(() => {
		let animationFrameId: number;
		const render = () => {
			draw();
			animationFrameId = window.requestAnimationFrame(render);
		};
		animationFrameId = window.requestAnimationFrame(render);
		return () => window.cancelAnimationFrame(animationFrameId);
	}, [draw]);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
		setIsResizing(false);
		setIsPanning(false);
		setCapturedIds([]);
	}, []);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);

			if (isResizing && selectedId) {
				setElements(prev => prev.map(el => {
					if (el.id === selectedId && el.type === "box") {
						const newWidth = Math.max(2, gridX - el.x + 1);
						const newHeight = Math.max(2, gridY - el.y + 1);
						const children = prev.filter(child => isInside(child, el as BoxElement));
						if (children.length > 0) {
							const minR = Math.max(...children.map(c => getElementBounds(c).right));
							const minB = Math.max(...children.map(c => getElementBounds(c).bottom));
							return { ...el, width: Math.max(newWidth, minR - el.x), height: Math.max(newHeight, minB - el.y) };
						}
						return { ...el, width: newWidth, height: newHeight };
					}
					return el;
				}));
			} else if (isDragging && selectedId) {
				const dx = gridX - dragOffset.x;
				const dy = gridY - dragOffset.y;
				if (dx !== 0 || dy !== 0) {
					setElements(prev => prev.map(el => {
						if (el.id === selectedId || capturedIds.includes(el.id)) {
							return { ...el, x: el.x + dx, y: el.y + dy };
						}
						return el;
					}));
					setDragOffset({ x: gridX, y: gridY });
				}
			} else if (isPanning) {
				setViewOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
			}
		},
		[isDragging, isResizing, isPanning, selectedId, getGridCoords, dragOffset, panStart, capturedIds],
	);

	const handleTouchEnd = useCallback(() => {
		setTouchDist(null);
		setIsDragging(false);
		setIsResizing(false);
		setIsPanning(false);
		setCapturedIds([]);
	}, []);

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			if (e.touches.length === 2 && touchDist !== null) {
				const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
				const delta = dist / touchDist;
				setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * delta)));
				setTouchDist(dist);
			} else if (e.touches.length === 1) {
				const touch = e.touches[0];
				const { x: gridX, y: gridY } = getGridCoords(touch.clientX, touch.clientY);

				if (isResizing && selectedId) {
					setElements(prev => prev.map(el => {
						if (el.id === selectedId && el.type === "box") {
							const newWidth = Math.max(2, gridX - el.x + 1);
							const newHeight = Math.max(2, gridY - el.y + 1);
							const children = prev.filter(child => isInside(child, el as BoxElement));
							if (children.length > 0) {
								const minR = Math.max(...children.map(c => getElementBounds(c).right));
								const minB = Math.max(...children.map(c => getElementBounds(c).bottom));
								return { ...el, width: Math.max(newWidth, minR - el.x), height: Math.max(newHeight, minB - el.y) };
							}
							return { ...el, width: newWidth, height: newHeight };
						}
						return el;
					}));
				} else if (isDragging && selectedId) {
					const dx = gridX - dragOffset.x;
					const dy = gridY - dragOffset.y;
					if (dx !== 0 || dy !== 0) {
						setElements(prev => prev.map(el => (el.id === selectedId || capturedIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el)));
						setDragOffset({ x: gridX, y: gridY });
					}
				} else if (isPanning) {
					setViewOffset({ x: touch.clientX - panStart.x, y: touch.clientY - panStart.y });
				}
			}
		},
		[isDragging, isResizing, isPanning, selectedId, getGridCoords, dragOffset, panStart, capturedIds, touchDist],
	);

	const handleWheel = useCallback((e: WheelEvent) => {
		if (e.ctrlKey) {
			e.preventDefault();
			const delta = e.deltaY > 0 ? -0.1 : 0.1;
			setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
		} else {
			setViewOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
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
	}, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, handleWheel]);

	const handleMouseDown = (e: React.MouseEvent) => {
		const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);
		const selected = elements.find(el => el.id === selectedId);
		
		if (selected?.type === "box") {
			const handleX = (selected.x + selected.width) * visualCellSize + viewOffset.x;
			const handleY = (selected.y + selected.height) * visualCellSize + viewOffset.y;
			if (Math.abs(e.clientX - handleX) < 15 && Math.abs(e.clientY - handleY) < 15) {
				setIsResizing(true);
				return;
			}
		}

		// Prioritize Text Selection
		const clickedText = [...elements].reverse().find(el => {
			if (el.type !== "text") return false;
			const b = getElementBounds(el);
			return gridX >= b.left && gridX < b.right && gridY >= b.top && gridY < b.bottom;
		});

		const clickedBox = [...elements].reverse().find(el => {
			if (el.type !== "box") return false;
			const b = getElementBounds(el);
			return gridX >= b.left && gridX < b.right && gridY >= b.top && gridY < b.bottom;
		});

		const clickedEl = clickedText || clickedBox;

		if (clickedEl) {
			setSelectedId(clickedEl.id);
			setIsDragging(true);
			setDragOffset({ x: gridX, y: gridY });
			if (clickedEl.type === "box") {
				const children = elements.filter(el => isInside(el, clickedEl as BoxElement));
				setCapturedIds(children.map(c => c.id));
			} else {
				setCapturedIds([]); // Ensure moving text doesn't move box
			}
		} else {
			setSelectedId(null);
			setIsPanning(true);
			setPanStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
		}
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 2) {
			const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
			setTouchDist(dist);
		} else if (e.touches.length === 1) {
			const touch = e.touches[0];
			const { x: gridX, y: gridY } = getGridCoords(touch.clientX, touch.clientY);
			const selected = elements.find(el => el.id === selectedId);
			if (selected?.type === "box") {
				const handleX = (selected.x + selected.width) * visualCellSize + viewOffset.x;
				const handleY = (selected.y + selected.height) * visualCellSize + viewOffset.y;
				if (Math.abs(touch.clientX - handleX) < 30 && Math.abs(touch.clientY - handleY) < 30) {
					setIsResizing(true);
					return;
				}
			}
			const clickedText = [...elements].reverse().find(el => {
				if (el.type !== "text") return false;
				const b = getElementBounds(el);
				return gridX >= b.left && gridX < b.right && gridY >= b.top && gridY < b.bottom;
			});
			const clickedBox = [...elements].reverse().find(el => {
				if (el.type !== "box") return false;
				const b = getElementBounds(el);
				return gridX >= b.left && gridX < b.right && gridY >= b.top && gridY < b.bottom;
			});
			const clickedEl = clickedText || clickedBox;
			if (clickedEl) {
				setSelectedId(clickedEl.id);
				setIsDragging(true);
				setDragOffset({ x: gridX, y: gridY });
				if (clickedEl.type === "box") {
					const children = elements.filter(el => isInside(el, clickedEl as BoxElement));
					setCapturedIds(children.map(c => c.id));
				} else {
					setCapturedIds([]);
				}
			} else {
				setSelectedId(null);
				setIsPanning(true);
				setPanStart({ x: touch.clientX - viewOffset.x, y: touch.clientY - viewOffset.y });
			}
		}
	};

	const addText = () => {
		const textToAdd = newText.trim() || "NEW TEXT";
		const newEl: TextElement = {
			id: Math.random().toString(36).substr(2, 9),
			type: "text",
			text: textToAdd,
			x: Math.floor((window.innerWidth / 2 - viewOffset.x) / visualCellSize) - Math.floor(textToAdd.length / 2),
			y: Math.floor((window.innerHeight / 2 - viewOffset.y) / visualCellSize),
		};
		setElements([...elements, newEl]);
		setNewText("");
		setSelectedId(newEl.id);
	};

	const updateSelectedText = (text: string) => {
		setElements(prev => prev.map(el => el.id === selectedId && el.type === "text" ? { ...el, text } : el));
	};

	const addBox = () => {
		const newEl: BoxElement = {
			id: Math.random().toString(36).substr(2, 9),
			type: "box",
			x: Math.floor((window.innerWidth / 2 - viewOffset.x) / visualCellSize) - 5,
			y: Math.floor((window.innerHeight / 2 - viewOffset.y) / visualCellSize) - 2,
			width: 10,
			height: 5
		};
		setElements([...elements, newEl]);
		setSelectedId(newEl.id);
	};

	const deleteSelected = () => {
		if (!selectedId) return;
		setElements(elements.filter(el => el.id !== selectedId));
		setSelectedId(null);
	};

	const generateAscii = () => {
		if (elements.length === 0) return;
		const minX = Math.min(...elements.map(el => getElementBounds(el).left));
		const maxX = Math.max(...elements.map(el => getElementBounds(el).right));
		const minY = Math.min(...elements.map(el => getElementBounds(el).top));
		const maxY = Math.max(...elements.map(el => getElementBounds(el).bottom));
		const width = maxX - minX;
		const height = maxY - minY;
		const grid: string[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => " "));
		for (const el of elements) {
			if (el.type === "box") {
				const x = el.x - minX;
				const y = el.y - minY;
				grid[y][x] = "+";
				grid[y][x + el.width - 1] = "+";
				grid[y + el.height - 1][x] = "+";
				grid[y + el.height - 1][x + el.width - 1] = "+";
				for (let i = 1; i < el.width - 1; i++) {
					grid[y][x + i] = "-";
					grid[y + el.height - 1][x + i] = "-";
				}
				for (let j = 1; j < el.height - 1; j++) {
					grid[y + j][x] = "|";
					grid[y + j][x + el.width - 1] = "|";
				}
			}
		}
		for (const el of elements) {
			if (el.type === "text") {
				for (let i = 0; i < el.text.length; i++) {
					const x = el.x - minX + i;
					const y = el.y - minY;
					if (x >= 0 && x < width && y >= 0 && y < height) {
						grid[y][x] = el.text[i];
					}
				}
			}
		}
		setAscii(grid.map(row => row.join("")).join("\n"));
		setShowAscii(true);
	};

	const selectedElement = elements.find(el => el.id === selectedId);

	return (
		<div className="fixed inset-0 overflow-hidden bg-white select-none">
			<canvas ref={canvasRef} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} className="w-full h-full block cursor-crosshair" />
			<div className="fixed top-8 left-8 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-700">
				<div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-pulse" />
				<h1 className="text-xs font-black tracking-[0.3em] uppercase text-black dark:text-white">Genesis ASCII</h1>
			</div>
			<div className="fixed top-0 left-0 w-48 h-48 bg-gradient-to-br from-black/[0.03] to-transparent pointer-events-none z-40 dark:from-white/[0.03]" />
			<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/40 dark:border-zinc-800/50 shadow-2xl rounded-2xl animate-in slide-in-from-bottom-8 duration-500">
				<div className="flex items-center gap-2 pr-2 border-r border-black/5 dark:border-white/5">
					<input
						type="text"
						value={selectedElement?.type === "text" ? selectedElement.text : newText}
						onChange={(e) => selectedElement?.type === "text" ? updateSelectedText(e.target.value) : setNewText(e.target.value)}
						placeholder={selectedId ? "Edit text..." : "Add text..."}
						className="w-32 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg focus:outline-none text-sm transition-all focus:w-48"
						onKeyDown={(e) => e.key === "Enter" && !selectedId && addText()}
					/>
					{!selectedId && (
						<button type="button" onClick={addText} className="p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:scale-105 transition-transform">
							<Plus className="w-4 h-4" />
						</button>
					)}
				</div>
				<div className="flex items-center gap-2 pr-2 border-r border-black/5 dark:border-white/5">
					<button type="button" onClick={addBox} className="p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:scale-105 transition-transform" title="Add Container Box">
						<Square className="w-4 h-4" />
					</button>
				</div>
				{selectedId && (
					<button type="button" onClick={deleteSelected} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors" title="Delete selected">
						<Trash2 className="w-5 h-5" />
					</button>
				)}
				<button type="button" onClick={generateAscii} className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity font-bold text-sm shadow-lg shadow-black/10">
					<GripHorizontal className="w-4 h-4" /> Export
				</button>
			</div>
			{showAscii && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
					<div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/10 flex flex-col">
						<div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
							<h3 className="font-bold flex items-center gap-2">
								<FileText className="w-5 h-5 opacity-40" /> ASCII Manifest
							</h3>
							<div className="flex gap-2">
								<button type="button" onClick={() => navigator.clipboard.writeText(ascii)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
									<Copy className="w-5 h-5" />
								</button>
								<button type="button" onClick={() => setShowAscii(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
									<X className="w-5 h-5" />
								</button>
							</div>
						</div>
						<div className="flex-1 overflow-auto p-6 bg-zinc-50 dark:bg-zinc-950">
							<pre className="font-mono text-[10px] leading-[10px] tracking-[0px] whitespace-pre">{ascii}</pre>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AsciiEditor;
