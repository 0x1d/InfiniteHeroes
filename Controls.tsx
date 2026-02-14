
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ComicFace, TOTAL_PAGES } from './types';

interface ControlsProps {
    comicFaces: ComicFace[];
    currentSheetIndex: number;
    onJumpToSheet: (index: number) => void;
    onDownload: () => void;
    onReset: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ comicFaces, currentSheetIndex, onJumpToSheet, onDownload, onReset }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxSheet = Math.ceil(TOTAL_PAGES / 2);
    const readyPagesCount = comicFaces.filter(f => f.imageUrl && !f.isLoading).length;

    return (
        <div className="fixed bottom-4 md:bottom-auto md:top-6 right-4 md:right-6 z-[400] flex flex-col items-end gap-3 pointer-events-none">
            {/* Toggle Button */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`pointer-events-auto comic-btn w-14 h-14 flex items-center justify-center text-2xl transition-all duration-300 ${isExpanded ? 'bg-red-600 text-white rotate-90 scale-90' : 'bg-yellow-400 text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-110'}`}
                title={isExpanded ? "Close Controls" : "Open Controls"}
            >
                {isExpanded ? '✕' : '⚙️'}
            </button>

            {/* Command Center Card */}
            {isExpanded && (
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-3 pointer-events-auto max-w-[320px] animate-in slide-in-from-right-10 fade-in duration-300 rotate-[-1deg]">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-1">
                        <h3 className="font-comic text-xl text-red-600">COMMAND CENTER</h3>
                        <div className="bg-black text-white px-2 py-0.5 font-comic text-xs">READY: {readyPagesCount} / {TOTAL_PAGES + 1}</div>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col gap-1">
                        <p className="font-comic text-sm uppercase text-gray-500">Fast Navigation</p>
                        <div className="flex flex-wrap gap-1">
                            {Array.from({ length: maxSheet + 1 }).map((_, i) => {
                                const isCurrent = i === currentSheetIndex;
                                // Allow jumping to any page now, App.tsx will handle the loading/generation
                                const isAvailable = true; 
                                const sheetPages = i === 0 ? [0] : [i * 2 - 1, i * 2];
                                const isLoaded = sheetPages.every(p => {
                                    if (p > TOTAL_PAGES) return true;
                                    const face = comicFaces.find(f => f.pageIndex === p);
                                    return face && face.imageUrl && !face.isLoading;
                                });

                                return (
                                    <button 
                                        key={i}
                                        onClick={() => {
                                            onJumpToSheet(i);
                                            if (window.innerWidth < 768) setIsExpanded(false);
                                        }}
                                        className={`w-8 h-8 font-comic flex items-center justify-center border-2 border-black text-sm transition-all
                                            ${isCurrent ? 'bg-yellow-400 scale-110 z-10' : isLoaded ? 'bg-green-100 hover:bg-green-200' : 'bg-white hover:bg-gray-100'}
                                        `}
                                    >
                                        {i === 0 ? 'C' : i}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 italic font-sans">* Green indices are fully inked.</p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <button 
                            onClick={onDownload}
                            className="comic-btn bg-blue-500 text-white py-2 text-sm font-bold hover:bg-blue-400"
                        >
                            SAVE PDF
                        </button>
                        <button 
                            onClick={onReset}
                            className="comic-btn bg-red-600 text-white py-2 text-sm font-bold hover:bg-red-500"
                        >
                            RESET
                        </button>
                    </div>

                    <div className="text-[10px] font-mono text-gray-400 text-right mt-1">
                        STATUS_LINK: STABLE
                    </div>
                </div>
            )}
        </div>
    );
};
