
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ComicFace, GATE_PAGE } from './types';
import { LoadingFX } from './LoadingFX';

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[];
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
    onReInk: (pageNum: number) => void;
    onCancel: (pageNum: number) => void;
}

export const Panel: React.FC<PanelProps> = ({ face, allFaces, onChoice, onOpenBook, onDownload, onReset, onReInk, onCancel }) => {
    if (!face) return <div className="w-full h-full bg-gray-950" />;
    
    // Check for errors or stuck "idle" state that should be generating
    const isStuck = face.status === 'idle' && !face.isLoading && face.pageIndex !== undefined;

    if (face.error || isStuck) {
        return (
            <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-8 text-center border-4 border-red-600 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
                <span className="text-6xl mb-4">{face.error ? '😵' : '⏳'}</span>
                <p className="font-comic text-2xl text-white uppercase mb-4 leading-tight">{face.error ? 'Inking Blunder!' : 'Waiting for ink...'}</p>
                <p className="text-gray-400 text-sm mb-6 font-sans">{face.error ? 'The multiverse is glitching. Try re-inking this page.' : 'This page hasn\'t started yet.'}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); onReInk(face.pageIndex || 0); }}
                  className="comic-btn bg-yellow-400 text-black px-8 py-3 text-xl font-bold"
                >
                  RE-INK PAGE
                </button>
            </div>
        );
    }

    if (face.isLoading && !face.imageUrl) {
        return (
            <div className="w-full h-full relative">
                <LoadingFX status={face.status} />
                <div className="absolute bottom-10 inset-x-0 flex justify-center z-50">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onCancel(face.pageIndex || 0); }}
                        className="comic-btn bg-black text-white px-6 py-2 text-sm border-white/50 hover:bg-red-600 transition-colors"
                    >
                        CANCEL
                    </button>
                </div>
                {/* Visual Progress Bar */}
                <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-200 z-50">
                    <div className={`h-full bg-blue-500 transition-all duration-1000 ${face.status === 'scripting' ? 'w-1/3' : 'w-2/3'}`}></div>
                </div>
            </div>
        );
    }
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    return (
        <div className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : ''}`}>
            <div className="gloss"></div>
            
            {/* Re-Ink Button (Hidden by default, shown on hover) */}
            {!face.isLoading && face.imageUrl && (
              <button 
                onClick={(e) => { e.stopPropagation(); onReInk(face.pageIndex || 0); }}
                className="absolute top-4 right-4 z-[50] opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white border border-white/20 p-2 rounded hover:bg-black/90"
                title="Re-ink this page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            {face.imageUrl ? (
              <img src={face.imageUrl} alt="Comic panel" className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} />
            ) : face.isLoading ? (
              <LoadingFX status={face.status} />
            ) : null}
            
            {/* Read Button (Cover Only) */}
            {face.type === 'cover' && (
                 <div className="absolute bottom-20 inset-x-0 flex justify-center z-20">
                     <button onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                      disabled={!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl}
                      className="comic-btn bg-yellow-400 px-10 py-4 text-3xl font-bold animate-bounce disabled:animate-none disabled:bg-gray-400">
                         {(!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl) ? `PRINTING ADVENTURE...` : 'READ ISSUE #1'}
                     </button>
                 </div>
            )}

            {/* Finish Buttons (Back Cover Only) */}
            {face.type === 'back_cover' && (
                <div className="absolute bottom-24 inset-x-0 flex flex-col items-center gap-4 z-20 px-8">
                    <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="comic-btn bg-blue-500 text-white px-8 py-4 text-2xl font-bold w-full">SAVE PDF</button>
                    <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="comic-btn bg-green-500 text-white px-8 py-4 text-2xl font-bold w-full">NEW STORY</button>
                </div>
            )}
        </div>
    );
}
