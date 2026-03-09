import { Copy, Download, FileText, GripHorizontal, MousePointer2, Plus, Trash2, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { translateCanvasToAscii } from "../utils/ascii";

interface TextElement {
	id: string;
	text: string;
	x: number; // grid x
	y: number; // grid y
}

const CELL_SIZE = 14; // base visual size of a cell in pixels
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;

/**
 * Immersive Full-Screen Grid Canvas Editor
 */
const AsciiEditor: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [elements, setElements] = useState<TextElement[]>([
		{ id: "1", text: "GENESIS ASCII", x: 10, y: 10 },
		{ id: "2", text: "DRAG ELEMENTS", x: 10, y: 12 },
	]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [ascii, setAscii] = useState("");
	const [showAscii, setShowAscii] = useState(false);
	const [newText, setNewText] = useState("");
	const [gridSize, setGridSize] = useState({ cols: 80, rows: 40 });
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

	// Handle window resize to fill screen
	useEffect(() => {
		const handleResize = () => {
			const cols = Math.floor(window.innerWidth / visualCellSize);
			const rows = Math.floor(window.innerHeight / visualCellSize);
			setGridSize({ cols, rows });
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [visualCellSize]);

	// Handle zoom with Ctrl + Scroll and Pan with Scroll
	useEffect(() => {
		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey) {
				e.preventDefault();
				const delta = e.deltaY > 0 ? -0.1 : 0.1;
				setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
			} else {
				setViewOffset((prev) => ({
					x: prev.x - e.deltaX,
					y: prev.y - e.deltaY,
				}));
			}
		};

		const canvas = canvasRef.current;
		canvas?.addEventListener("wheel", handleWheel, { passive: false });
		return () => canvas?.removeEventListener("wheel", handleWheel);
	}, []);

	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Set canvas size to match window
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// Background
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Apply View Offset
		ctx.save();
		ctx.translate(viewOffset.x, viewOffset.y);

		// Grid Lines
		ctx.strokeStyle = "rgba(0,0,0,0.03)";
		ctx.lineWidth = 1;

		// Determine visible range to draw only what's on screen (infinite feel)
		const startCol = Math.floor(-viewOffset.x / visualCellSize);
		const endCol = startCol + Math.ceil(canvas.width / visualCellSize) + 1;
		const startRow = Math.floor(-viewOffset.y / visualCellSize);
		const endRow = startRow + Math.ceil(canvas.height / visualCellSize) + 1;

		for (let i = startCol; i <= endCol; i++) {
			ctx.beginPath();
			ctx.moveTo(i * visualCellSize, startRow * visualCellSize);
			ctx.lineTo(i * visualCellSize, endRow * visualCellSize);
			ctx.stroke();
		}
		for (let j = startRow; j <= endRow; j++) {
			ctx.beginPath();
			ctx.moveTo(startCol * visualCellSize, j * visualCellSize);
			ctx.lineTo(endCol * visualCellSize, j * visualCellSize);
			ctx.stroke();
		}

		// Draw Elements
		ctx.font = `${visualCellSize}px monospace`;
		ctx.textBaseline = "top";

		for (const el of elements) {
			const isSelected = el.id === selectedId;

			if (isSelected) {
				ctx.shadowColor = "transparent";
				ctx.shadowBlur = 0;
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;

				ctx.fillStyle = "rgba(0, 102, 255, 0.05)";
				ctx.fillRect(el.x * visualCellSize, el.y * visualCellSize, el.text.length * visualCellSize, visualCellSize);
				ctx.strokeStyle = "rgba(0, 102, 255, 0.2)";
				ctx.strokeRect(el.x * visualCellSize, el.y * visualCellSize, el.text.length * visualCellSize, visualCellSize);
			}

			// Subtle shadow for text elements
			ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
			ctx.shadowBlur = 4 * zoom;
			ctx.shadowOffsetX = 2 * zoom;
			ctx.shadowOffsetY = 2 * zoom;

			ctx.fillStyle = isSelected ? "#0066ff" : "#18181b";
			for (let i = 0; i < el.text.length; i++) {
				ctx.fillText(el.text[i], (el.x + i) * visualCellSize + visualCellSize * 0.15, el.y * visualCellSize);
			}
		}

		ctx.restore();
		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
	}, [elements, selectedId, visualCellSize, zoom, viewOffset]);

	useEffect(() => {
		draw();
	}, [draw]);

	const handleMouseDown = (e: React.MouseEvent) => {
		const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);

		const clickedEl = [...elements]
			.reverse()
			.find((el) => gridY === el.y && gridX >= el.x && gridX < el.x + el.text.length);

		if (clickedEl) {
			setSelectedId(clickedEl.id);
			setIsDragging(true);
			setDragOffset({ x: gridX - clickedEl.x, y: gridY - clickedEl.y });
		} else {
			setSelectedId(null);
			setIsPanning(true);
			setPanStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
		}
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (isDragging && selectedId) {
			const { x: gridX, y: gridY } = getGridCoords(e.clientX, e.clientY);
			const newX = gridX - dragOffset.x;
			const newY = gridY - dragOffset.y;
			setElements((prev) => prev.map((el) => (el.id === selectedId ? { ...el, x: newX, y: newY } : el)));
		} else if (isPanning) {
			setViewOffset({
				x: e.clientX - panStart.x,
				y: e.clientY - panStart.y,
			});
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
		setIsPanning(false);
	};

	// Touch Handlers for Mobile (Pinch to Zoom + Panning)
	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 2) {
			const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
			setTouchDist(dist);
		} else if (e.touches.length === 1) {
			const touch = e.touches[0];
			const { x: gridX, y: gridY } = getGridCoords(touch.clientX, touch.clientY);

			const clickedEl = [...elements]
				.reverse()
				.find((el) => gridY === el.y && gridX >= el.x && gridX < el.x + el.text.length);

			if (clickedEl) {
				setSelectedId(clickedEl.id);
				setIsDragging(true);
				setDragOffset({ x: gridX - clickedEl.x, y: gridY - clickedEl.y });
			} else {
				setSelectedId(null);
				setIsPanning(true);
				setPanStart({ x: touch.clientX - viewOffset.x, y: touch.clientY - viewOffset.y });
			}
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (e.touches.length === 2 && touchDist !== null) {
			const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
			const delta = dist / touchDist;
			setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * delta)));
			setTouchDist(dist);
		} else if (e.touches.length === 1) {
			const touch = e.touches[0];
			if (isDragging && selectedId) {
				const { x: gridX, y: gridY } = getGridCoords(touch.clientX, touch.clientY);
				const newX = gridX - dragOffset.x;
				const newY = gridY - dragOffset.y;
				setElements((prev) => prev.map((el) => (el.id === selectedId ? { ...el, x: newX, y: newY } : el)));
			} else if (isPanning) {
				setViewOffset({
					x: touch.clientX - panStart.x,
					y: touch.clientY - panStart.y,
				});
			}
		}
	};

	const handleTouchEnd = () => {
		setTouchDist(null);
		setIsDragging(false);
		setIsPanning(false);
	};

	const addElement = () => {
		if (!newText.trim()) return;
		const newEl: TextElement = {
			id: Math.random().toString(36).substr(2, 9),
			text: newText,
			x: Math.floor((window.innerWidth / 2 - viewOffset.x) / visualCellSize) - Math.floor(newText.length / 2),
			y: Math.floor((window.innerHeight / 2 - viewOffset.y) / visualCellSize),
		};
		setElements([...elements, newEl]);
		setNewText("");
		setSelectedId(newEl.id);
	};

	const deleteSelected = () => {
		if (!selectedId) return;
		setElements(elements.filter((el) => el.id !== selectedId));
		setSelectedId(null);
	};

	const generateAscii = () => {
		// To export precisely, we find the bounds of our elements
		if (elements.length === 0) return;

		const minX = Math.min(...elements.map((el) => el.x));
		const maxX = Math.max(...elements.map((el) => el.x + el.text.length));
		const minY = Math.min(...elements.map((el) => el.y));
		const maxY = Math.max(...elements.map((el) => el.y));

		const width = maxX - minX;
		const height = maxY - minY + 1;

		const grid: string[][] = Array.from({ length: height }, () =>
			Array.from({ length: width }, () => " "),
		);

		for (const el of elements) {
			for (let i = 0; i < el.text.length; i++) {
				const x = el.x - minX + i;
				const y = el.y - minY;
				if (x >= 0 && x < width && y >= 0 && y < height) {
					grid[y][x] = el.text[i];
				}
			}
		}

		setAscii(grid.map((row) => row.join("")).join("\n"));
		setShowAscii(true);
	};

	return (
		<div className="fixed inset-0 overflow-hidden bg-white select-none">
			<canvas
				ref={canvasRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				className="w-full h-full block cursor-crosshair"
			/>

			{/* Floating App Name Header */}
			<div className="fixed top-8 left-8 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-700">
				<div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-pulse" />
				<h1 className="text-xs font-black tracking-[0.3em] uppercase text-black dark:text-white">
					Genesis ASCII
				</h1>
			</div>
			
			{/* Decorative shadow for top-left visibility */}
			<div className="fixed top-0 left-0 w-48 h-48 bg-gradient-to-br from-black/[0.03] to-transparent pointer-events-none z-40 dark:from-white/[0.03]" />

			{/* Floating minimalist Action Bar */}
			<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/40 dark:border-zinc-800/50 shadow-2xl rounded-2xl animate-in slide-in-from-bottom-8 duration-500">
				<div className="flex items-center gap-2 pr-2 border-r border-black/5 dark:border-white/5">
					<input
						type="text"
						value={newText}
						onChange={(e) => setNewText(e.target.value)}
						placeholder="Add text..."
						className="w-32 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg focus:outline-none text-sm transition-all focus:w-48"
						onKeyDown={(e) => e.key === "Enter" && addElement()}
					/>
					<button
						type="button"
						onClick={addElement}
						className="p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:scale-105 transition-transform"
					>
						<Plus className="w-4 h-4" />
					</button>
				</div>

				{selectedId && (
					<button
						type="button"
						onClick={deleteSelected}
						className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
						title="Delete selected"
					>
						<Trash2 className="w-5 h-5" />
					</button>
				)}

				<button
					type="button"
					onClick={generateAscii}
					className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity font-bold text-sm shadow-lg shadow-black/10"
				>
					<GripHorizontal className="w-4 h-4" /> Export
				</button>
			</div>

			{/* ASCII Overlay Modal */}
			{showAscii && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
					<div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/10 flex flex-col">
						<div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
							<h3 className="font-bold flex items-center gap-2">
								<FileText className="w-5 h-5 opacity-40" /> ASCII Manifest
							</h3>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => navigator.clipboard.writeText(ascii)}
									className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
								>
									<Copy className="w-5 h-5" />
								</button>
								<button
									type="button"
									onClick={() => setShowAscii(false)}
									className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
						</div>
						<div className="flex-1 overflow-auto p-6 bg-zinc-50 dark:bg-zinc-950">
							<pre className="font-mono text-[10px] leading-[10px] tracking-[0px] whitespace-pre">
								{ascii}
							</pre>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AsciiEditor;
