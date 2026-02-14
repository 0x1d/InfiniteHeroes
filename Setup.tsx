
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { GENRES, LANGUAGES, TEXT_MODELS, IMAGE_MODELS, Persona } from './types';

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    selectedGenre: string;
    selectedLanguage: string;
    customPremise: string;
    richMode: boolean;
    selectedTextModel: string;
    selectedImageModel: string;
    onHeroUpload: (file: File) => void;
    onFriendUpload: (file: File) => void;
    onHeroNameChange: (name: string) => void;
    onFriendNameChange: (name: string) => void;
    onGenreChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onTextModelChange: (val: string) => void;
    onImageModelChange: (val: string) => void;
    onLaunch: () => void;
    isAnalyzing?: boolean;
}

const Footer = () => {
  const [remixIndex, setRemixIndex] = useState(0);
  const remixes = ["Add sounds to panels", "Animate panels with Veo 3", "Localize to Klingon", "Add a villain generator", "Print physical copies", "Add voice narration", "Create a shared universe"];

  useEffect(() => {
    const interval = setInterval(() => setRemixIndex(prev => (prev + 1) % remixes.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-3 px-6 flex flex-col md:flex-row justify-between items-center z-[300] border-t-4 border-yellow-400 font-comic">
        <div className="flex items-center gap-2 text-lg md:text-xl">
            <span className="text-yellow-400 font-bold">REMIX IDEA:</span>
            <span className="animate-pulse">{remixes[remixIndex]}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span className="text-gray-500 text-sm hidden md:inline">Build with Gemini</span>
            <a href="https://x.com/ammaar" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors text-xl">@ammaar</a>
        </div>
    </div>
  );
};

export const Setup: React.FC<SetupProps> = (props) => {
    if (!props.show && !props.isTransitioning) return null;

    return (
        <>
        <style>{`
             @keyframes knockout-exit {
                0% { transform: scale(1) rotate(1deg); }
                15% { transform: scale(1.1) rotate(-5deg); }
                100% { transform: translateY(-200vh) rotate(1080deg) scale(0.5); opacity: 1; }
             }
             @keyframes pow-enter {
                 0% { transform: translate(-50%, -50%) scale(0) rotate(-45deg); opacity: 0; }
                 30% { transform: translate(-50%, -50%) scale(1.5) rotate(10deg); opacity: 1; }
                 100% { transform: translate(-50%, -50%) scale(1.8) rotate(0deg); opacity: 0; }
             }
          `}</style>
        {props.isTransitioning && (
            <div className="fixed top-1/2 left-1/2 z-[210] pointer-events-none" style={{ animation: 'pow-enter 1s forwards ease-out' }}>
                <svg viewBox="0 0 200 150" className="w-[500px] h-[400px] drop-shadow-[0_10px_0_rgba(0,0,0,0.5)]">
                    <path d="M95.7,12.8 L110.2,48.5 L148.5,45.2 L125.6,74.3 L156.8,96.8 L119.4,105.5 L122.7,143.8 L92.5,118.6 L60.3,139.7 L72.1,103.2 L34.5,108.8 L59.9,79.9 L24.7,57.3 L62.5,54.4 L61.2,16.5 z" fill="#FFD700" stroke="black" strokeWidth="4"/>
                    <text x="100" y="95" textAnchor="middle" fontFamily="'Bangers', cursive" fontSize="70" fill="#DC2626" stroke="black" strokeWidth="2" transform="rotate(-5 100 75)">POW!</text>
                </svg>
            </div>
        )}
        
        <div className={`fixed inset-0 z-[200] overflow-y-auto`}
             style={{
                 background: props.isTransitioning ? 'transparent' : 'rgba(0,0,0,0.85)', 
                 backdropFilter: props.isTransitioning ? 'none' : 'blur(6px)',
                 animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
                 pointerEvents: props.isTransitioning ? 'none' : 'auto'
             }}>
          <div className="min-h-full flex items-center justify-center p-4 pb-32 md:pb-24">
            <div className="max-w-[900px] w-full bg-white p-4 md:p-5 rotate-1 border-[6px] border-black shadow-[12px_12px_0px_rgba(0,0,0,0.6)] text-center relative">
                <h1 className="font-comic text-5xl text-red-600 leading-none mb-4 tracking-wide inline-block mr-3" style={{textShadow: '2px 2px 0px black'}}>INFINITE HEROES</h1>
                
                <div className="flex flex-col md:flex-row gap-4 mb-4 text-left">
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1">1. THE CAST</div>
                        
                        <div className={`p-3 border-4 border-dashed ${props.hero ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-blue-50'} transition-colors relative`}>
                            <p className="font-comic text-lg uppercase font-bold text-blue-900 mb-1">HERO (REQUIRED)</p>
                            <input 
                                type="text"
                                placeholder="HERO NAME"
                                value={props.hero?.name || ''}
                                onChange={(e) => props.onHeroNameChange(e.target.value)}
                                className="w-full mb-2 p-1 border-2 border-black font-comic text-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {props.hero ? (
                                <div className="flex gap-3 items-center">
                                     <img src={`data:image/jpeg;base64,${props.hero.base64}`} alt="Hero" className="w-20 h-20 object-cover border-2 border-black rotate-[-2deg]" />
                                     <label className="comic-btn bg-yellow-400 text-black text-sm px-3 py-1 cursor-pointer">REPLACE <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} /></label>
                                </div>
                            ) : (
                                <label className="comic-btn bg-blue-500 text-white text-lg px-3 py-3 block w-full cursor-pointer text-center">UPLOAD HERO IMAGE <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} /></label>
                            )}
                        </div>

                        <div className={`p-3 border-4 border-dashed ${props.friend ? 'border-green-500 bg-green-50' : 'border-purple-300 bg-purple-50'} transition-colors`}>
                            <p className="font-comic text-lg uppercase font-bold text-purple-900 mb-1">CO-STAR (OPTIONAL)</p>
                            <input 
                                type="text"
                                placeholder="CO-STAR NAME"
                                value={props.friend?.name || ''}
                                onChange={(e) => props.onFriendNameChange(e.target.value)}
                                className="w-full mb-2 p-1 border-2 border-black font-comic text-lg bg-white text-black focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            {props.friend ? (
                                <div className="flex gap-3 items-center">
                                    <img src={`data:image/jpeg;base64,${props.friend.base64}`} alt="Co-Star" className="w-20 h-20 object-cover border-2 border-black rotate-[2deg]" />
                                    <label className="comic-btn bg-yellow-400 text-black text-sm px-3 py-1 cursor-pointer">REPLACE <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} /></label>
                                </div>
                            ) : (
                                <label className="comic-btn bg-purple-500 text-white text-lg px-3 py-3 block w-full cursor-pointer text-center">UPLOAD CO-STAR IMAGE <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} /></label>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1">2. THE PLOT & ENGINE</div>
                        <div className="bg-yellow-50 p-3 border-4 border-black flex flex-col gap-2">
                            <div>
                                <p className="font-comic text-sm font-bold text-gray-800 mb-1">STORY PREMISE / INSTRUCTIONS</p>
                                <textarea 
                                    value={props.customPremise} 
                                    onChange={(e) => props.onPremiseChange(e.target.value)} 
                                    placeholder="e.g. A space marine finds a magic sword on a deserted moon..." 
                                    className="w-full p-2 border-2 border-black font-sans text-sm text-black h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                                {props.isAnalyzing && (
                                    <p className="text-[10px] text-gray-500 italic mt-1 font-sans animate-pulse">Analyzing your hero for plot ideas...</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="font-comic text-[10px] font-bold text-gray-800">GENRE</p>
                                    <select value={props.selectedGenre} onChange={(e) => props.onGenreChange(e.target.value)} className="w-full font-comic text-xs p-1 border-2 border-black uppercase bg-white text-black outline-none">
                                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="font-comic text-[10px] font-bold text-gray-800">LANGUAGE</p>
                                    <select value={props.selectedLanguage} onChange={(e) => props.onLanguageChange(e.target.value)} className="w-full font-comic text-xs p-1 border-2 border-black uppercase bg-white text-black outline-none">
                                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-t-2 border-black/10 pt-2">
                                <div>
                                    <p className="font-comic text-[10px] font-bold text-gray-800">SCRIPT WRITER</p>
                                    <select value={props.selectedTextModel} onChange={(e) => props.onTextModelChange(e.target.value)} className="w-full font-comic text-[10px] p-1 border-2 border-black uppercase bg-white text-black outline-none">
                                        {TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="font-comic text-[10px] font-bold text-gray-800">LEAD ARTIST</p>
                                    <select value={props.selectedImageModel} onChange={(e) => props.onImageModelChange(e.target.value)} className="w-full font-comic text-[10px] p-1 border-2 border-black uppercase bg-white text-black outline-none">
                                        {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 font-comic text-xs cursor-pointer select-none text-black mt-1">
                                <input type="checkbox" checked={props.richMode} onChange={(e) => props.onRichModeChange(e.target.checked)} className="accent-black w-4 h-4" />
                                <span>NOVEL MODE (Rich Dialogue & Captions)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <button onClick={props.onLaunch} disabled={!props.hero || !props.hero.name || props.isTransitioning} className="comic-btn bg-red-600 text-white text-3xl px-6 py-3 w-full hover:bg-red-500 disabled:bg-gray-400">
                    {props.isTransitioning ? 'LAUNCHING...' : 'START ADVENTURE!'}
                </button>
            </div>
          </div>
        </div>
        <Footer />
        </>
    );
}
