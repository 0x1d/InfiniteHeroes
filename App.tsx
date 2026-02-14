
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import jsPDF from 'jspdf';
import { 
  MAX_STORY_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, INITIAL_PAGES, BATCH_SIZE, 
  GENRES, TONES, LANGUAGES, TEXT_MODELS, IMAGE_MODELS, 
  ComicFace, Beat, Persona, FaceStatus 
} from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { Controls } from './Controls';

const MODEL_VISION_NAME = "gemini-3-flash-preview";

const App: React.FC = () => {
  const { validateApiKey, setShowApiKeyDialog, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  const [hero, setHeroState] = useState<Persona | null>(null);
  const [friend, setFriendState] = useState<Persona | null>(null);
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [customPremise, setCustomPremise] = useState("");
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [selectedTextModel, setSelectedTextModel] = useState(TEXT_MODELS[0].id);
  const [selectedImageModel, setSelectedImageModel] = useState(IMAGE_MODELS[0].id);

  const heroRef = useRef<Persona | null>(null);
  const friendRef = useRef<Persona | null>(null);
  const styleContextRef = useRef<string>("");

  const setHero = (p: Persona | null) => { setHeroState(p); heroRef.current = p; };
  const setFriend = (p: Persona | null) => { setFriendState(p); friendRef.current = p; };
  
  const [comicFaces, setComicFaces] = useState<ComicFace[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const generatingPages = useRef(new Set<number>());
  const historyRef = useRef<ComicFace[]>([]);

  // Suggest story whenever genre changes or hero is uploaded
  useEffect(() => {
    if (hero?.base64 && !isStarted && showSetup) {
      suggestStory(hero.base64);
    }
  }, [selectedGenre, hero?.base64]);

  useEffect(() => {
    if (!isStarted) return;
    
    const endPage = Math.min(currentSheetIndex === 0 ? 0 : currentSheetIndex * 2, TOTAL_PAGES);
    const neededPages = [];
    for (let i = 0; i <= endPage; i++) {
        const face = comicFaces.find(f => f.pageIndex === i);
        if ((!face || (face.status === 'idle' && !face.isLoading)) && !generatingPages.current.has(i)) {
            neededPages.push(i);
        }
    }

    if (neededPages.length > 0) {
        generateBatch(0, endPage + 1);
    }
  }, [currentSheetIndex, isStarted, comicFaces]);

  // Always use this function to get a fresh instance of GoogleGenAI with the latest key
  const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

  const handleAPIError = (e: any) => {
    const msg = String(e);
    if (msg.includes('Requested entity') || msg.includes('API_KEY_INVALID') || msg.toLowerCase().includes('permission denied')) {
      setShowApiKeyDialog(true);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const suggestStory = async (base64: string) => {
    if (!base64) return;
    setIsAnalyzing(true);
    try {
      const ai = getAI();
      const res = await ai.models.generateContent({
        model: MODEL_VISION_NAME,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            { text: `Analyze this character. Given the genre is "${selectedGenre}", provide: 1. A 1-sentence comic book plot premise fitting this character and genre. 2. A 1-sentence description of the visual art style. Format clearly as PREMISE: [text] and STYLE: [text].` }
          ]
        }
      });
      const text = res.text || "";
      const premiseMatch = text.match(/PREMISE:\s*([^\n]*)/i);
      const styleMatch = text.match(/STYLE:\s*([^\n]*)/i);
      
      if (premiseMatch) setCustomPremise(premiseMatch[1].trim());
      if (styleMatch) styleContextRef.current = styleMatch[1].trim();
    } catch (e) {
      console.error("Suggestion generation failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateBeat = async (pageNum: number): Promise<Beat> => {
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
    
    const relevantHistory = historyRef.current
        .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
        .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    const historyText = relevantHistory.map(p => 
      `[Page ${p.pageIndex}] (Caption: "${p.narrative?.caption || ''}") (Dialogue: "${p.narrative?.dialogue || ''}")`
    ).join('\n');

    const prompt = `
      You are writing Page ${pageNum} of a ${MAX_STORY_PAGES}-page comic book titled "Infinite Heroes".
      TARGET LANGUAGE: ${langName}.
      GENRE: ${selectedGenre}. TONE: ${storyTone}.
      USER INSTRUCTIONS/PREMISE: ${customPremise || "A thrilling comic book adventure."}
      MODE: ${richMode ? "RICH NOVEL MODE - Use descriptive captions and meaningful dialogue." : "ACTION MODE - Short captions, snappy dialogue."}
      
      CHARACTERS:
      - HERO NAME: ${heroRef.current?.name || "The Hero"}
      - SIDEKICK NAME: ${friendRef.current?.name || "None"}
      
      HISTORY:
      ${historyText || "This is the first page."}
      
      REQUIREMENT: Continue the narrative flow. Ensure the character names are used correctly in dialogue. 
      This is a linear story. No choices needed.
    `;

    try {
        const ai = getAI();
        const res = await ai.models.generateContent({ 
            model: selectedTextModel, 
            contents: prompt, 
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        caption: { type: Type.STRING },
                        dialogue: { type: Type.STRING },
                        scene: { type: Type.STRING },
                        focus_char: { type: Type.STRING, enum: ['hero', 'friend', 'other'] }
                    },
                    required: ["caption", "scene", "focus_char"]
                }
            } 
        });
        const parsed = JSON.parse(res.text || "{}");
        return parsed as Beat;
    } catch (e) {
        handleAPIError(e);
        throw e;
    }
  };

  const generateImage = async (beat: Beat, type: ComicFace['type']): Promise<string> => {
    const parts: any[] = [];
    if (heroRef.current?.base64) {
        parts.push({ text: `HERO CHARACTER REFERENCE (Name: ${heroRef.current.name}):` }, { inlineData: { mimeType: 'image/jpeg', data: heroRef.current.base64 } });
    }
    if (friendRef.current?.base64) {
        parts.push({ text: `SIDEKICK CHARACTER REFERENCE (Name: ${friendRef.current.name}):` }, { inlineData: { mimeType: 'image/jpeg', data: friendRef.current.base64 } });
    }

    let styleStr = styleContextRef.current || `${selectedGenre} comic book art style, high quality ink and vibrant colors`;
    let promptText = `STRICT ART STYLE: ${styleStr}. MAINTAIN VISUAL CONSISTENCY. `;
    
    if (type === 'cover') {
        promptText += `DRAMATIC COMIC COVER. Title: "INFINITE HEROES". Feature the Hero ${heroRef.current?.name || ''} from reference in a powerful pose. Background ${selectedGenre} theme.`;
    } else if (type === 'back_cover') {
        promptText += `CINEMATIC BACK COVER. Hero ${heroRef.current?.name || ''} walking away into distance. Text: "THE END".`;
    } else {
        promptText += `DYNAMIC COMIC PANEL. SCENE: ${beat.scene}. CAPTION: "${beat.caption}" ${beat.dialogue ? `DIALOGUE: "${beat.dialogue}"` : ''}. 
        Show character ${beat.focus_char === 'hero' ? heroRef.current?.name : (beat.focus_char === 'friend' ? friendRef.current?.name : 'someone')} as the focal point.`;
    }

    parts.push({ text: promptText });

    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
          model: selectedImageModel,
          contents: { parts },
          config: { 
            imageConfig: { 
              aspectRatio: '3:4',
              // imageSize is only supported by gemini-3-pro-image-preview
              ...(selectedImageModel === 'gemini-3-pro-image-preview' ? { imageSize: '1K' } : {})
            } 
          }
        });
        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!part?.inlineData?.data) throw new Error("No image data");
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    } catch (e) { 
        handleAPIError(e);
        throw e;
    }
  };

  const updateFaceState = (id: string, updates: Partial<ComicFace>) => {
      setComicFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      const idx = historyRef.current.findIndex(f => f.id === id);
      if (idx !== -1) {
          historyRef.current[idx] = { ...historyRef.current[idx], ...updates };
      }
  };

  const cancelGeneration = (pageNum: number) => {
    generatingPages.current.delete(pageNum);
    const id = pageNum === 0 ? 'cover' : `page-${pageNum}`;
    updateFaceState(id, { isLoading: false, status: 'error', error: true });
  };

  const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type']) => {
      if (generatingPages.current.has(pageNum)) return;
      generatingPages.current.add(pageNum);
      
      updateFaceState(faceId, { isLoading: true, error: false, status: 'scripting' });
      
      try {
        let beat: Beat = { caption: "...", scene: "...", focus_char: 'hero' };
        if (type === 'story') {
            beat = await generateBeat(pageNum);
        }
        
        if (!generatingPages.current.has(pageNum)) return;

        updateFaceState(faceId, { narrative: beat, status: 'inking' });
        
        const url = await generateImage(beat, type);

        if (!generatingPages.current.has(pageNum)) return;

        updateFaceState(faceId, { imageUrl: url, isLoading: false, status: 'complete' });
      } catch (e) {
        updateFaceState(faceId, { isLoading: false, error: true, status: 'error' });
      } finally {
        generatingPages.current.delete(pageNum);
      }
  };

  const reInkPage = (pageNum: number) => {
    const faceId = pageNum === 0 ? 'cover' : `page-${pageNum}`;
    generatingPages.current.delete(pageNum);
    updateFaceState(faceId, { imageUrl: undefined, status: 'idle', isLoading: false, error: false });
    generateSinglePage(faceId, pageNum, pageNum === 0 ? 'cover' : (pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story'));
  };

  const generateBatch = async (startPage: number, count: number) => {
      const pagesToGen: number[] = [];
      for (let i = 0; i < count; i++) {
          const p = startPage + i;
          if (p <= TOTAL_PAGES) {
              const face = comicFaces.find(f => f.pageIndex === p);
              if ((!face || (face.status === 'idle' && !face.isLoading)) && !generatingPages.current.has(p)) {
                  pagesToGen.push(p);
              }
          }
      }
      if (pagesToGen.length === 0) return;

      for (const pageNum of pagesToGen) {
          const faceId = pageNum === 0 ? 'cover' : `page-${pageNum}`;
          const type = pageNum === BACK_COVER_PAGE ? 'back_cover' : (pageNum === 0 ? 'cover' : 'story');
          await generateSinglePage(faceId, pageNum, type);
      }
  };

  const launchStory = async () => {
    if (!heroRef.current || !heroRef.current.name) return;
    
    // Mandated for Pro Image model
    if (selectedImageModel === 'gemini-3-pro-image-preview') {
      if (!(await validateApiKey())) return;
    }

    setIsTransitioning(true);
    
    const initialFaces: ComicFace[] = [];
    for (let i = 0; i <= TOTAL_PAGES; i++) {
        const id = i === 0 ? 'cover' : `page-${i}`;
        const type = i === BACK_COVER_PAGE ? 'back_cover' : (i === 0 ? 'cover' : 'story');
        initialFaces.push({ id, type, choices: [], isLoading: false, status: 'idle', pageIndex: i });
    }
    setComicFaces(initialFaces);
    historyRef.current = [...initialFaces];
    generatingPages.current.clear();
    setCurrentSheetIndex(0);

    generateSinglePage('cover', 0, 'cover');
    
    setTimeout(async () => {
        setIsStarted(true);
        setShowSetup(false);
        setIsTransitioning(false);
        await generateBatch(1, INITIAL_PAGES);
    }, 1100);
  };

  const handleHeroUpload = async (file: File) => {
       try { 
         const base64 = await fileToBase64(file); 
         setHero({ base64, name: hero?.name || "", desc: "The Hero" }); 
       } catch (e) { alert("Upload failed"); }
  };

  const handleFriendUpload = async (file: File) => {
       try { 
         const base64 = await fileToBase64(file); 
         setFriend({ base64, name: friend?.name || "", desc: "The Sidekick" }); 
       } catch (e) { alert("Upload failed"); }
  };

  const handleHeroNameChange = (name: string) => {
    setHero(hero ? { ...hero, name } : { base64: "", name, desc: "The Hero" });
  };

  const handleFriendNameChange = (name: string) => {
    setFriend(friend ? { ...friend, name } : { base64: "", name, desc: "The Sidekick" });
  };

  const resetApp = () => { window.location.reload(); };

  const downloadPDF = () => {
    const PAGE_WIDTH = 480;
    const PAGE_HEIGHT = 720;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
    const pagesToPrint = comicFaces
      .filter(face => face.imageUrl && !face.isLoading)
      .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    if (pagesToPrint.length === 0) return;

    pagesToPrint.forEach((face, index) => {
        if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
        if (face.imageUrl) doc.addImage(face.imageUrl, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT, undefined, 'FAST');
    });
    doc.save('Infinite-Heroes-Comic.pdf');
  };

  return (
    <div className="comic-scene">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
      <Setup 
          show={showSetup} isTransitioning={isTransitioning} hero={hero} friend={friend}
          selectedGenre={selectedGenre} selectedLanguage={selectedLanguage} customPremise={customPremise} richMode={richMode}
          selectedTextModel={selectedTextModel} selectedImageModel={selectedImageModel}
          onHeroUpload={handleHeroUpload} onFriendUpload={handleFriendUpload} 
          onHeroNameChange={handleHeroNameChange} onFriendNameChange={handleFriendNameChange}
          onGenreChange={setSelectedGenre} onLanguageChange={setSelectedLanguage} onPremiseChange={setCustomPremise} 
          onRichModeChange={setRichMode}
          onTextModelChange={setSelectedTextModel} onImageModelChange={setSelectedImageModel}
          onLaunch={launchStory} isAnalyzing={isAnalyzing}
      />
      {isStarted && !showSetup && (
          <Controls comicFaces={comicFaces} currentSheetIndex={currentSheetIndex} onJumpToSheet={setCurrentSheetIndex} onDownload={downloadPDF} onReset={resetApp} />
      )}
      <Book 
          comicFaces={comicFaces} currentSheetIndex={currentSheetIndex} isStarted={isStarted} isSetupVisible={showSetup && !isTransitioning}
          onSheetClick={idx => setCurrentSheetIndex(idx)} onChoice={() => {}} onOpenBook={() => setCurrentSheetIndex(1)} 
          onDownload={downloadPDF} onReset={resetApp} onReInk={reInkPage} onCancel={cancelGeneration}
      />
    </div>
  );
};

export default App;
