import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { useDebouncedCallback } from 'use-debounce';
import html2canvas from 'html2canvas';
import FileUploader from '../components/FileUploader';
import ArtworkForm from '../components/ArtworkForm';
import type { ArtworkMetadata } from '../components/ArtworkForm';

const API_URL = 'http://localhost:5000';

// --- TYPE DEFINITIONS ---
interface FrameState { show: boolean; width: number; height: number; color: string; }
interface MatState { show: boolean; width: number; height: number; }
interface TransformState {
  perspective: number;
  rotateX: number;
  rotateY: number;
  rotation: number;
  scale: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Artwork {
  _id: string;
  title: string;
  artist: string;
  year: string;
  imageUrl: string;
  fileUrl?: string; 
  metadata: { width: string, height: string };
  transform: TransformState;
  frame: FrameState;
  mat: MatState;
}
interface Scenario {
    _id: string;
    name: string;
    imageUrl: string;
    fileUrl?: string;
}

// --- INITIAL STATES ---
const initialTransform: Omit<TransformState, 'x' | 'y' | 'width' | 'height'> = {
  perspective: 1000, rotateX: 0, rotateY: 0, rotation: 0, scale: 1,
};
const initialFrameState: FrameState = { show: false, width: 20, height: 20, color: '#333333' };
const initialMatState: MatState = { show: false, width: 20, height: 20 };

// --- HELPER FUNCTION ---
const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const newWidth = 300; // Starting width
            const newHeight = newWidth / aspectRatio;
            resolve({ width: newWidth, height: newHeight });
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
};

