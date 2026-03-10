import React, { useState } from "react";
import { X, MousePointer2, Move, Layers, Puzzle, Users, ChevronRight, ChevronLeft } from "lucide-react";

interface TutorialModalProps {
  onClose: () => void;
}

const steps = [
  {
    title: "Welcome to ascii_canva!",
    icon: <Puzzle className="text-[#000080]" size={32} />,
    content: "This is a collaborative ASCII art workspace. You can create diagrams, UI mockups, or simple art using character-based primitives.",
  },
  {
    title: "Basic Navigation",
    icon: <Move className="text-[#000080]" size={32} />,
    content: "Hold [SPACEBAR] and drag your mouse to pan around the infinite canvas. You can also use the Middle Mouse Button.",
  },
  {
    title: "Selecting Objects",
    icon: <MousePointer2 className="text-[#000080]" size={32} />,
    content: "Click an object to select it. Hold [CTRL] to select multiple. Drag on the background to start a Marquee selection box.",
  },
  {
    title: "Layers & Grouping",
    icon: <Layers className="text-[#000080]" size={32} />,
    content: "Open the 'Layers' panel to manage object visibility and order. Elements inside a Box move together automatically!",
  },
  {
    title: "Community Marketplace",
    icon: <Puzzle className="text-[#000080]" size={32} />,
    content: "Browse and install custom extensions from the Marketplace. You can even publish your own logic for others to use.",
  },
  {
    title: "Collaboration",
    icon: <Users className="text-[#000080]" size={32} />,
    content: "Click 'Collaborate' to generate a join link. Share it with friends to draw together in real-time!",
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] font-['MS_Sans_Serif']">
      <div className="w-[400px] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] bg-[#C0C0C0] shadow-xl">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white flex items-center justify-between px-2 py-1 select-none">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-['VT323']">TUTORIAL.EXE</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#C0C0C0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-[#808080] flex items-center justify-center text-black active:border-inset p-0"
          >
            <X size={10} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-white border-t-2 border-l-2 border-[#808080] border-r-2 border-b-2 border-white rounded-lg">
            {steps[currentStep].icon}
          </div>
          <h2 className="text-sm font-bold uppercase tracking-tight text-[#000080]">
            {steps[currentStep].title}
          </h2>
          <p className="text-[11px] leading-relaxed opacity-80 min-h-[40px]">
            {steps[currentStep].content}
          </p>
        </div>

        {/* Footer / Navigation */}
        <div className="p-3 bg-[#C0C0C0] border-t border-[#808080] flex items-center justify-between">
          <div className="text-[10px] font-bold opacity-50">
            STEP {currentStep + 1} OF {steps.length}
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(s => s - 1)}
              className="retro-button px-3 py-1 flex items-center gap-1 text-[10px] disabled:opacity-30"
            >
              <ChevronLeft size={12} /> Back
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(s => s + 1)}
                className="retro-button px-3 py-1 flex items-center gap-1 text-[10px] font-bold"
              >
                Next <ChevronRight size={12} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="retro-button px-6 py-1 text-[10px] font-bold text-green-700 border-green-700"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
