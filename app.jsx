const { useState, useEffect, useRef } = React;

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/public/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(err => console.log('SW registration failed:', err));
  });
}

const App = () => {
  // App registry for easier scaling as more tools are added
  const apps = [
    {
      id: 'inspection',
      name: 'Inspection Builder',
      description:
        'Helps build inspection note templates. Generate clean notes quickly.',
      component: InspectionBuilder,
    },
    {
      id: 'photo',
      name: 'Photo Report',
      description:
        'Create a photo report and export as PDF. Upload, caption, rotate; drag to reorder photos in the grid.',
      component: PhotoReportBuilder,
    },
  ];

  const [activeTab, setActiveTab] = useState(apps[0].id);
  const ActiveComponent = apps.find(a => a.id === activeTab)?.component || (() => null);
  const activeDescription = apps.find(a => a.id === activeTab)?.description || '';

  return (
    <div>
      <h1>Adjuster Tools</h1>
      <div className="tabs">
        {apps.map(app => (
          <button
            key={app.id}
            className={`tab-button ${activeTab === app.id ? 'active' : ''}`}
            onClick={() => setActiveTab(app.id)}
          >
            {app.name}
          </button>
        ))}
      </div>
      <div className="tab-help">{activeDescription}</div>

      {apps.map(app => (
        <div key={app.id} id={app.id} className={`tab-content ${activeTab === app.id ? 'active' : ''}`}>
          {activeTab === app.id && React.createElement(app.component)}
        </div>
      ))}
    </div>
  );
};

// SECURITY: API key should be managed via environment variables or backend proxy
// For production, move this to a secure backend endpoint
const GEMINI_API_KEY = 'AIzaSyDDYvU9wZEb_CNWsvThU2ZvDhlsfVdEtbw'; // TODO: Move to backend

