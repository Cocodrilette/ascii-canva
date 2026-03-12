import React, { useState } from "react";
import { X, MousePointer2, Move, Layers, Puzzle, Users, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

interface TutorialModalProps {
  onClose: () => void;
}

const steps = [
  {
    title: "Welcome to ascii_canva",
    icon: <Sparkles className="text-blue-500" size={32} />,
    content: "A collaborative workspace for character-based art. Create diagrams, mockups, or simple illustrations with precision.",
  },
  {
    title: "Navigate the Canvas",
    icon: <Move className="text-zinc-600" size={32} />,
    content: "Hold Space and drag to pan across the infinite workspace. Use your scroll wheel to zoom in and out.",
  },
  {
    title: "Select & Edit",
    icon: <MousePointer2 className="text-zinc-600" size={32} />,
    content: "Click objects to select them. Hold Command/Ctrl to select multiple. Drag on the background to use the marquee tool.",
  },
  {
    title: "Manage Layers",
    icon: <Layers className="text-zinc-600" size={32} />,
    content: "Use the Layers panel to organize your work. You can toggle visibility, lock elements, or change their stacking order.",
  },
  {
    title: "Extend Capabilities",
    icon: <Puzzle className="text-zinc-600" size={32} />,
    content: "Discover and install custom tools from the Marketplace to expand your creative possibilities.",
  },
  {
    title: "Collaborate in Real-time",
    icon: <Users className="text-zinc-600" size={32} />,
    content: "Share your space with others to build together. Changes sync instantly across all connected sessions.",
  },
];

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-xl flex items-center justify-center z-[200] animate-in fade-in duration-500">
      <div className="w-full max-w-lg p-12 flex flex-col items-center relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="w-full flex flex-col items-center text-center space-y-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-50 flex items-center justify-center shadow-inner animate-in zoom-in-50 duration-700">
            {steps[currentStep].icon}
          </div>
          
          <div className="space-y-4 max-w-sm">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              {steps[currentStep].title}
            </h2>
            <p className="text-lg text-zinc-500 font-medium leading-relaxed">
              {steps[currentStep].content}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="w-full mt-16 flex flex-col items-center space-y-8">
          {/* Progress Indicators */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentStep ? "w-8 bg-zinc-900" : "w-1.5 bg-zinc-200"
                }`}
              />
            ))}
          </div>

          <div className="w-full flex items-center justify-between">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(s => s - 1)}
              className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-zinc-900 disabled:opacity-0 transition-all"
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(s => s + 1)}
                className="px-8 py-3 rounded-full bg-zinc-900 text-white text-sm font-bold shadow-xl shadow-zinc-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-10 py-3 rounded-full bg-blue-600 text-white text-sm font-bold shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