// --- MAIN COMPONENT ---
const HomePage: React.FC = () => {
  // Core State
  const [history, setHistory] = useState<Artwork[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const artworks = history[historyIndex] || [];

  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);
  const [viewMode, setViewMode] = useState<'gallery' | 'editor'>('gallery');
  
  // Gallery State
  const [stagedArtworkIds, setStagedArtworkIds] = useState<Set<string>>(new Set());
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Editor State
  const [activeScenarioUrl, setActiveScenarioUrl] = useState<string>('');
  const [selectedEditorArtworkId, setSelectedEditorArtworkId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const setArtworksWithHistory = (newArtworks: Artwork[] | ((prev: Artwork[]) => Artwork[])) => {
    const newArtworksState = typeof newArtworks === 'function' ? newArtworks(artworks) : newArtworks;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newArtworksState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    fetch(`${API_URL}/api/artworks`).then(res => res.json()).then((data: Artwork[]) => {
      const artworksWithFullUrl = data.map(art => ({ ...art, fileUrl: `${API_URL}${art.imageUrl}` }));
      setHistory([[...artworksWithFullUrl]]);
      setHistoryIndex(0);
    }).catch(console.error);

    fetch(`${API_URL}/api/scenarios`).then(res => res.json()).then((data: Scenario[]) => {
        const scenariosWithUrls = data.map(sc => ({ ...sc, fileUrl: `${API_URL}${sc.imageUrl}` }));
        setCustomScenarios(scenariosWithUrls);
        if (scenariosWithUrls.length > 0) {
            setActiveScenarioUrl(scenariosWithUrls[0].fileUrl!);
        }
    }).catch(console.error);
  }, []);

  const stagedArtworks = useMemo(() => artworks.filter(art => stagedArtworkIds.has(art._id)), [artworks, stagedArtworkIds]);
  const selectedEditorArtwork = useMemo(() => artworks.find(art => art._id === selectedEditorArtworkId), [artworks, selectedEditorArtworkId]);

  // --- API HANDLERS ---
  const handleArtworkSubmit = async (metadata: ArtworkMetadata) => {
    if (!pendingFile) return;
    const dimensions = await getImageDimensions(pendingFile);
    const formData = new FormData();
    formData.append('artworkImage', pendingFile);
    formData.append('title', metadata.title);
    formData.append('artist', metadata.artist);
    formData.append('year', metadata.year);
    formData.append('metadata', JSON.stringify({ width: metadata.width, height: metadata.height }));
    formData.append('transform', JSON.stringify({ ...initialTransform, x: 50, y: 50, ...dimensions }));
    formData.append('frame', JSON.stringify(initialFrameState));
    formData.append('mat', JSON.stringify(initialMatState));

    try {
      const response = await fetch(`${API_URL}/api/artworks`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('No se pudo crear la obra de arte');
      const newArtwork: Artwork = await response.json();
      setArtworksWithHistory(prev => [...prev, { ...newArtwork, fileUrl: `${API_URL}${newArtwork.imageUrl}` }]);
      setIsFormVisible(false);
      setPendingFile(null);
    } catch (error) { console.error(error); }
  };

  const debouncedUpdateArtwork = useDebouncedCallback(async (artworkToUpdate: Artwork) => {
    const { _id, fileUrl, ...artworkData } = artworkToUpdate;
    const formData = new FormData();
    Object.entries(artworkData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    });
    try {
        await fetch(`${API_URL}/api/artworks/${_id}`, { method: 'PUT', body: formData });
    } catch (error) { console.error('Falló la actualización de la obra de arte:', error); }
  }, 1000);

  const updateArtworkState = (id: string, updates: { transform?: Partial<TransformState>, frame?: Partial<FrameState>, mat?: Partial<MatState> }) => {
    let updatedArtwork: Artwork | undefined;
    const newArtworks = artworks.map(art => {
        if (art._id === id) {
          const newArt = { ...art, transform: { ...art.transform, ...updates.transform }, frame: { ...art.frame, ...updates.frame }, mat: { ...art.mat, ...updates.mat } };
          updatedArtwork = newArt;
          return newArt;
        }
        return art;
      });
    setArtworksWithHistory(newArtworks);
    if (updatedArtwork) debouncedUpdateArtwork(updatedArtwork);
  };

  const handleArtworkDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro?')) return;
    try {
      await fetch(`${API_URL}/api/artworks/${id}`, { method: 'DELETE' });
      setArtworksWithHistory(prev => prev.filter(art => art._id !== id));
      setStagedArtworkIds(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet; });
    } catch (error) { console.error('No se pudo eliminar la obra de arte:', error); }
  };

  const handleScenarioUpload = async (file: File) => {
      const formData = new FormData();
      formData.append('scenarioImage', file);
      try {
          const response = await fetch(`${API_URL}/api/scenarios`, { method: 'POST', body: formData });
          if (!response.ok) throw new Error('No se pudo cargar el escenario');
          const newScenario: Scenario = await response.json();
          const newScenarioWithUrl = { ...newScenario, fileUrl: `${API_URL}${newScenario.imageUrl}` };
          setCustomScenarios(prev => [...prev, newScenarioWithUrl]);
          setActiveScenarioUrl(newScenarioWithUrl.fileUrl!);
      } catch (error) { console.error(error); }
  };

  const handleScenarioDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm('¿Eliminar este escenario personalizado?')) return;
      try {
          await fetch(`${API_URL}/api/scenarios/${id}`, { method: 'DELETE' });
          setCustomScenarios(prev => prev.filter(sc => sc._id !== id));
          if (activeScenarioUrl.includes(id) && customScenarios.length > 1) {
            setActiveScenarioUrl(customScenarios.find(sc => sc._id !== id)!.fileUrl!);
          } else if (customScenarios.length <= 1) {
            setActiveScenarioUrl('');
          }
      } catch (error) { console.error('No se pudo eliminar el escenario:', error); }
  }

  

  // --- HISTORY HANDLERS ---
  const handleUndo = () => {
      if (historyIndex > 0) setHistoryIndex(prev => prev - 1);
  }
  const handleRedo = () => {
      if (historyIndex < history.length - 1) setHistoryIndex(prev => prev + 1);
  }

  // --- OTHER HANDLERS ---
  const handleStagingToggle = (id: string) => {
    setStagedArtworkIds(prev => { const newSet = new Set(prev); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); return newSet; });
  };
  const handleDiscard = () => {
    if (!selectedEditorArtworkId) return;
    setStagedArtworkIds(prev => { const newSet = new Set(prev); newSet.delete(selectedEditorArtworkId); return newSet; });
    setSelectedEditorArtworkId(null);
  }
  const handleResetArtwork = () => {
      if (!selectedEditorArtwork) return;
      const { x, y, width, height } = selectedEditorArtwork.transform;
      updateArtworkState(selectedEditorArtwork._id, {
          transform: { ...initialTransform, x, y, width, height },
          frame: initialFrameState,
          mat: initialMatState,
      });
  }

  // --- RENDER FUNCTIONS ---
  const renderGallery = () => (
    <div className="min-h-screen bg-gray-100">
      {isFormVisible && <ArtworkForm onFormSubmit={handleArtworkSubmit} onCancel={() => setIsFormVisible(false)} />}
      <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-2xl font-bold flex items-center"><img src="/art_favicon.png" alt="logo" className="h-15 w-15 mr-2" /><span>Galería</span></h1>
        <button onClick={() => setViewMode('editor')} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400" disabled={stagedArtworkIds.size === 0}>Ir al Editor ({stagedArtworkIds.size})</button>
      </header>
      <main className="p-4 md:p-6">
        <div className="mb-6 p-4 border-2 border-dashed rounded-lg"><FileUploader onFileUpload={(file) => { setPendingFile(file); setIsFormVisible(true); }} label="Arrastra y suelta una nueva obra de arte o haz clic para subirla" /></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {artworks.map(art => (
            <div key={art._id} className={`relative border rounded-lg p-2 shadow-lg bg-white transition-all cursor-pointer ${stagedArtworkIds.has(art._id) ? 'shadow-blue-500/50 shadow-xl' : ''}`} onClick={() => handleStagingToggle(art._id)}>
              <div className="relative group">
                <img src={art.fileUrl} alt={art.title} className="w-full h-40 object-contain rounded-md mb-2 bg-gray-200" crossOrigin="anonymous" />
                <button onClick={(e) => handleArtworkDelete(art._id, e)} className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">X</button>
              </div>
              <div className="text-xs"><h2 className="font-semibold truncate">{art.title}</h2><p className="truncate">{art.artist}, {art.year}</p></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  const renderEditor = () => (
    <div className="flex flex-col md:flex-row h-screen bg-gray-800 text-white">
        <div className={`bg-gray-900 shadow-lg transition-all duration-300 ${isSidebarCollapsed ? 'w-0 p-0' : 'w-full md:w-1/3 md:max-w-sm p-4'}`}>
            <div className={`${isSidebarCollapsed ? 'hidden' : 'block'} h-full flex flex-col`}>
                <button onClick={() => setViewMode('gallery')} className="mb-4 w-full bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600 flex-shrink-0">← Volver a la Galería</button>
                <div className={selectedEditorArtwork ? 'h-1/2 overflow-y-auto -mr-4 pr-4' : 'mb-6 flex-shrink-0'}>
                    <h3 className="text-lg font-semibold mb-2">Escenario</h3>
                    <FileUploader onFileUpload={handleScenarioUpload} label="Carga una foto de tu escenario" />
                    <h4 className="text-md font-semibold mt-4 mb-2">ó</h4>
                    <h4 className="text-md font-semibold mt-4 mb-2">Elige uno de nuestros escenarios</h4>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {customScenarios.map(sc => (
                            <div key={sc._id} className="relative group">
                                <img src={sc.fileUrl || sc.imageUrl} alt={sc.name} onClick={() => setActiveScenarioUrl(sc.fileUrl || sc.imageUrl)} className={`h-16 w-full object-cover rounded cursor-pointer border-2 ${activeScenarioUrl === (sc.fileUrl || sc.imageUrl) ? 'border-blue-500' : 'border-transparent'}`} crossOrigin="anonymous" />
                                <button onClick={(e) => handleScenarioDelete(sc._id, e)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">X</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={selectedEditorArtwork ? 'h-1/2 overflow-y-auto -mr-4 pr-4' : 'flex-grow overflow-y-auto -mr-4 pr-4'}>
                {selectedEditorArtwork ? (
                <div>
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold truncate mb-2">Editando: {selectedEditorArtwork.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={handleUndo} disabled={historyIndex === 0} className="text-sm bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                            </button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="text-sm bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
                            </button>
                            <button onClick={handleResetArtwork} className="text-sm bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded">Reiniciar</button>
                            <button onClick={handleDiscard} className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded">Eliminar</button>
                        </div>
                    </div>
                    <div className="mb-4 p-2 rounded bg-gray-800"><h4 className="font-semibold mb-2 text-sm">Perspectiva y Rotación 3D</h4>{Object.keys(initialTransform).map(key => { const k = key as keyof typeof initialTransform; const labels: Record<keyof typeof initialTransform, string> = { perspective: 'Perspectiva', rotateX: 'Rotar X', rotateY: 'Rotar Y', rotation: 'Rotación', scale: 'Escala' }; return <div key={k}><label className="text-xs flex justify-between"><span>{labels[k]}</span><span>{selectedEditorArtwork.transform[k]}</span></label><input type="range" min={k === 'scale' ? 0.1 : -180} max={k === 'scale' ? 3 : 180} step={k === 'scale' ? 0.05 : 1} value={selectedEditorArtwork.transform[k]} onChange={e => updateArtworkState(selectedEditorArtwork._id, { transform: { [k]: Number(e.target.value) } })} className="w-full" /></div>; })}</div>
                    <div className="mb-4 p-2 rounded bg-gray-800"><h4 className="font-semibold mb-2 text-sm">Marco</h4><label className="flex items-center text-xs"><input type="checkbox" checked={selectedEditorArtwork.frame.show} onChange={e => updateArtworkState(selectedEditorArtwork._id, { frame: { show: e.target.checked } })} className="mr-2"/>Mostrar Marco</label>{selectedEditorArtwork.frame.show && <div className="mt-2 space-y-2"><input type="color" value={selectedEditorArtwork.frame.color} onChange={e => updateArtworkState(selectedEditorArtwork._id, { frame: { color: e.target.value } })} className="w-full h-8 p-0 border-none"/><div><label className="text-xs">Ancho: {selectedEditorArtwork.frame.width}px</label><input type="range" min="0" max="100" value={selectedEditorArtwork.frame.width} onChange={e => updateArtworkState(selectedEditorArtwork._id, { frame: { width: Number(e.target.value) } })} className="w-full"/></div><div><label className="text-xs">Alto: {selectedEditorArtwork.frame.height}px</label><input type="range" min="0" max="100" value={selectedEditorArtwork.frame.height} onChange={e => updateArtworkState(selectedEditorArtwork._id, { frame: { height: Number(e.target.value) } })} className="w-full"/></div></div>}</div>
                    <div className="p-2 rounded bg-gray-800"><h4 className="font-semibold mb-2 text-sm">Marialuisa</h4><label className="flex items-center text-xs"><input type="checkbox" checked={selectedEditorArtwork.mat.show} onChange={e => updateArtworkState(selectedEditorArtwork._id, { mat: { show: e.target.checked } })} className="mr-2"/>Mostrar Marialuisa</label>{selectedEditorArtwork.mat.show && <div className="mt-2 space-y-2"><div><label className="text-xs">Ancho: {selectedEditorArtwork.mat.width}px</label><input type="range" min="0" max="150" value={selectedEditorArtwork.mat.width} onChange={e => updateArtworkState(selectedEditorArtwork._id, { mat: { width: Number(e.target.value) } })} className="w-full"/></div><div><label className="text-xs">Alto: {selectedEditorArtwork.mat.height}px</label><input type="range" min="0" max="150" value={selectedEditorArtwork.mat.height} onChange={e => updateArtworkState(selectedEditorArtwork._id, { mat: { height: Number(e.target.value) } })} className="w-full"/></div></div>}</div>
                </div>
                ) : <div className="text-center text-gray-400 p-4">Selecciona una obra de arte en la escena para editar sus propiedades.</div>}
                </div>
            </div>
        </div>
      <div ref={canvasRef} id="canvas-container" className="flex-grow relative h-1/2 md:h-full" style={{ backgroundImage: `url(${activeScenarioUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} onClick={() => setSelectedEditorArtworkId(null)}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute top-2 left-2 z-30 bg-gray-800 bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75">
            {isSidebarCollapsed ? '>' : '<'}
        </button>
        {stagedArtworks.map(art => {
          const isSelected = art._id === selectedEditorArtworkId;
          const perspectiveStyle = { transform: `perspective(${art.transform.perspective}px) rotateX(${art.transform.rotateX}deg) rotateY(${art.transform.rotateY}deg) rotate(${art.transform.rotation}deg) scale(${art.transform.scale})` };
          const frameStyle = art.frame.show ? { backgroundColor: art.frame.color, padding: `${art.frame.height}px ${art.frame.width}px` } : {};
          const matStyle = art.mat.show ? { background: '#f1f1f1', padding: `${art.mat.height}px ${art.mat.width}px` } : {};
          return <Rnd key={art._id} size={{ width: art.transform.width, height: art.transform.height }} position={{ x: art.transform.x, y: art.transform.y }} onDragStart={() => setSelectedEditorArtworkId(art._id)} onDragStop={(e, d) => updateArtworkState(art._id, { transform: { x: d.x, y: d.y } })} enableResizing={false} bounds="parent" className={`z-10 ${isSelected ? 'z-20' : ''}`} onClick={(e) => { e.stopPropagation(); setSelectedEditorArtworkId(art._id); }}><div style={perspectiveStyle} className={`w-full h-full ${isSelected ? 'outline outline-4 outline-blue-500' : ''}`}><div style={frameStyle} className="w-full h-full shadow-lg"><div style={matStyle} className="w-full h-full shadow-inner"><img src={art.fileUrl} alt={art.title} className="w-full h-full object-contain pointer-events-none" crossOrigin="anonymous" /></div></div></div></Rnd>;
        })}
      </div>
    </div>
  );

  return viewMode === 'editor' ? renderEditor() : renderGallery();
};

export default HomePage;