const InspectionBuilder = () => {
  const initialFields = {
    colDetails: '', showCol: false,
    perimeterGeneral: 'No such indicators were observed.', perimeterFront: 'No wind or hail damage observed.', perimeterLeft: 'No wind or hail damage observed.', perimeterRear: 'No wind or hail damage observed.', perimeterRight: 'No wind or hail damage observed.', perimeterEstimate: 'None prepared for no damage', showPerimeter: false,
    roofGeneral: '', roofFrontHits: '0', roofFrontWind: '0', roofRightHits: '0', roofRightWind: '0', roofRearHits: '0', roofRearWind: '0', roofLeftHits: '0', roofLeftWind: '0', roofEstimate: 'No estimate prepared', adjusterName: 'I', showRoof: false,
    otherStructuresDetails: '', showOtherStructures: false,
    rooms: [],
    subroDetails: 'No subro potential', showSubro: true,
    salvageDetails: 'No salvage potential', showSalvage: true,
    underwritingConcernsDetails: 'No underwriting concerns were noted during my inspection', showUnderwriting: true,
    settledOnSite: 'No', settlementDetails: 'Estimate prepared on site, went over estimate, RD, supplement process. Advised of 2 years to complete repairs', paymentType: 'Check', sipIncluded: 'no'
  };

  const initialParticipants = [{ id: Date.now(), name: 'Insured' }];

  const [participants, setParticipants] = useState(initialParticipants);
  const [customSections, setCustomSections] = useState([]);
  const [fields, setFields] = useState(initialFields);
  const [generatedNote, setGeneratedNote] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState('');
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fieldnote_inspection_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.fields) setFields(data.fields);
        if (data.participants) setParticipants(data.participants);
        if (data.customSections) setCustomSections(data.customSections);
      } catch (error) {
        console.error('Failed to load saved inspection data:', error);
      }
    }
    setHasLoadedFromStorage(true);
  }, []);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (!hasLoadedFromStorage) return; // Don't save until initial load is complete
    
    const dataToSave = {
      fields,
      participants,
      customSections,
      savedAt: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('fieldnote_inspection_data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save inspection data:', error);
    }
  }, [fields, participants, customSections, hasLoadedFromStorage]);

  const mainSectionOrder = ['general', 'col', 'perimeter', 'roof', 'otherStructures', 'interior', 'subro', 'salvage', 'underwriting', 'settlement', 'finalNote'];

  // Handlers
  const handleFieldChange = (field, value) => setFields(prev => ({ ...prev, [field]: value }));
  const addParticipant = () => setParticipants(prev => [...prev, { id: Date.now(), name: '' }]);
  const updateParticipant = (id, name) => setParticipants(prev => prev.map(p => (p.id === id ? { ...p, name } : p)));
  const removeParticipant = id => setParticipants(prev => prev.filter(p => p.id !== id));

  const addRoom = () => handleFieldChange('rooms', [...fields.rooms, { id: Date.now(), name: '', description: '' }]);
  const updateRoom = (id, field, value) => handleFieldChange('rooms', fields.rooms.map(room => (room.id === id ? { ...room, [field]: value } : room)));
  const removeRoom = id => handleFieldChange('rooms', fields.rooms.filter(room => room.id !== id));

  const toggleCustomSection = (sectionId) => {
    const existing = customSections.find(s => s.insertAfterId === sectionId);
    if (existing) {
      setCustomSections(prev => prev.filter(s => s.insertAfterId !== sectionId));
    } else {
      const newSection = { id: Date.now(), content: '', insertAfterId: sectionId };
      setCustomSections(prev => [...prev, newSection]);
    }
  };

  const updateCustomSection = (id, content) => setCustomSections(prev => prev.map(sec => (sec.id === id ? { ...sec, content } : sec)));

  // Helper: format names
  const formatParticipantList = (arr) => {
    const names = arr.map(p => p.name).filter(Boolean);
    if (names.length === 0) return 'no one';
    if (names.length === 1) return names[0];
    if (names.length === 2) return names.join(' and ');
    const allButLast = names.slice(0, -1).join(', ');
    const lastName = names[names.length - 1];
    return `${allButLast}, and ${lastName}`;
  };

  // Generate note
  useEffect(() => {
    let note = `Inspected loss. I arrived on time and met with ${formatParticipantList(participants)}.`;

    const appendCustomSectionsFor = (sectionId) => {
      customSections.filter(s => s.insertAfterId === sectionId).forEach(s => {
        if (s.content) note += `\n\n${s.content}`;
      });
    };

    mainSectionOrder.forEach(sectionId => {
      if (sectionId === 'general') {
        appendCustomSectionsFor('general');
      } else if (sectionId === 'perimeter' && fields.showPerimeter) {
        note += `\n\nThe inspection revealed the following:`;
      }

      switch (sectionId) {
        case 'col':
          if (fields.showCol && fields.colDetails) note += `\n\nCOL: ${fields.colDetails}`;
          break;
        case 'perimeter':
          if (fields.showPerimeter) {
            note += `\n\nPerimeter:\nAn inspection of the perimeter was performed to verify the presence of storm damage. ${fields.perimeterGeneral}`;
            note += `\nFront: ${fields.perimeterFront}\nLeft: ${fields.perimeterLeft}\nRear: ${fields.perimeterRear}\nRight: ${fields.perimeterRight}\nEstimate: ${fields.perimeterEstimate}`;
          }
          break;
        case 'roof':
          if (fields.showRoof) {
            note += `\n\n${fields.adjusterName} Inspected the roof, which revealed the following:\n${fields.roofGeneral}`;
            note += `\nFront Facing Slope(s): ${fields.roofFrontHits} hits per test square; ${fields.roofFrontWind} wind damaged shingles`;
            note += `\nRight Facing Slope(s): ${fields.roofRightHits} hits per test square; ${fields.roofRightWind} wind damaged shingles`;
            note += `\nRear Facing Slope(s): ${fields.roofRearHits} hits per test square; ${fields.roofRearWind} wind damaged shingles`;
            note += `\nLeft Facing Slope(s): ${fields.roofLeftHits} hits per test square; ${fields.roofLeftWind} wind damaged shingles`;
            note += `\nEstimate: ${fields.roofEstimate}`;
          }
          break;
        case 'otherStructures':
          if (fields.showOtherStructures && fields.otherStructuresDetails) note += `\n\nOther Structures:\n${fields.otherStructuresDetails}`;
          break;
        case 'interior':
          if (fields.rooms.length > 0) {
            note += `\n\nInterior damages:`;
            fields.rooms.forEach(room => { if (room.name && room.description) note += `\n\n${room.name}: ${room.description}`; });
          } else {
            note += `\n\nInterior:\nAn inspection of the interior was not performed.`;
          }
          break;
        case 'subro': if (fields.showSubro) note += `\n\nSubro:\n${fields.subroDetails}`; break;
        case 'salvage': if (fields.showSalvage) note += `\n\nSalvage:\n${fields.salvageDetails}`; break;
        case 'underwriting': if (fields.showUnderwriting) note += `\n\nUnderwriting concerns:\n${fields.underwritingConcernsDetails}`; break;
        case 'settlement':
          note += `\n\nSettlement: ${fields.settlementDetails}`;
          if (fields.settledOnSite === 'Yes') {
            note += `\nPayment type: ${fields.paymentType}`;
            if (fields.paymentType !== 'EFT') note += `\nSIP Included: ${fields.sipIncluded}`;
          }
          break;
      }
      if (sectionId !== 'general') appendCustomSectionsFor(sectionId);
    });

    setGeneratedNote(note);
  }, [fields, participants, customSections]);

  const copyToClipboard = () => navigator.clipboard.writeText(generatedNote);

  const clearInspection = () => {
    const confirmed = window.confirm('Are you sure? This will delete your saved inspection notes.');
    if (confirmed) {
      // Clear all state back to initial values
      setFields(initialFields);
      setParticipants(initialParticipants);
      setCustomSections([]);
      setGeneratedNote('');
      setRewriteError('');
      
      // Clear localStorage
      localStorage.removeItem('fieldnote_inspection_data');
    }
  };

  const rewriteNoteWithAI = async () => {
    if (!generatedNote.trim()) return;
    setRewriteError('');
    setIsRewriting(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Please rewrite the following text without editing the headers to read better without changing any acronyms.\n\n${generatedNote}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Unable to rewrite note.');
      }

      const data = await response.json();
      const aiText =
        data?.candidates?.[0]?.content?.parts
          ?.map(part => part.text)
          .join('')
          .trim() || '';

      if (!aiText) {
        throw new Error('No rewrite was returned.');
      }

      setGeneratedNote(aiText);
    } catch (error) {
      setRewriteError(error.message || 'Failed to rewrite note.');
    } finally {
      setIsRewriting(false);
    }
  };

  // Render
  const componentMap = {
    general: <Section title="General Inspection Details">
      <label>Met with:</label>
      {participants.map((p) => (
        <div key={p.id} className="participant-row">
          <input type="text" value={p.name} onChange={(e) => updateParticipant(p.id, e.target.value)} placeholder="Participant name..."/>
          {participants.length > 1 && <button className="remove-btn" onClick={() => removeParticipant(p.id)}>X</button>}
        </div>
      ))}
      <button onClick={addParticipant}>+ Add Participant</button>
    </Section>,
    col: <SectionToggle title="COL Section" show={fields.showCol} onToggle={() => handleFieldChange('showCol', !fields.showCol)}>
      <textarea value={fields.colDetails} onChange={(e) => handleFieldChange('colDetails', e.target.value)} placeholder="Enter COL details..."></textarea>
    </SectionToggle>,
    perimeter: <SectionToggle title="Perimeter Inspection" show={fields.showPerimeter} onToggle={() => handleFieldChange('showPerimeter', !fields.showPerimeter)}>
      <label>General Observation:</label><input type="text" value={fields.perimeterGeneral} onChange={e => handleFieldChange('perimeterGeneral', e.target.value)} />
      <label>Front:</label><input type="text" value={fields.perimeterFront} onChange={e => handleFieldChange('perimeterFront', e.target.value)} />
      <label>Left:</label><input type="text" value={fields.perimeterLeft} onChange={e => handleFieldChange('perimeterLeft', e.target.value)} />
      <label>Rear:</label><input type="text" value={fields.perimeterRear} onChange={e => handleFieldChange('perimeterRear', e.target.value)} />
      <label>Right:</label><input type="text" value={fields.perimeterRight} onChange={e => handleFieldChange('perimeterRight', e.target.value)} />
      <label>Estimate:</label><input type="text" value={fields.perimeterEstimate} onChange={e => handleFieldChange('perimeterEstimate', e.target.value)} />
    </SectionToggle>,
    roof: <SectionToggle title="Roof Inspection" show={fields.showRoof} onToggle={() => handleFieldChange('showRoof', !fields.showRoof)}>
      <label>Adjuster Name:</label><select value={fields.adjusterName} onChange={e => handleFieldChange('adjusterName', e.target.value)}><option value="I">I</option><option value="Seeknow">Seeknow</option></select>
      <label>General Observations:</label><textarea value={fields.roofGeneral} onChange={e => handleFieldChange('roofGeneral', e.target.value)} placeholder="e.g., No wind or hail damage..."></textarea>
      <label>Front Slope Hits/Wind:</label><div style={{display:'flex', gap:'1rem'}}><input type="text" value={fields.roofFrontHits} onChange={e => handleFieldChange('roofFrontHits', e.target.value)} /><input type="text" value={fields.roofFrontWind} onChange={e => handleFieldChange('roofFrontWind', e.target.value)} /></div>
      <label>Right Slope Hits/Wind:</label><div style={{display:'flex', gap:'1rem'}}><input type="text" value={fields.roofRightHits} onChange={e => handleFieldChange('roofRightHits', e.target.value)} /><input type="text" value={fields.roofRightWind} onChange={e => handleFieldChange('roofRightWind', e.target.value)} /></div>
      <label>Rear Slope Hits/Wind:</label><div style={{display:'flex', gap:'1rem'}}><input type="text" value={fields.roofRearHits} onChange={e => handleFieldChange('roofRearHits', e.target.value)} /><input type="text" value={fields.roofRearWind} onChange={e => handleFieldChange('roofRearWind', e.target.value)} /></div>
      <label>Left Slope Hits/Wind:</label><div style={{display:'flex', gap:'1rem'}}><input type="text" value={fields.roofLeftHits} onChange={e => handleFieldChange('roofLeftHits', e.target.value)} /><input type="text" value={fields.roofLeftWind} onChange={e => handleFieldChange('roofLeftWind', e.target.value)} /></div>
      <label>Estimate:</label><input type="text" value={fields.roofEstimate} onChange={e => handleFieldChange('roofEstimate', e.target.value)} />
    </SectionToggle>,
    otherStructures: <SectionToggle title="Other Structures" show={fields.showOtherStructures} onToggle={() => handleFieldChange('showOtherStructures', !fields.showOtherStructures)}>
      <textarea value={fields.otherStructuresDetails} onChange={e => handleFieldChange('otherStructuresDetails', e.target.value)} placeholder="Enter details..."></textarea>
    </SectionToggle>,
    interior: <Section title="Interior Damages">
      {fields.rooms.map((room, index) => (
        <div key={room.id}>
          <label>Room {index + 1}:</label>
          <div className="participant-row">
            <input type="text" value={room.name} onChange={e => updateRoom(room.id, 'name', e.target.value)} placeholder="e.g., Kitchen" />
            <button className="remove-btn" onClick={() => removeRoom(room.id)}>X</button>
          </div>
          <label>Description:</label>
          <textarea value={room.description} onChange={e => updateRoom(room.id, 'description', e.target.value)} placeholder="e.g., Water stain..."></textarea>
        </div>
      ))}
      <button onClick={addRoom}>+ Add Room</button>
    </Section>,
    subro: <SectionToggle title="Subrogation" show={fields.showSubro} onToggle={() => handleFieldChange('showSubro', !fields.showSubro)}><textarea value={fields.subroDetails} onChange={e => handleFieldChange('subroDetails', e.target.value)}></textarea></SectionToggle>,
    salvage: <SectionToggle title="Salvage" show={fields.showSalvage} onToggle={() => handleFieldChange('showSalvage', !fields.showSalvage)}><textarea value={fields.salvageDetails} onChange={e => handleFieldChange('salvageDetails', e.target.value)}></textarea></SectionToggle>,
    underwriting: <SectionToggle title="Underwriting Concerns" show={fields.showUnderwriting} onToggle={() => handleFieldChange('showUnderwriting', !fields.showUnderwriting)}><textarea value={fields.underwritingConcernsDetails} onChange={e => handleFieldChange('underwritingConcernsDetails', e.target.value)}></textarea></SectionToggle>,
    settlement: <Section title="Settlement">
      <label>Settlement Details:</label><textarea value={fields.settlementDetails} onChange={e => handleFieldChange('settlementDetails', e.target.value)}></textarea>
      <label>Settled on Site?</label><select value={fields.settledOnSite} onChange={e => handleFieldChange('settledOnSite', e.target.value)}><option value="No">No</option><option value="Yes">Yes</option></select>
      {fields.settledOnSite === 'Yes' && (<>
        <label>Payment type:</label><select value={fields.paymentType} onChange={e => handleFieldChange('paymentType', e.target.value)}><option value="Check">Check</option><option value="Manual Check">Manual Check</option><option value="EFT">EFT</option></select>
        {fields.paymentType !== 'EFT' && (
          <>
            <label>SIP Included:</label>
            <select value={fields.sipIncluded} onChange={e => handleFieldChange('sipIncluded', e.target.value)}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </>
        )}
      </>)}
    </Section>,
    finalNote: <Section title="Generated Inspection Note">
      <pre>{generatedNote}</pre>
      <div className="note-actions">
        <button className="copy-btn" onClick={copyToClipboard}>Copy Note</button>
        <button className="rewrite-btn" onClick={rewriteNoteWithAI} disabled={isRewriting}>
          {isRewriting ? 'Rewriting…' : 'Rewrite with AI'}
        </button>
      </div>
      {rewriteError && <div className="error-text">{rewriteError}</div>}
    </Section>,
  };

  return (
    <div>
      {mainSectionOrder.map(sectionId => {
        const customSection = customSections.find(s => s.insertAfterId === sectionId);
        const hasCustomSection = !!customSection;
        return (
          <React.Fragment key={sectionId}>
            <div className="section-wrapper">
              <div className="section-card">{componentMap[sectionId]}</div>
              {sectionId !== 'finalNote' && (
                <div className="add-between-container">
                  <button
                    className={`add-between-btn ${hasCustomSection ? 'minus' : ''}`}
                    onClick={() => toggleCustomSection(sectionId)}
                    aria-label={hasCustomSection ? 'Remove custom note' : 'Add custom note'}
                  >
                    {hasCustomSection ? '-' : '+'}
                  </button>
                </div>
              )}
            </div>
            {hasCustomSection && (
              <div className="custom-section-card">
                <h4>Custom Note</h4>
                <textarea value={customSection.content} onChange={e => updateCustomSection(customSection.id, e.target.value)} placeholder="Enter custom notes here..."/>
              </div>
            )}
          </React.Fragment>
        );
      })}
      
      {/* Clear Inspection Button */}
      <div className="section-card" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button 
          className="clear-inspection-btn" 
          onClick={clearInspection}
          style={{ background: 'var(--danger-color)' }}
        >
          Clear Inspection
        </button>
      </div>
    </div>
  );
};

const PhotoReportBuilder = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastSelectedId = useRef(null);
  const [photosPerPage, setPhotosPerPage] = useState(1);
  const [compression, setCompression] = useState('regular');
  // Grid drag indicator state
  const [dragFromIndex, setDragFromIndex] = useState(null);
  const [dragIndicator, setDragIndicator] = useState({ index: null, position: 'before' });
  
  // Detect iOS for special handling
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.src && photo.src.startsWith('blob:')) {
          URL.revokeObjectURL(photo.src);
        }
      });
    };
  }, [photos]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const newPhotos = imageFiles.map(file => ({ id: Date.now() + Math.random(), src: URL.createObjectURL(file), caption: '', rotation: 0, file }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const updateCaption = (id, caption) => setPhotos(prev => prev.map(p => (p.id === id ? { ...p, caption } : p)));

  const applyCaptionToSelection = (caption) => {
    if (selectedPhotos.size <= 1) return;
    setPhotos(prev => prev.map(photo => (selectedPhotos.has(photo.id) ? { ...photo, caption } : photo)));
  };

  const handleCaptionKeyDown = (e, id) => {
    if (e.key === 'Enter' && !(e.shiftKey || e.altKey) && !(e.ctrlKey || e.metaKey)) {
      if (selectedPhotos.has(id) && selectedPhotos.size > 1) {
        e.preventDefault();
        applyCaptionToSelection(e.currentTarget.value);
        return;
      }
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      const index = photos.findIndex(p => p.id === id);
      if (index !== -1) {
        const next = photos[index + 1];
        if (next) {
          const textareaList = document.querySelectorAll('#photo-grid textarea');
          if (textareaList[index + 1]) textareaList[index + 1].focus();
        }
      }
    }
  };

  const rotatePhoto = (id, direction) => setPhotos(prev => prev.map(p => (p.id === id ? { ...p, rotation: (p.rotation + (direction === 'left' ? -90 : 90) + 360) % 360 } : p)));
  const openFilePicker = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    setSelectedPhotos(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handlePhotoClick = (e, id) => {
    const newSelection = new Set(selectedPhotos);
    if (e.shiftKey && lastSelectedId.current) {
      const lastIndex = photos.findIndex(p => p.id === lastSelectedId.current);
      const currentIndex = photos.findIndex(p => p.id === id);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      for (let i = start; i <= end; i++) newSelection.add(photos[i].id);
    } else if (e.ctrlKey || e.metaKey) {
      if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
    } else {
      newSelection.clear(); newSelection.add(id);
    }
    setSelectedPhotos(newSelection);
    lastSelectedId.current = id;
  };

  const handleDrop = (e) => { 
    if (isIOS) return; // Disable drag/drop on iOS
    e.preventDefault(); 
    e.stopPropagation(); 
    if (dropZoneRef.current) dropZoneRef.current.classList.remove('dragover'); 
    processFiles(Array.from(e.dataTransfer.files)); 
  };
  
  const handleDragOver = (e) => { 
    if (isIOS) return; // Disable drag/drop on iOS
    e.preventDefault(); 
    e.stopPropagation(); 
    if (dropZoneRef.current) dropZoneRef.current.classList.add('dragover'); 
  };
  
  const handleDragLeave = (e) => { 
    if (isIOS) return; // Disable drag/drop on iOS
    e.preventDefault(); 
    e.stopPropagation(); 
    if (dropZoneRef.current) dropZoneRef.current.classList.remove('dragover'); 
  };

  const generatePdf = async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 0.5;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const settingsMap = { regular: { dpi: 144, quality: 0.92 }, smaller: { dpi: 120, quality: 0.82 }, smallest: { dpi: 96, quality: 0.72 } };
    const { dpi, quality } = settingsMap[compression] || settingsMap.regular;

    const loadImage = (src) => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });

    const drawPhoto = async (photo, xIn, yIn, maxWidthIn, maxImageHeightIn) => {
      const img = await loadImage(photo.src);
      const rotation = ((photo.rotation || 0) % 360 + 360) % 360;
      const rotated = rotation % 180 !== 0;
      const originalWidth = img.naturalWidth || img.width;
      const originalHeight = img.naturalHeight || img.height;
      const orientedWidth = rotated ? originalHeight : originalWidth;
      const orientedHeight = rotated ? originalWidth : originalHeight;
      const aspect = orientedWidth / orientedHeight;

      let targetWidthIn = Math.min(maxWidthIn, maxImageHeightIn * aspect);
      let targetHeightIn = targetWidthIn / aspect;
      if (targetHeightIn > maxImageHeightIn) { targetHeightIn = maxImageHeightIn; targetWidthIn = targetHeightIn * aspect; }

      const targetWidthPx = Math.max(1, Math.round(targetWidthIn * dpi));
      const targetHeightPx = Math.max(1, Math.round(targetHeightIn * dpi));

      const canvas = document.createElement('canvas');
      canvas.width = rotated ? targetHeightPx : targetWidthPx;
      canvas.height = rotated ? targetWidthPx : targetHeightPx;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -targetWidthPx / 2, -targetHeightPx / 2, targetWidthPx, targetHeightPx);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const offsetXIn = xIn + (maxWidthIn - targetWidthIn) / 2;
      doc.addImage(dataUrl, 'JPEG', offsetXIn, yIn, targetWidthIn, targetHeightIn, undefined, 'FAST');
      return { imageHeightIn: targetHeightIn };
    };

    let index = 0; let isFirstPage = true;
    while (index < photos.length) {
      if (!isFirstPage) doc.addPage();
      isFirstPage = false;
      if (photosPerPage === 2) {
        const slotHeightIn = contentHeight / 2;
        const imageMaxHeightIn = slotHeightIn - 0.7;
        let yIn = margin;
        for (let slot = 0; slot < 2 && index < photos.length; slot++) {
          const { imageHeightIn } = await drawPhoto(photos[index], margin, yIn, contentWidth, imageMaxHeightIn);
          const caption = photos[index].caption || '';
          const captionY = yIn + imageHeightIn + 0.2;
          const lines = doc.splitTextToSize(caption, contentWidth);
          doc.setFontSize(12);
          doc.text(lines, margin, captionY, { maxWidth: contentWidth });
          index++; yIn += slotHeightIn;
        }
      } else {
        const imageMaxHeightIn = contentHeight - 1.0;
        const { imageHeightIn } = await drawPhoto(photos[index], margin, margin, contentWidth, imageMaxHeightIn);
        const caption = photos[index].caption || '';
        const captionY = margin + imageHeightIn + 0.3;
        const lines = doc.splitTextToSize(caption, contentWidth);
        doc.setFontSize(12);
        doc.text(lines, margin, captionY, { maxWidth: contentWidth });
        index++;
      }
    }
    // Open PDF in a new tab for print/save preview instead of auto-saving
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  };

  // preview removed

  return (
    <div>
      <div id="photo-controls" className="section-card no-print">
        <h2>Photo Report Builder</h2>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} ref={fileInputRef} />
        <div id="photo-drop-zone" ref={dropZoneRef} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={openFilePicker}>
          {isIOS ? 'Tap to Upload Photos' : 'Drag & drop photos here or click to upload'}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label>Photos per page</label>
            <select value={photosPerPage} onChange={(e) => setPhotosPerPage(parseInt(e.target.value))}>
              <option value={2}>2 per page</option>
              <option value={1}>1 per page</option>
            </select>
          </div>
          <div>
            <label>Compression</label>
            <select value={compression} onChange={(e) => setCompression(e.target.value)}>
              <option value="regular">Regular</option>
              <option value="smaller">Smaller</option>
              <option value="smallest">Smallest</option>
            </select>
          </div>
          <button onClick={generatePdf}>Generate PDF</button>
        </div>
      </div>

      <div id="photo-grid">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`photo-card${selectedPhotos.has(photo.id) ? ' selected' : ''}${index === dragFromIndex ? ' dragging' : ''}${dragIndicator.index === index ? ` drop-indicator-${dragIndicator.position}` : ''}`}
            onClick={(e) => handlePhotoClick(e, photo.id)}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; setDragFromIndex(index); setDragIndicator({ index, position: 'before' }); }}
            onDragEnter={() => setDragIndicator(prev => (prev.index === index ? prev : { index, position: prev.position || 'before' }))}
            onDragOver={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const midpoint = rect.top + rect.height / 2;
              const position = e.clientY < midpoint ? 'before' : 'after';
              setDragIndicator(prev => (prev.index === index && prev.position === position ? prev : { index, position }));
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setDragIndicator(prev => (prev.index === index ? { index: null, position: 'before' } : prev));
              }
            }}
            onDragEnd={() => { setDragFromIndex(null); setDragIndicator({ index: null, position: 'before' }); }}
            onDrop={(e) => {
              e.preventDefault();
              const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
              const position = dragIndicator.index === index ? dragIndicator.position : 'before';
              setDragFromIndex(null); setDragIndicator({ index: null, position: 'before' });
              if (Number.isNaN(from)) return;
              setPhotos(prev => {
                const arr = [...prev];
                if (from < 0 || from >= arr.length) return prev;
                const [m] = arr.splice(from, 1);
                const totalLength = prev.length;
                let targetIndex = position === 'after' ? index + 1 : index;
                if (targetIndex > totalLength) targetIndex = totalLength;
                if (from < targetIndex) targetIndex -= 1;
                if (targetIndex > arr.length) targetIndex = arr.length;
                if (targetIndex < 0) targetIndex = 0;
                arr.splice(targetIndex, 0, m);
                return arr;
              });
            }}
          >
            <div className="photo-container">
              <img src={photo.src} className={photo.rotation % 180 !== 0 ? 'rotated-grid' : ''} style={{ transform: `rotate(${photo.rotation}deg)` }} />
              <div className="rotate-buttons">
                <button className="delete-btn" onClick={(e) => {e.stopPropagation(); removePhoto(photo.id);}}>✕</button>
                <button onClick={(e) => {e.stopPropagation(); rotatePhoto(photo.id, 'left');}}>↺</button>
                <button onClick={(e) => {e.stopPropagation(); rotatePhoto(photo.id, 'right');}}>↻</button>
              </div>
            </div>
            <div className="photo-card-caption">
              <textarea value={photo.caption} onChange={(e) => updateCaption(photo.id, e.target.value)} onKeyDown={(e) => handleCaptionKeyDown(e, photo.id)} placeholder="Enter caption..." onClick={(e) => e.stopPropagation()} />
            </div>
          </div>
        ))}
      </div>

      <div id="print-content">
        {photosPerPage === 2 ? (
          photos.map((photo, index) => (
            (index % 2 === 0) && (
              <div className="photo-report-page" key={`page-${index}`}>
                <div className="photo-report-item">
                  <img src={photos[index].src} className={photos[index].rotation % 180 !== 0 ? 'rotated-print' : ''} style={{ transform: `rotate(${photos[index].rotation}deg)` }} />
                  <p>{photos[index].caption}</p>
                </div>
                {photos[index + 1] && (
                  <div className="photo-report-item">
                    <img src={photos[index + 1].src} className={photos[index + 1].rotation % 180 !== 0 ? 'rotated-print' : ''} style={{ transform: `rotate(${photos[index + 1].rotation}deg)` }} />
                    <p>{photos[index + 1].caption}</p>
                  </div>
                )}
              </div>
            )
          ))
        ) : (
          photos.map((p, i) => (
            <div className="photo-report-page single" key={`page-single-${i}`}>
              <div className="photo-report-item">
                <img src={p.src} className={p.rotation % 180 !== 0 ? 'rotated-print' : ''} style={{ transform: `rotate(${p.rotation}deg)` }} />
                <p>{p.caption}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview removed */}
    </div>
  );
};

const Section = ({ title, children }) => (<>
  <h2>{title}</h2>
  <div style={{paddingTop: '1rem'}}>{children}</div>
</>);

const SectionToggle = ({ title, show, onToggle, children }) => (<>
  <h2 onClick={onToggle} style={{ cursor: 'pointer' }}>
    {title}
    <span style={{marginLeft: 'auto', fontSize:'1.5rem', fontWeight: 400, color: 'var(--primary-color)'}}>{show ? '-' : '+'}</span>
  </h2>
  {show && <div style={{paddingTop: '1rem', animation: 'fadeIn 0.5s ease'}}>{children}</div>}
</>);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
