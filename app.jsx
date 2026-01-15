const { useState, useEffect, useRef } = React;

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/public/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// Info Modal Component
const InfoModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="info-modal-backdrop" onClick={onClose}>
      <div className="info-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-header">
          <h3>{title}</h3>
          <button className="info-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div className="info-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// Info Button Component
const InfoButton = ({ onClick }) => (
  <button className="info-button" onClick={onClick} aria-label="More information">
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  </button>
);

// iOS Add to Home Screen Prompt Component
const IOSInstallPrompt = () => {
  // Detect iOS devices including iPad on iPadOS 13+
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (!isIOS || isPWA) return null;

  return (
    <div className="a2hs-backdrop">
      <div className="a2hs-card">
        <img src="/public/icons/icon-192.png" className="a2hs-app-icon" alt="FieldNote App Icon" />

        <h2 className="a2hs-title">
          Add to Home Screen to use FieldNote
        </h2>

        <p className="a2hs-subtitle">
          Install FieldNote from Safari's share menu for offline support,
          full-screen mode, and automatic saving.
        </p>

        <p className="a2hs-instructions">
          Tap <svg className="share-icon" viewBox="0 0 24 24">
            <path d="M12 2l4 4h-3v7h-2V6H8l4-4zm-7 9v9h14v-9h2v11H3V11h2z"/>
          </svg> then "Add to Home Screen"
        </p>
      </div>
    </div>
  );
};

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
      name: 'Photos',
      description:
        'Upload multiple photos and print them into one document for your file.',
      component: PhotoReportBuilder,
    },
    {
      id: 'coverage',
      name: 'Coverage Analysis',
      description:
        'Parse Dec pages and generate coverage analysis notes for claims.',
      component: CoverageAnalysisBuilder,
    },
    {
      id: 'settlement',
      name: 'Settlement Email',
      description:
        'Generate settlement emails from Xactimate estimate summaries.',
      component: SettlementEmailBuilder,
    },
  ];

  const [activeTab, setActiveTab] = useState(apps[0].id);
  const ActiveComponent = apps.find(a => a.id === activeTab)?.component || (() => null);
  const activeDescription = apps.find(a => a.id === activeTab)?.description || '';

  return (
    <>
      <IOSInstallPrompt />
      <div>
        <div style={{ textAlign: 'center' }}>
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
        </div>
        <div className="tab-help">{activeDescription}</div>

        {apps.map(app => (
          <div key={app.id} id={app.id} className={`tab-content ${activeTab === app.id ? 'active' : ''}`}>
            {activeTab === app.id && React.createElement(app.component)}
          </div>
        ))}
      </div>
    </>
  );
};

const InspectionBuilder = () => {
  const initialFields = {
    colDetails: '', showCol: false,
    perimeterGeneral: 'No such indicators were observed.', perimeterFront: 'No wind or hail damage observed.', perimeterLeft: 'No wind or hail damage observed.', perimeterRear: 'No wind or hail damage observed.', perimeterRight: 'No wind or hail damage observed.', perimeterEstimate: 'None prepared for no damage', showPerimeter: false,
    roofGeneral: '', roofFrontHits: '0', roofFrontWind: '0', roofRightHits: '0', roofRightWind: '0', roofRearHits: '0', roofRearWind: '0', roofLeftHits: '0', roofLeftWind: '0', roofEstimate: 'No estimate prepared', adjusterName: 'I', showRoof: false, showRoofCount: true, showRoofDetails: true, roofLayers: '1', roofDripEdge: 'no', roofValleyMetal: 'no', roofRidgeVent: 'yes', roofPipeJacks: '', roofHVAC: '', roofTurtleVent: '', roofPower: '', roofSkylight: '', roofSatellite: '',
    otherStructuresDetails: '', showOtherStructures: false,
    rooms: [],
    subroDetails: 'No subro potential', showSubro: true,
    salvageDetails: 'No salvage potential', showSalvage: true,
    underwritingConcernsDetails: 'No underwriting concerns were noted during my inspection', showUnderwriting: true,
    settledOnSite: 'No', settlementDetails: 'Estimate prepared on site, went over estimate, RD, supplement process. Advised of 2 years to complete repairs. Emailed NI copy of estimate and ACV letter onsite.', paymentType: 'Check', sipIncluded: 'no'
  };

  const initialParticipants = [{ id: Date.now(), name: 'Insured' }];

  const [participants, setParticipants] = useState(initialParticipants);
  const [customSections, setCustomSections] = useState([]);
  const [fields, setFields] = useState(initialFields);
  const [generatedNote, setGeneratedNote] = useState('');
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Helper function to check if current state has meaningful changes from initial state
  const hasModifications = () => {
    // Check if fields differ from initial values
    const fieldsChanged = JSON.stringify(fields) !== JSON.stringify(initialFields);
    
    // Check if participants differ from initial (more than just "Insured")
    const participantsChanged = 
      participants.length !== 1 || 
      participants[0].name !== 'Insured';
    
    // Check if there are any custom sections
    const hasCustomSections = customSections.length > 0;
    
    return fieldsChanged || participantsChanged || hasCustomSections;
  };

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
            
            // Add hit/wind count section if toggled on
            if (fields.showRoofCount) {
              note += `\nFront Facing Slope(s): ${fields.roofFrontHits} hits per test square; ${fields.roofFrontWind} wind damaged shingles`;
              note += `\nRight Facing Slope(s): ${fields.roofRightHits} hits per test square; ${fields.roofRightWind} wind damaged shingles`;
              note += `\nRear Facing Slope(s): ${fields.roofRearHits} hits per test square; ${fields.roofRearWind} wind damaged shingles`;
              note += `\nLeft Facing Slope(s): ${fields.roofLeftHits} hits per test square; ${fields.roofLeftWind} wind damaged shingles`;
            }
            
            // Add roof details section if toggled on
            if (fields.showRoofDetails) {
              note += `\n\nRoof Details:`;
              note += `\nLayers: ${fields.roofLayers || '1'}`;
              note += `\nDrip edge: ${fields.roofDripEdge || 'no'}`;
              note += `\nValley metal: ${fields.roofValleyMetal || 'no'}`;
              note += `\nRidge vent: ${fields.roofRidgeVent || 'yes'}`;
              if (fields.roofPipeJacks) note += `\nPipe jacks: ${fields.roofPipeJacks}`;
              if (fields.roofHVAC) note += `\nHVAC: ${fields.roofHVAC}`;
              if (fields.roofTurtleVent) note += `\nTurtle Vent: ${fields.roofTurtleVent}`;
              if (fields.roofPower) note += `\nPower: ${fields.roofPower}`;
              if (fields.roofSkylight) note += `\nSkylight: ${fields.roofSkylight}`;
              if (fields.roofSatellite) note += `\nSatellite: ${fields.roofSatellite}`;
            }
            
            note += `\n\nEstimate: ${fields.roofEstimate}`;
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedNote);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const sendEmail = () => {
    const today = new Date();
    const formattedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
    const subject = `Field Inspection Note ${formattedDate}`;
    const body = encodeURIComponent(generatedNote);
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const clearInspection = () => {
    const confirmed = window.confirm('Are you sure? This will delete your saved inspection notes.');
    if (confirmed) {
      // Clear all state back to initial values
      setFields(initialFields);
      setParticipants(initialParticipants);
      setCustomSections([]);
      setGeneratedNote('');

      // Clear localStorage
      localStorage.removeItem('fieldnote_inspection_data');
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
      
      <div style={{marginTop: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
        <h3 onClick={() => handleFieldChange('showRoofCount', !fields.showRoofCount)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', margin: 0 }}>
          Hit/Wind Count
          <span style={{marginLeft: 'auto', fontSize:'1.5rem', fontWeight: 400, color: 'var(--primary-color)'}}>{fields.showRoofCount ? '-' : '+'}</span>
        </h3>
        {fields.showRoofCount && (
          <div style={{paddingTop: '1rem', animation: 'fadeIn 0.5s ease'}}>
            <label>Front Slope Hits/Wind:</label><div style={{display:'flex', gap:'1rem'}}><input type="text" value={fields.roofFrontHits} onChange={e => handleFieldChange('roofFrontHits', e.target.value)} placeholder="Hits" /><input type="text" value={fields.roofFrontWind} onChange={e => handleFieldChange('roofFrontWind', e.target.value)} placeholder="Wind" /></div>
            <label>Right Slope Hits/Wind:</label><div style={{display:'flex', gap:'1rem'}}><input type="text" value={fields.roofRightHits} onChange={e => handleFieldChange('roofRightHits', e.target.value)} placeholder="Hits" /><input type="text" value={fields.roofRightWind} onChange={e => handleFieldChange('roofRightWind', e.target.value)} placeholder="Wind" /></div>
            <label>Rear Slope Hits/Wind:</label><div style={{display:'flex', gap:'1rem'}}><input type="text" value={fields.roofRearHits} onChange={e => handleFieldChange('roofRearHits', e.target.value)} placeholder="Hits" /><input type="text" value={fields.roofRearWind} onChange={e => handleFieldChange('roofRearWind', e.target.value)} placeholder="Wind" /></div>
            <label>Left Slope Hits/Wind:</label><div style={{display:'flex', gap:'1rem'}}><input type="text" value={fields.roofLeftHits} onChange={e => handleFieldChange('roofLeftHits', e.target.value)} placeholder="Hits" /><input type="text" value={fields.roofLeftWind} onChange={e => handleFieldChange('roofLeftWind', e.target.value)} placeholder="Wind" /></div>
          </div>
        )}
      </div>

      <div style={{marginTop: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
        <h3 onClick={() => handleFieldChange('showRoofDetails', !fields.showRoofDetails)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', margin: 0 }}>
          Roof Details
          <span style={{marginLeft: 'auto', fontSize:'1.5rem', fontWeight: 400, color: 'var(--primary-color)'}}>{fields.showRoofDetails ? '-' : '+'}</span>
        </h3>
        {fields.showRoofDetails && (
          <div style={{paddingTop: '1rem', animation: 'fadeIn 0.5s ease'}}>
            <label>Layers:</label><input type="text" value={fields.roofLayers || '1'} onChange={e => handleFieldChange('roofLayers', e.target.value)} />
            <label>Drip edge:</label><select value={fields.roofDripEdge || 'no'} onChange={e => handleFieldChange('roofDripEdge', e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select>
            <label>Valley metal:</label><select value={fields.roofValleyMetal || 'no'} onChange={e => handleFieldChange('roofValleyMetal', e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select>
            <label>Ridge vent:</label><select value={fields.roofRidgeVent || 'yes'} onChange={e => handleFieldChange('roofRidgeVent', e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select>
            <label>Pipe jacks:</label><input type="text" inputMode="numeric" value={fields.roofPipeJacks} onChange={e => handleFieldChange('roofPipeJacks', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>HVAC:</label><input type="text" inputMode="numeric" value={fields.roofHVAC} onChange={e => handleFieldChange('roofHVAC', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>Turtle Vent:</label><input type="text" inputMode="numeric" value={fields.roofTurtleVent} onChange={e => handleFieldChange('roofTurtleVent', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>Power:</label><input type="text" inputMode="numeric" value={fields.roofPower} onChange={e => handleFieldChange('roofPower', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>Skylight:</label><input type="text" inputMode="numeric" value={fields.roofSkylight} onChange={e => handleFieldChange('roofSkylight', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>Satellite:</label><input type="text" inputMode="numeric" value={fields.roofSatellite} onChange={e => handleFieldChange('roofSatellite', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
          </div>
        )}
      </div>

      <label style={{marginTop: '1rem'}}>Estimate:</label><input type="text" value={fields.roofEstimate} onChange={e => handleFieldChange('roofEstimate', e.target.value)} />
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
        <button className="copy-btn" onClick={copyToClipboard} style={copySuccess ? { background: '#16a34a' } : {}}>
          {copySuccess ? 'Copied!' : 'Copy Note'}
        </button>
        <button className="copy-btn" onClick={sendEmail}>Send Email</button>
      </div>
    </Section>,
  };

  return (
    <div>
      {/* Info Button */}
      <div className="info-button-container">
        <InfoButton onClick={() => setShowInfoModal(true)} />
      </div>

      {/* Info Modal */}
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} title="Inspection Builder">
        <p>This tool helps build field inspection notes quickly while not leaving anything required out.</p>
        <p>The format follows an efficient structure for field notes, designed to be used on your phone while walking around the house using voice dictation to fill it out.</p>
        <p><strong>Auto-Save:</strong> You can lock your phone and your inputs will save to your cache. Works great on desktop too.</p>
        <p><strong>Tip:</strong> Use the + buttons between sections to add custom notes anywhere in your inspection.</p>
      </InfoModal>

      {/* Clear Inspection Button at Top - Only show if there's saved content */}
      {hasModifications() && (
        <div className="section-card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button
            className="clear-inspection-btn"
            onClick={clearInspection}
            style={{ background: 'var(--danger-color)' }}
          >
            Clear Inspection
          </button>
        </div>
      )}

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
      
      {/* Clear Inspection Button at Bottom - Only show if there's saved content */}
      {hasModifications() && (
        <div className="section-card" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            className="clear-inspection-btn" 
            onClick={clearInspection}
            style={{ background: 'var(--danger-color)' }}
          >
            Clear Inspection
          </button>
        </div>
      )}
    </div>
  );
};

const CoverageAnalysisBuilder = () => {
  const initialManualFields = {
    descriptionOfLoss: '',
    dateOfLossReported: '',
    iso: '',
    ao: 'no prior loss is claim center'
  };

  const initialParsedData = {
    policyType: '',
    policyTermStart: '',
    policyTermEnd: '',
    beenWithAOSince: '',
    construction: '',
    sip: '',
    coverageA: '',
    coverageB: '',
    coverageC: '',
    coverageD: '',
    deductible: ''
  };

  const [rawDecText, setRawDecText] = useState('');
  const [parsedData, setParsedData] = useState(initialParsedData);
  const [endorsements, setEndorsements] = useState([]);
  const [manualFields, setManualFields] = useState(initialManualFields);
  const [generatedNote, setGeneratedNote] = useState('');
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Check if there are modifications to show clear button
  const hasModifications = () => {
    const manualFieldsChanged = JSON.stringify(manualFields) !== JSON.stringify(initialManualFields);
    const parsedDataChanged = JSON.stringify(parsedData) !== JSON.stringify(initialParsedData);
    const hasEndorsements = endorsements.length > 0;
    const hasRawText = rawDecText.trim().length > 0;
    return manualFieldsChanged || parsedDataChanged || hasEndorsements || hasRawText;
  };

  // Load saved data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fieldnote_coverage_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.rawDecText) setRawDecText(data.rawDecText);
        if (data.parsedData) setParsedData(data.parsedData);
        if (data.endorsements) setEndorsements(data.endorsements);
        if (data.manualFields) setManualFields(data.manualFields);
      } catch (error) {
        console.error('Failed to load saved coverage data:', error);
      }
    }
    setHasLoadedFromStorage(true);
  }, []);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (!hasLoadedFromStorage) return;

    const dataToSave = {
      rawDecText,
      parsedData,
      endorsements,
      manualFields,
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('fieldnote_coverage_data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save coverage data:', error);
    }
  }, [rawDecText, parsedData, endorsements, manualFields, hasLoadedFromStorage]);

  // ============ REGEX PARSING FUNCTIONS ============

  // Parse policy type from "Forms That Apply To This Location" section
  // Only matches: 17903, 15003, 15001, 15004
  const parsePolicyType = (text) => {
    // Look for forms section first for more accurate matching
    const formsSection = text.match(/Forms\s+That\s+Apply\s+To\s+This\s+Location[:\s]*([\s\S]*?)(?=Secured|SECURED|Total|TOTAL|$)/i);
    if (formsSection) {
      const match = formsSection[1].match(/\b(17903|15003|15001|15004)\b/);
      if (match) return match[1];
    }
    // Fallback: search entire text but be more restrictive
    const fallbackMatch = text.match(/\b(17903|15003|15001|15004)\b/);
    return fallbackMatch ? fallbackMatch[1] : '';
  };

  // Parse policy term dates (MM-DD-YYYY to MM-DD-YYYY)
  const parsePolicyTerm = (text) => {
    // Try inline format first: "03-05-2025 to 03-05-2026"
    const inlineMatch = text.match(/(\d{2}-\d{2}-\d{4})\s+to\s+(\d{2}-\d{2}-\d{4})/i);
    if (inlineMatch) {
      return { start: inlineMatch[1], end: inlineMatch[2] };
    }

    // Try multiline format where "to" is on its own line:
    // to
    // 03-05-2025
    // 03-05-2026
    const multilineMatch = text.match(/\bto\s*[\r\n]+\s*(\d{2}-\d{2}-\d{4})\s*[\r\n]+\s*(\d{2}-\d{2}-\d{4})/i);
    if (multilineMatch) {
      return { start: multilineMatch[1], end: multilineMatch[2] };
    }

    // Try POLICY TERM section - look for "Tem" or "Term" followed by dates
    const policyTermMatch = text.match(/\bTe(?:m|rm)\s+(\d{2}-\d{2}-\d{4})[\s\S]*?(?:to\.?|10\.)\s*(\d{2}-\d{2}-\d{4})/i);
    if (policyTermMatch) {
      return { start: policyTermMatch[1], end: policyTermMatch[2] };
    }

    return { start: '', end: '' };
  };

  // Calculate "Been with AO since" from policyholder year + policy term month
  const parseBeenWithAOSince = (text, policyTermStart) => {
    // Extract year from "Policyholder since YYYY"
    const sinceMatch = text.match(/Policyholder\s+since\s+(\d{4})/i);
    if (!sinceMatch) return '';

    const year = sinceMatch[1];

    // Extract month from policy term start (MM-DD-YYYY)
    if (!policyTermStart) return year;

    const monthNum = parseInt(policyTermStart.split('-')[0], 10);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[monthNum - 1] || '';

    return monthName ? `${monthName} ${year}` : year;
  };

  // Parse construction details
  const parseConstruction = (text) => {
    // Try to match construction type with year built and roof info
    const patterns = [
      // "Frame Construction Built in 1985 Asphalt Roof Updated in 2008"
      /((?:Frame|Masonry|Brick|Stucco|Wood)\s+Construction\s+Built\s+in\s+\d{4}[^\n]*(?:Roof[^\n]*)?)/i,
      // Just construction type with year
      /((?:Frame|Masonry|Brick|Stucco|Wood)\s+Construction[^\n]*\d{4}[^\n]*)/i,
      // Generic construction line
      /Construction[:\s]+([^\n]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return (match[1] || match[0]).trim();
    }
    return '';
  };

  // Parse SIP (Secured Interest Party) from SECURED INTERESTED PARTIES section
  const parseSIP = (text) => {
    // Look for the section - handle various header formats including:
    // "SECURED INTERESTED PARTIES"
    // "SECURED INTERESTED PARTIES AND/OR ADDITIONAL INTERESTED PARTIES AND/OR ADDITIONAL INSUREDS"
    const sipSection = text.match(/SECURED\s+INTERESTED\s+PARTIES[\s\S]*?(?=\n\s*\n|insurance\s+Score|Forms\s+That\s+Apply|TOTAL\s+POLICY|$)/i);
    if (sipSection) {
      const lines = sipSection[0].split('\n').map(l => l.trim()).filter(Boolean);
      // Skip header lines and find actual party name
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip section headers and common header words
        if (line.match(/^(SECURED|INTERESTED|PARTIES|AND\/OR|ADDITIONAL|INSUREDS)/i)) continue;
        // Skip if the entire line is part of the header
        if (line.match(/SECURED\s+INTERESTED\s+PARTIES/i)) continue;
        if (line.match(/ADDITIONAL\s+INTERESTED\s+PARTIES/i)) continue;
        if (line.match(/ADDITIONAL\s+INSUREDS/i)) continue;
        // Skip location markers like "Loc 001"
        if (line.match(/^Loc\s+\d+/i)) continue;
        // Skip interest type lines
        if (line.match(/^Interest:/i)) continue;
        // Skip form references
        if (line.match(/^Form:/i)) continue;
        // Skip loan numbers like "Loan: 2008993"
        if (line.match(/^Loan:/i)) continue;
        // This should be the party name (bank name, etc.)
        if (line.length > 2 && !line.match(/^\d+$/)) {
          return line;
        }
      }
    }
    return '';
  };

  // Parse coverages A-D with dollar amounts
  // Explicitly excludes E, F, and Adjusted Value Factor
  const parseCoverages = (text) => {
    const coverages = { A: '', B: '', C: '', D: '' };

    // Coverage A - Dwelling
    const aMatch = text.match(/A\s*[-–]?\s*Dwelling[:\s]*\$?([\d,]+)/i) ||
                   text.match(/Dwelling[:\s]+\$?([\d,]+)/i);
    if (aMatch) coverages.A = `$${aMatch[1]}`;

    // Coverage B - Other Structures
    const bMatch = text.match(/B\s*[-–]?\s*Other\s+Structures[:\s]*\$?([\d,]+)/i) ||
                   text.match(/Other\s+Structures[:\s]+\$?([\d,]+)/i);
    if (bMatch) coverages.B = `$${bMatch[1]}`;

    // Coverage C - Personal Property
    const cMatch = text.match(/C\s*[-–]?\s*Personal\s+Property[:\s]*\$?([\d,]+)/i) ||
                   text.match(/Personal\s+Property[:\s]+\$?([\d,]+)/i);
    if (cMatch) coverages.C = `$${cMatch[1]}`;

    // Coverage D - Additional Living Expense or Loss of Rents
    const dMatch = text.match(/D\s*[-–]?\s*(?:Additional\s+Living\s+Expense|Loss\s+of\s+Rents)[:\s]*\$?([\d,]+)/i) ||
                   text.match(/(?:Additional\s+Living\s+Expense|Loss\s+of\s+Rents)[:\s]+\$?([\d,]+)/i);
    if (dMatch) coverages.D = `$${dMatch[1]}`;

    return coverages;
  };

  // Parse deductible (All Peril Deductible)
  const parseDeductible = (text) => {
    const match = text.match(/\$?([\d,]+)\s*[-–]?\s*All\s+Peril\s+Deductible/i) ||
                  text.match(/All\s+Peril\s+Deductible[:\s]*\$?([\d,]+)/i);
    if (match) return `$${match[1]} - All Peril Deductible`;
    return '';
  };

  // Parse endorsements from "COVERAGES THAT APPLY" section
  const parseEndorsements = (text) => {
    const parsedEndorsements = [];
    let idCounter = Date.now();

    // Find the COVERAGES THAT APPLY section
    const coveragesSection = text.match(/COVERAGES\s+THAT\s+APPLY[\s\S]*?(?=PREMIUM|SECURED|Forms\s+That\s+Apply|$)/i);
    if (coveragesSection) {
      const lines = coveragesSection[0].split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip empty lines
        if (!trimmed) continue;
        // Skip section header
        if (trimmed.match(/^COVERAGES\s+THAT\s+APPLY/i)) continue;
        // Skip coverage lines A-F
        if (trimmed.match(/^[A-F]\s+/i)) continue;
        // Skip Adjusted Value Factor
        if (trimmed.match(/Adjusted\s+Value\s+Factor/i)) continue;
        // Skip Section/Deductible headers (we parse deductible separately)
        if (trimmed.match(/^Section\s+/i)) continue;
        // Skip LIMITS header
        if (trimmed.match(/^LIMITS$/i)) continue;
        // Skip pure dollar amounts on their own line
        if (trimmed.match(/^\$?[\d,]+$/)) continue;

        // Valid endorsement line (must be at least 3 chars)
        if (trimmed.length > 2) {
          parsedEndorsements.push({
            id: idCounter++,
            text: trimmed,
            included: false
          });
        }
      }
    }

    // Special case: Check for roof ACV clause anywhere in document
    if (text.match(/Wind\s+or\s+hail\s+losses\s+to\s+your\s+roof\s+will\s+be\s+paid\s+on\s+an\s+Actual\s+Cash\s+Value\s+basis/i)) {
      parsedEndorsements.push({
        id: idCounter++,
        text: 'Roof Wind/Hail - ACV Basis',
        included: false
      });
    }

    return parsedEndorsements;
  };

  // ============ HANDLER FUNCTIONS ============

  // Main parse button handler
  const handleParseDecPage = () => {
    const policyType = parsePolicyType(rawDecText);
    const term = parsePolicyTerm(rawDecText);
    const beenWithAOSince = parseBeenWithAOSince(rawDecText, term.start);
    const construction = parseConstruction(rawDecText);
    const sip = parseSIP(rawDecText);
    const coverages = parseCoverages(rawDecText);
    const deductible = parseDeductible(rawDecText);
    const parsedEndorsements = parseEndorsements(rawDecText);

    setParsedData({
      policyType,
      policyTermStart: term.start,
      policyTermEnd: term.end,
      beenWithAOSince,
      construction,
      sip,
      coverageA: coverages.A,
      coverageB: coverages.B,
      coverageC: coverages.C,
      coverageD: coverages.D,
      deductible
    });

    setEndorsements(parsedEndorsements);
  };

  // Update manual fields
  const handleManualFieldChange = (field, value) => {
    setManualFields(prev => ({ ...prev, [field]: value }));
  };

  // Update parsed data fields (allows editing)
  const handleParsedDataChange = (field, value) => {
    setParsedData(prev => ({ ...prev, [field]: value }));
  };

  // Toggle endorsement inclusion
  const toggleEndorsement = (id) => {
    setEndorsements(prev => prev.map(e =>
      e.id === id ? { ...e, included: !e.included } : e
    ));
  };

  // Remove endorsement entirely
  const removeEndorsement = (id) => {
    setEndorsements(prev => prev.filter(e => e.id !== id));
  };

  // Copy to clipboard with feedback
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedNote);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Clear all data
  const clearCoverageAnalysis = () => {
    const confirmed = window.confirm('Are you sure? This will clear all coverage analysis data.');
    if (confirmed) {
      setRawDecText('');
      setParsedData(initialParsedData);
      setEndorsements([]);
      setManualFields(initialManualFields);
      setGeneratedNote('');
      localStorage.removeItem('fieldnote_coverage_data');
    }
  };

  // ============ OUTPUT GENERATION ============

  // Generate the plain text output
  useEffect(() => {
    let note = 'Coverage Analysis:\n';
    note += 'Description of Loss:\n';
    note += manualFields.descriptionOfLoss ? `${manualFields.descriptionOfLoss}\n` : '\n';
    note += '\n';
    note += 'Date of loss reported:\n';
    note += manualFields.dateOfLossReported ? `${manualFields.dateOfLossReported}\n` : '\n';
    note += '\n';
    note += 'Dec Page:\n';
    note += `Policy: ${parsedData.policyType || ''}\n`;
    note += `Auto Owners Policy Term: ${parsedData.policyTermStart && parsedData.policyTermEnd ?
      `${parsedData.policyTermStart} - ${parsedData.policyTermEnd}` : ''}\n`;
    note += `Been with AO since: ${parsedData.beenWithAOSince || ''}\n`;
    note += 'Construction:\n';
    note += `${parsedData.construction || ''}\n`;
    note += '\n';
    note += 'Coverages that may apply:\n';
    note += `A Dwelling ${parsedData.coverageA || ''} B Other Structures ${parsedData.coverageB || ''} C Personal Property ${parsedData.coverageC || ''}\n`;
    note += '\n';
    note += parsedData.deductible ? `${parsedData.deductible}\n` : '\n';
    note += '\n';
    note += 'Endorsements that may apply:\n';

    // Only include endorsements where included === true
    const includedEndorsements = endorsements.filter(e => e.included);
    for (const endorsement of includedEndorsements) {
      note += `${endorsement.text}\n`;
    }

    note += '\n';
    note += `SIP: ${parsedData.sip || ''}\n`;
    note += `ISO: ${manualFields.iso || ''}\n`;
    note += '\n';
    note += `AO - ${manualFields.ao || ''}`;

    setGeneratedNote(note);
  }, [parsedData, endorsements, manualFields]);

  // ============ RENDER ============

  return (
    <div>
      {/* Info Button */}
      <div className="info-button-container">
        <InfoButton onClick={() => setShowInfoModal(true)} />
      </div>

      {/* Info Modal */}
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} title="Coverage Analysis">
        <p>Initial claim note builder for coverage analysis. Copy and paste the main portion of your Dec page into the parser and it will fill out most of the information you need.</p>
        <p><strong>Note:</strong> Currently SIP and policy period parsing may have issues on some formats - these can be manually corrected after parsing.</p>
        <p><strong>Privacy:</strong> This data is not saved externally. All code is executed on your device. This is a static website and the information pasted here is not being stored anywhere externally.</p>
        <p><strong>Tip:</strong> After parsing, you can manually edit any field that wasn't captured correctly.</p>
      </InfoModal>

      {/* Clear Button at Top - Only show if there's saved content */}
      {hasModifications() && (
        <div className="section-card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button
            className="clear-inspection-btn"
            onClick={clearCoverageAnalysis}
            style={{ background: 'var(--danger-color)' }}
          >
            Clear Coverage Analysis
          </button>
        </div>
      )}

      {/* Section 1: Manual Entry Fields */}
      <div className="section-card" style={{ marginBottom: '2rem' }}>
        <h2>Loss Information</h2>
        <div style={{ paddingTop: '1rem' }}>
          <label>Description of Loss:</label>
          <textarea
            value={manualFields.descriptionOfLoss}
            onChange={(e) => handleManualFieldChange('descriptionOfLoss', e.target.value)}
            placeholder="Enter description of loss..."
          />

          <label>Date of Loss Reported:</label>
          <input
            type="text"
            value={manualFields.dateOfLossReported}
            onChange={(e) => handleManualFieldChange('dateOfLossReported', e.target.value)}
            placeholder="MM/DD/YYYY"
          />

          <label>ISO:</label>
          <input
            type="text"
            value={manualFields.iso}
            onChange={(e) => handleManualFieldChange('iso', e.target.value)}
            placeholder="Enter ISO..."
          />

          <label>AO:</label>
          <input
            type="text"
            value={manualFields.ao}
            onChange={(e) => handleManualFieldChange('ao', e.target.value)}
            placeholder="no prior loss is claim center"
          />
        </div>
      </div>

      {/* Section 2: Dec Page Input */}
      <div className="section-card" style={{ marginBottom: '2rem' }}>
        <h2>Dec Page Parser</h2>
        <div style={{ paddingTop: '1rem' }}>
          <label>Paste Dec Page Text:</label>
          <textarea
            value={rawDecText}
            onChange={(e) => setRawDecText(e.target.value)}
            placeholder="Paste the full Dec page text here..."
            style={{ minHeight: '200px' }}
          />
          <button onClick={handleParseDecPage}>Parse Coverage Analysis</button>
        </div>
      </div>

      {/* Section 3: Parsed Data Display */}
      <div className="section-card" style={{ marginBottom: '2rem' }}>
        <h2>Parsed Coverage Data</h2>
        <div style={{ paddingTop: '1rem' }}>
          <label>Policy Type:</label>
          <input
            type="text"
            value={parsedData.policyType}
            onChange={(e) => handleParsedDataChange('policyType', e.target.value)}
            placeholder="17903, 15003, 15001, or 15004"
          />

          <label>Policy Term Start:</label>
          <input
            type="text"
            value={parsedData.policyTermStart}
            onChange={(e) => handleParsedDataChange('policyTermStart', e.target.value)}
            placeholder="MM-DD-YYYY"
          />

          <label>Policy Term End:</label>
          <input
            type="text"
            value={parsedData.policyTermEnd}
            onChange={(e) => handleParsedDataChange('policyTermEnd', e.target.value)}
            placeholder="MM-DD-YYYY"
          />

          <label>Been with AO since:</label>
          <input
            type="text"
            value={parsedData.beenWithAOSince}
            onChange={(e) => handleParsedDataChange('beenWithAOSince', e.target.value)}
            placeholder="Month Year"
          />

          <label>Construction:</label>
          <input
            type="text"
            value={parsedData.construction}
            onChange={(e) => handleParsedDataChange('construction', e.target.value)}
            placeholder="Construction details..."
          />

          <label>SIP:</label>
          <input
            type="text"
            value={parsedData.sip}
            onChange={(e) => handleParsedDataChange('sip', e.target.value)}
            placeholder="Secured Interest Party..."
          />

          <label>Coverage A - Dwelling:</label>
          <input
            type="text"
            value={parsedData.coverageA}
            onChange={(e) => handleParsedDataChange('coverageA', e.target.value)}
            placeholder="$XXX,XXX"
          />

          <label>Coverage B - Other Structures:</label>
          <input
            type="text"
            value={parsedData.coverageB}
            onChange={(e) => handleParsedDataChange('coverageB', e.target.value)}
            placeholder="$XX,XXX"
          />

          <label>Coverage C - Personal Property:</label>
          <input
            type="text"
            value={parsedData.coverageC}
            onChange={(e) => handleParsedDataChange('coverageC', e.target.value)}
            placeholder="$XXX,XXX"
          />

          <label>Coverage D - Additional Living Expense:</label>
          <input
            type="text"
            value={parsedData.coverageD}
            onChange={(e) => handleParsedDataChange('coverageD', e.target.value)}
            placeholder="$XXX,XXX"
          />

          <label>Deductible:</label>
          <input
            type="text"
            value={parsedData.deductible}
            onChange={(e) => handleParsedDataChange('deductible', e.target.value)}
            placeholder="$X,XXX - All Peril Deductible"
          />

          <label>Endorsements:</label>
          <div className="endorsements-list">
            {endorsements.length === 0 && (
              <p style={{ color: 'var(--light-text-color)', fontStyle: 'italic' }}>
                No endorsements parsed yet. Paste Dec page text and click "Parse Coverage Analysis".
              </p>
            )}
            {endorsements.map(endorsement => (
              <div key={endorsement.id} className="endorsement-row">
                <input
                  type="checkbox"
                  checked={endorsement.included}
                  onChange={() => toggleEndorsement(endorsement.id)}
                />
                <span>
                  {endorsement.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Generated Output */}
      <div className="section-card" style={{ marginBottom: '2rem' }}>
        <h2>Generated Coverage Analysis</h2>
        <div style={{ paddingTop: '1rem' }}>
          <textarea
            value={generatedNote}
            onChange={(e) => setGeneratedNote(e.target.value)}
            style={{ minHeight: '300px', fontFamily: 'monospace' }}
          />
          <div className="note-actions">
            <button
              className="copy-btn"
              onClick={copyToClipboard}
              style={copySuccess ? { background: '#16a34a' } : {}}
            >
              {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      </div>

      {/* Clear Button at Bottom - Only show if there's saved content */}
      {hasModifications() && (
        <div className="section-card" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            className="clear-inspection-btn"
            onClick={clearCoverageAnalysis}
            style={{ background: 'var(--danger-color)' }}
          >
            Clear Coverage Analysis
          </button>
        </div>
      )}
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
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [pdfFilename, setPdfFilename] = useState('photo-report');
  const [showInfoModal, setShowInfoModal] = useState(false);
  // Grid drag indicator state
  const [dragFromIndex, setDragFromIndex] = useState(null);
  const [dragIndicator, setDragIndicator] = useState({ index: null, position: 'before' });
  
  // Detect iOS for special handling
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Load saved photos from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fieldnote_photo_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.photos) {
          // Reconstruct photos with blob URLs
          const restoredPhotos = data.photos.map(photo => ({
            ...photo,
            // Keep the src as is - it will be a blob URL or data URL
          }));
          setPhotos(restoredPhotos);
        }
        if (data.photosPerPage) setPhotosPerPage(data.photosPerPage);
        if (data.compression) setCompression(data.compression);
      } catch (error) {
        console.error('Failed to load saved photo data:', error);
      }
    }
    setHasLoadedFromStorage(true);
  }, []);

  // Auto-save to localStorage whenever photos or settings change
  useEffect(() => {
    if (!hasLoadedFromStorage) return; // Don't save until initial load is complete
    
    const dataToSave = {
      photos: photos.map(photo => ({
        id: photo.id,
        src: photo.src,
        caption: photo.caption,
        rotation: photo.rotation,
      })),
      photosPerPage,
      compression,
      savedAt: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('fieldnote_photo_data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save photo data:', error);
    }
  }, [photos, photosPerPage, compression, hasLoadedFromStorage]);
  
  // Note: No cleanup needed for data URLs (they're stored as base64 strings)

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);
  };

  const processFiles = async (files) => {
    if (files.length === 0) return;
    setIsProcessingFiles(true);
    try {
      for (const file of files) {
        // Handle .msg files
        if (file.name.toLowerCase().endsWith('.msg')) {
          await processMsgFile(file);
        }
        // Handle HEIC files
        else if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          await processHeicFile(file);
        }
        // Handle regular images
        else if (file.type.startsWith('image/')) {
          // Convert to data URL for persistence
          let dataUrl = await fileToDataUrl(file);

          // Check for EXIF orientation and correct if needed
          try {
            const arrayBuffer = await file.arrayBuffer();
            const orientation = getOrientationFromExif(arrayBuffer);
            if (orientation !== 1) {
              dataUrl = await correctImageOrientation(dataUrl, orientation);
            }
          } catch (error) {
            console.log('Could not read EXIF orientation, using image as-is:', error);
          }

          const newPhoto = { id: Date.now() + Math.random(), src: dataUrl, caption: '', rotation: 0, file };
          setPhotos(prev => [...prev, newPhoto]);
        }
      }
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Extract EXIF orientation and auto-correct image
  const getOrientationFromExif = (arrayBuffer) => {
    const view = new DataView(arrayBuffer);
    if (view.getUint16(0, false) !== 0xFFD8) return 1; // Not a JPEG
    
    const length = view.byteLength;
    let offset = 2;
    
    while (offset < length) {
      if (view.getUint16(offset + 2, false) <= 8) return 1;
      const marker = view.getUint16(offset, false);
      offset += 2;
      
      if (marker === 0xFFE1) { // APP1 marker (EXIF)
        const littleEndian = view.getUint16(offset + 10, false) === 0x4949;
        offset += 4;
        
        const tags = view.getUint16(offset + 8, littleEndian);
        offset += 10;
        
        for (let i = 0; i < tags; i++) {
          const tag = view.getUint16(offset + (i * 12), littleEndian);
          if (tag === 0x0112) { // Orientation tag
            return view.getUint16(offset + (i * 12) + 8, littleEndian);
          }
        }
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break;
      } else {
        offset += view.getUint16(offset, false);
      }
    }
    return 1;
  };

  const correctImageOrientation = async (dataUrl, orientation) => {
    if (orientation === 1) return dataUrl; // No correction needed
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { colorSpace: 'srgb' });
        
        // Set canvas size based on orientation
        if (orientation > 4 && orientation < 9) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        // Transform based on orientation
        switch (orientation) {
          case 2:
            ctx.transform(-1, 0, 0, 1, img.width, 0);
            break;
          case 3:
            ctx.transform(-1, 0, 0, -1, img.width, img.height);
            break;
          case 4:
            ctx.transform(1, 0, 0, -1, 0, img.height);
            break;
          case 5:
            ctx.transform(0, 1, 1, 0, 0, 0);
            break;
          case 6:
            ctx.transform(0, 1, -1, 0, img.height, 0);
            break;
          case 7:
            ctx.transform(0, -1, -1, 0, img.height, img.width);
            break;
          case 8:
            ctx.transform(0, -1, 1, 0, 0, img.width);
            break;
        }
        
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = dataUrl;
    });
  };

  const processHeicFile = async (file) => {
    try {
      // For HEIC files, convert to data URL for persistence
      const dataUrl = await fileToDataUrl(file);
      const newPhoto = { 
        id: Date.now() + Math.random(), 
        src: dataUrl, 
        caption: '', 
        rotation: 0, 
        file,
        isHeic: true
      };
      setPhotos(prev => [...prev, newPhoto]);
    } catch (error) {
      console.error('Error processing HEIC file:', error);
      alert('Failed to load HEIC image. Please try converting it to JPG first.');
    }
  };

  const processMsgFile = async (file) => {
    try {
      // Read the .msg file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Minimum dimensions to filter out thumbnails and icons
      // Photos should be at least 400px on each dimension
      const MIN_DIMENSION = 400;
      
      const rawImages = [];
      
      // Find all JPEG start positions first
      const jpegStarts = [];
      for (let i = 0; i < uint8Array.length - 2; i++) {
        if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xD8 && uint8Array[i + 2] === 0xFF) {
          jpegStarts.push(i);
        }
      }
      
      // Find all JPEG EOI markers (FF D9)
      const jpegEnds = [];
      for (let i = 0; i < uint8Array.length - 1; i++) {
        if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xD9) {
          jpegEnds.push(i + 2); // Position after the EOI marker
        }
      }
      
      // For each JPEG start, find the best matching end
      // Strategy: The correct end is the LAST EOI marker before the next JPEG start (or file end)
      for (let startIdx = 0; startIdx < jpegStarts.length; startIdx++) {
        const start = jpegStarts[startIdx];
        const nextStart = startIdx + 1 < jpegStarts.length ? jpegStarts[startIdx + 1] : uint8Array.length;
        
        // Find all EOI markers between this start and the next start
        const validEnds = jpegEnds.filter(end => end > start + 100 && end <= nextStart);
        
        if (validEnds.length > 0) {
          // Use the LAST valid EOI as the end (this captures the full image, not truncated)
          const end = validEnds[validEnds.length - 1];
          const imageData = uint8Array.slice(start, end);
          const blob = new Blob([imageData], { type: 'image/jpeg' });
          rawImages.push({ blob, type: 'jpeg', size: blob.size, start, end });
        }
      }
      
      // Search for PNG images
      let i = 0;
      while (i < uint8Array.length - 8) {
        if (uint8Array[i] === 0x89 && uint8Array[i + 1] === 0x50 && 
            uint8Array[i + 2] === 0x4E && uint8Array[i + 3] === 0x47) {
          // Found PNG start
          let end = i + 8;
          // Look for PNG end marker (IEND chunk)
          while (end < uint8Array.length - 7) {
            if (uint8Array[end] === 0x49 && uint8Array[end + 1] === 0x45 && 
                uint8Array[end + 2] === 0x4E && uint8Array[end + 3] === 0x44) {
              end += 12; // Include IEND chunk and CRC
              break;
            }
            end++;
          }
          if (end <= uint8Array.length && end > i + 8) {
            const imageData = uint8Array.slice(i, end);
            const blob = new Blob([imageData], { type: 'image/png' });
            rawImages.push({ blob, type: 'png', size: blob.size, start: i, end });
            i = end;
            continue;
          }
        }
        i++;
      }
      
      if (rawImages.length === 0) {
        alert('No images found in the .msg file');
        return;
      }
      
      // Helper function to compute a perceptual hash for duplicate detection
      const computeImageHash = (canvas, ctx, img) => {
        // Resize to 16x16 and convert to grayscale for comparison
        const hashSize = 16;
        canvas.width = hashSize;
        canvas.height = hashSize;
        ctx.drawImage(img, 0, 0, hashSize, hashSize);
        const imageData = ctx.getImageData(0, 0, hashSize, hashSize);
        const data = imageData.data;

        // Convert to grayscale values
        const grayValues = [];
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          grayValues.push(gray);
        }

        // Compute average
        const avg = grayValues.reduce((a, b) => a + b, 0) / grayValues.length;

        // Generate hash: 1 if pixel > average, 0 otherwise
        return grayValues.map(v => v > avg ? '1' : '0').join('');
      };

      // Helper function to compute hamming distance between two hashes
      const hammingDistance = (hash1, hash2) => {
        if (hash1.length !== hash2.length) return Infinity;
        let distance = 0;
        for (let i = 0; i < hash1.length; i++) {
          if (hash1[i] !== hash2[i]) distance++;
        }
        return distance;
      };

      // Validate all images by actually loading them and getting their properties
      const validatedImages = [];

      for (const img of rawImages) {
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(img.blob);
          });

          // Load the image to validate and get dimensions
          const imageInfo = await new Promise((resolve) => {
            const testImg = new Image();
            testImg.onload = () => {
              if (testImg.width > 0 && testImg.height > 0) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                // Sample multiple regions for better grayscale detection
                // Sample center, and 4 corners - much more representative
                const sampleSize = 64;
                const regions = [
                  { x: testImg.width / 2 - sampleSize / 2, y: testImg.height / 2 - sampleSize / 2 }, // center
                  { x: 0, y: 0 }, // top-left
                  { x: testImg.width - sampleSize, y: 0 }, // top-right
                  { x: 0, y: testImg.height - sampleSize }, // bottom-left
                  { x: testImg.width - sampleSize, y: testImg.height - sampleSize }, // bottom-right
                ];

                canvas.width = sampleSize;
                canvas.height = sampleSize;

                let totalColorPixels = 0;
                let totalSampledPixels = 0;

                for (const region of regions) {
                  const sx = Math.max(0, Math.min(region.x, testImg.width - sampleSize));
                  const sy = Math.max(0, Math.min(region.y, testImg.height - sampleSize));
                  const sw = Math.min(sampleSize, testImg.width);
                  const sh = Math.min(sampleSize, testImg.height);

                  ctx.drawImage(testImg, sx, sy, sw, sh, 0, 0, sw, sh);

                  try {
                    const imageData = ctx.getImageData(0, 0, sw, sh);
                    const data = imageData.data;
                    const pixelCount = sw * sh;

                    for (let p = 0; p < pixelCount; p++) {
                      const idx = p * 4;
                      const r = data[idx];
                      const g = data[idx + 1];
                      const b = data[idx + 2];
                      // A pixel is "colored" if R, G, B differ significantly
                      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(b - r));
                      if (maxDiff > 10) { // Slightly lower threshold for better detection
                        totalColorPixels++;
                      }
                    }
                    totalSampledPixels += pixelCount;
                  } catch (e) {
                    // Skip this region on error
                  }
                }

                // Image is grayscale if less than 3% of sampled pixels have color
                const isGrayscale = totalSampledPixels > 0 ? (totalColorPixels / totalSampledPixels) < 0.03 : false;

                // Compute perceptual hash for duplicate detection
                const hash = computeImageHash(canvas, ctx, testImg);

                resolve({
                  valid: true,
                  width: testImg.width,
                  height: testImg.height,
                  isGrayscale,
                  hash,
                  pixelCount: testImg.width * testImg.height
                });
              } else {
                resolve({ valid: false });
              }
            };
            testImg.onerror = () => resolve({ valid: false });
            testImg.src = dataUrl;
          });

          if (imageInfo.valid) {
            validatedImages.push({ ...img, dataUrl, ...imageInfo });
          }
        } catch (error) {
          console.log('Skipping invalid image:', error);
        }
      }

      if (validatedImages.length === 0) {
        alert('No valid images could be extracted from the .msg file');
        return;
      }

      // Filter out thumbnails and small icons based on dimensions
      // Keep images where BOTH dimensions are at least MIN_DIMENSION
      const fullSizeImages = validatedImages.filter(img =>
        img.width >= MIN_DIMENSION && img.height >= MIN_DIMENSION
      );

      // If all images were filtered out (maybe small photos?), fall back to file size filtering
      const imagesToProcess = fullSizeImages.length > 0
        ? fullSizeImages
        : validatedImages.filter(img => img.size > 50000); // 50KB minimum as fallback

      if (imagesToProcess.length === 0) {
        alert('No suitable photos found in the .msg file (all images appear to be thumbnails or icons)');
        return;
      }

      // Use perceptual hashing to find TRUE duplicates (same visual content)
      // This replaces the flawed dimension-based grouping
      const uniqueImages = [];
      const HASH_THRESHOLD = 12; // Allow up to 12 bits difference (out of 256) for duplicates

      for (const img of imagesToProcess) {
        // Check if this image is a duplicate of one we've already kept
        let isDuplicate = false;
        let duplicateIndex = -1;

        for (let i = 0; i < uniqueImages.length; i++) {
          const existing = uniqueImages[i];
          // Only compare images with similar dimensions (within 5% tolerance)
          const widthRatio = img.width / existing.width;
          const heightRatio = img.height / existing.height;
          if (widthRatio > 0.95 && widthRatio < 1.05 && heightRatio > 0.95 && heightRatio < 1.05) {
            const distance = hammingDistance(img.hash, existing.hash);
            if (distance <= HASH_THRESHOLD) {
              isDuplicate = true;
              duplicateIndex = i;
              break;
            }
          }
        }

        if (isDuplicate) {
          // This is a duplicate - keep the better version (color over grayscale, then larger size)
          const existing = uniqueImages[duplicateIndex];
          const shouldReplace =
            (existing.isGrayscale && !img.isGrayscale) || // Prefer color
            (existing.isGrayscale === img.isGrayscale && img.size > existing.size); // Same color status, prefer larger

          if (shouldReplace) {
            uniqueImages[duplicateIndex] = img;
          }
        } else {
          // Not a duplicate - keep it
          uniqueImages.push(img);
        }
      }
      
      // Sort images by their position in the file to maintain original order
      uniqueImages.sort((a, b) => a.start - b.start);
      
      // Add deduplicated images to photos with orientation correction
      for (let index = 0; index < uniqueImages.length; index++) {
        const img = uniqueImages[index];
        let correctedDataUrl = img.dataUrl;
        
        // Check for EXIF orientation and correct if needed
        try {
          const imgArrayBuffer = await img.blob.arrayBuffer();
          const orientation = getOrientationFromExif(imgArrayBuffer);
          if (orientation !== 1) {
            correctedDataUrl = await correctImageOrientation(img.dataUrl, orientation);
          }
        } catch (error) {
          console.log('Could not read EXIF orientation for extracted image, using as-is:', error);
        }
        
        const photoFile = new File([img.blob], `extracted_${index}.${img.type}`, { type: `image/${img.type}` });
        const newPhoto = {
          id: Date.now() + Math.random() + index,
          src: correctedDataUrl,
          caption: '',
          rotation: 0,
          file: photoFile
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
      
      console.log(`MSG extraction complete: Found ${rawImages.length} raw images, ${validatedImages.length} valid, ${fullSizeImages.length} full-size, ${uniqueImages.length} unique`);
      
    } catch (error) {
      console.error('Error processing .msg file:', error);
      alert('Failed to extract images from .msg file. The file may be corrupted or in an unsupported format.');
    }
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

  const clearAllPhotos = () => {
    const confirmed = window.confirm('Are you sure? This will delete all photos and captions.');
    if (confirmed) {
      // Clear all state
      setPhotos([]);
      setSelectedPhotos(new Set());
      setPhotosPerPage(1);
      setCompression('regular');
      
      // Clear localStorage
      localStorage.removeItem('fieldnote_photo_data');
    }
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

  const handleDrop = async (e) => { 
    if (isIOS) return; // Disable drag/drop on iOS
    e.preventDefault(); 
    e.stopPropagation(); 
    if (dropZoneRef.current) dropZoneRef.current.classList.remove('dragover'); 
    await processFiles(Array.from(e.dataTransfer.files)); 
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
    if (isGeneratingPdf) return; // Prevent multiple simultaneous generations
    setIsGeneratingPdf(true);
    
    try {
      const { jsPDF } = window.jspdf;
    // Use landscape orientation when 2 images per page is selected
    const orientation = photosPerPage === 2 ? 'landscape' : 'portrait';
    const doc = new jsPDF({ unit: 'in', format: 'letter', orientation });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 0.5;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const settingsMap = { regular: { dpi: 144, quality: 0.92 }, smaller: { dpi: 120, quality: 0.82 }, smallest: { dpi: 96, quality: 0.72 } };
    const { dpi, quality } = settingsMap[compression] || settingsMap.regular;

    const loadImage = (src) => new Promise((resolve, reject) => { 
      const img = new Image(); 
      img.crossOrigin = 'anonymous'; // For CORS
      img.onload = () => resolve(img); 
      img.onerror = reject; 
      img.src = src; 
    });

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

      // Apply compression settings properly
      const targetWidthPx = Math.max(1, Math.round(targetWidthIn * dpi));
      const targetHeightPx = Math.max(1, Math.round(targetHeightIn * dpi));

      const canvas = document.createElement('canvas');
      canvas.width = rotated ? targetHeightPx : targetWidthPx;
      canvas.height = rotated ? targetWidthPx : targetHeightPx;
      const ctx = canvas.getContext('2d', { colorSpace: 'srgb' });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -targetWidthPx / 2, -targetHeightPx / 2, targetWidthPx, targetHeightPx);
      ctx.restore();

      // Apply quality compression
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
        // Side by side layout for 2 images per page in landscape
        const slotWidthIn = contentWidth / 2 - 0.25; // Split width with gap
        const imageMaxHeightIn = contentHeight - 0.9; // Leave room for caption
        const gap = 0.5; // Gap between images
        
        // Pre-calculate image heights for vertical centering
        const photoHeights = [];
        for (let slot = 0; slot < 2 && index + slot < photos.length; slot++) {
          const img = await loadImage(photos[index + slot].src);
          const rotation = ((photos[index + slot].rotation || 0) % 360 + 360) % 360;
          const rotated = rotation % 180 !== 0;
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;
          const orientedWidth = rotated ? originalHeight : originalWidth;
          const orientedHeight = rotated ? originalWidth : originalHeight;
          const aspect = orientedWidth / orientedHeight;
          
          let targetWidthIn = Math.min(slotWidthIn, imageMaxHeightIn * aspect);
          let targetHeightIn = targetWidthIn / aspect;
          if (targetHeightIn > imageMaxHeightIn) { 
            targetHeightIn = imageMaxHeightIn; 
            targetWidthIn = targetHeightIn * aspect; 
          }
          photoHeights.push(targetHeightIn);
        }
        
        // Find max height to calculate vertical centering
        const maxPhotoHeight = Math.max(...photoHeights);
        const captionHeight = 0.9;
        const totalContentHeight = maxPhotoHeight + captionHeight;
        const verticalSpace = contentHeight - totalContentHeight;
        const topMargin = margin + (verticalSpace > 0 ? verticalSpace / 2 : 0);
        
        for (let slot = 0; slot < 2 && index < photos.length; slot++) {
          const xIn = margin + (slot === 0 ? 0 : slotWidthIn + gap);
          
          // Center this image vertically within its slot if it's smaller than maxPhotoHeight
          const imageVerticalOffset = (maxPhotoHeight - photoHeights[slot]) / 2;
          const yIn = topMargin + imageVerticalOffset;
          
          const { imageHeightIn } = await drawPhoto(photos[index], xIn, yIn, slotWidthIn, imageMaxHeightIn);
          const caption = photos[index].caption || '';
          const captionY = topMargin + maxPhotoHeight + 0.2;
          const lines = doc.splitTextToSize(caption, slotWidthIn);
          doc.setFontSize(10);
          // Center captions horizontally
          const captionX = xIn + slotWidthIn / 2;
          doc.text(lines, captionX, captionY, { maxWidth: slotWidthIn, align: 'center' });
          index++;
        }
      } else {
        // Single photo per page - center it vertically on the page
        const imageMaxHeightIn = contentHeight - 1.0;
        
        // First, calculate the image height to determine vertical centering
        const img = await loadImage(photos[index].src);
        const rotation = ((photos[index].rotation || 0) % 360 + 360) % 360;
        const rotated = rotation % 180 !== 0;
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;
        const orientedWidth = rotated ? originalHeight : originalWidth;
        const orientedHeight = rotated ? originalWidth : originalHeight;
        const aspect = orientedWidth / orientedHeight;
        
        let targetWidthIn = Math.min(contentWidth, imageMaxHeightIn * aspect);
        let targetHeightIn = targetWidthIn / aspect;
        if (targetHeightIn > imageMaxHeightIn) { 
          targetHeightIn = imageMaxHeightIn; 
          targetWidthIn = targetHeightIn * aspect; 
        }
        
        // Center the photo vertically
        const verticalSpace = contentHeight - targetHeightIn - 1.0; // Space minus image and caption area
        const topMargin = margin + (verticalSpace > 0 ? verticalSpace / 2 : 0);
        
        // Draw photo with centered vertical position
        const { imageHeightIn } = await drawPhoto(photos[index], margin, topMargin, contentWidth, imageMaxHeightIn);
        
        const caption = photos[index].caption || '';
        const captionY = topMargin + imageHeightIn + 0.3;
        const lines = doc.splitTextToSize(caption, contentWidth);
        doc.setFontSize(12);
        // Center captions horizontally
        const captionX = margin + contentWidth / 2;
        doc.text(lines, captionX, captionY, { maxWidth: contentWidth, align: 'center' });
        index++;
      }
    }
    
      // Use custom filename or default with timestamp
      const sanitizedFilename = pdfFilename.trim() || 'photo-report';
      const filename = `${sanitizedFilename}.pdf`;

      // Save the PDF directly to ensure all photos are saved locally
      doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // preview removed

  return (
    <div>
      {/* Info Button */}
      <div className="info-button-container">
        <InfoButton onClick={() => setShowInfoModal(true)} />
      </div>

      {/* Info Modal */}
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} title="Photo Report">
        <p>This tool is designed to get photos into your file quickly - not as a main photo report for your inspection.</p>
        <p><strong>Use Case:</strong> When contractors or insureds send multiple photos in an email body or attachment. Drag and drop your <code>.msg</code> file straight from Outlook and it will extract the photos to print into your file.</p>
        <p><strong>Features:</strong></p>
        <ul>
          <li>Label photos with captions if needed</li>
          <li>Rotate images that are oriented incorrectly</li>
          <li>Reorder photos by dragging them</li>
          <li>Export to PDF with 1 or 2 photos per page</li>
        </ul>
        <p><strong>Tip:</strong> On iOS, tap to upload. On desktop, drag & drop works great.</p>
      </InfoModal>

      <div id="photo-controls" className="section-card no-print">
        <h2>Photo Report Builder</h2>

        {/* Clear Photos Button */}
        {photos.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button 
              className="clear-photos-btn" 
              onClick={clearAllPhotos}
              style={{ background: 'var(--danger-color)' }}
            >
              Clear All Photos
            </button>
          </div>
        )}
        
        <input type="file" multiple accept="image/*,.heic,.heif,.msg" onChange={handleFileChange} style={{ display: 'none' }} ref={fileInputRef} />
        <div id="photo-drop-zone" ref={dropZoneRef} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={isProcessingFiles ? undefined : openFilePicker} style={isProcessingFiles ? { cursor: 'wait', opacity: 0.7 } : {}}>
          {isProcessingFiles ? 'Processing files...' : (isIOS ? 'Tap to Upload Photos' : 'Drag & drop photos here or click to upload')}
        </div>
        {isProcessingFiles && (
          <div style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--primary-color)', fontWeight: 500 }}>
            Extracting and processing images, please wait...
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label>Filename</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="text"
                value={pdfFilename}
                onChange={(e) => setPdfFilename(e.target.value)}
                placeholder="photo-report"
                style={{ marginBottom: 0, flex: 1 }}
              />
              <span style={{ color: 'var(--light-text-color)', whiteSpace: 'nowrap' }}>.pdf</span>
            </div>
          </div>
          <button onClick={generatePdf} disabled={isGeneratingPdf || photos.length === 0}>
            {isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF'}
          </button>
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
              <div className="photo-report-page" key={`page-${index}`} style={{ flexDirection: 'row' }}>
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

const SettlementEmailBuilder = () => {
  const initialManualFields = {
    insuredName: '',
    paymentType: 'Check',
    checkDelivery: 'mail', // 'mail' or 'inPerson'
    claimNumberPrefix: '300',
    claimNumberMiddle: '',
    claimNumberSuffix: '2026',
    nrcdType: 'none', // 'none', 'roof', 'pp' (personal property)
  };

  const [rawEstimateText, setRawEstimateText] = useState('');
  const [coverages, setCoverages] = useState([]);
  const [manualFields, setManualFields] = useState(initialManualFields);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyHtmlSuccess, setCopyHtmlSuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Check if there are modifications to show clear button
  const hasModifications = () => {
    const manualFieldsChanged = JSON.stringify(manualFields) !== JSON.stringify(initialManualFields);
    const hasCoverages = coverages.length > 0;
    const hasRawText = rawEstimateText.trim().length > 0;
    return manualFieldsChanged || hasCoverages || hasRawText;
  };

  // Load saved data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fieldnote_settlement_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.rawEstimateText) setRawEstimateText(data.rawEstimateText);
        if (data.coverages) setCoverages(data.coverages);
        if (data.manualFields) setManualFields(data.manualFields);
      } catch (error) {
        console.error('Failed to load saved settlement data:', error);
      }
    }
    setHasLoadedFromStorage(true);
  }, []);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (!hasLoadedFromStorage) return;

    const dataToSave = {
      rawEstimateText,
      coverages,
      manualFields,
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('fieldnote_settlement_data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save settlement data:', error);
    }
  }, [rawEstimateText, coverages, manualFields, hasLoadedFromStorage]);

  // ============ PARSING FUNCTIONS ============

  // Helper to parse dollar amounts
  const parseDollarAmount = (str) => {
    if (!str) return 0;
    const cleaned = str.replace(/[$,\s]/g, '').replace(/[()]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Helper to format dollar amounts
  const formatDollar = (num) => {
    return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse Xactimate estimate summaries
  const parseEstimateSummaries = (text) => {
    const parsedCoverages = [];

    // Split by "Summary for" to get each coverage section
    const sections = text.split(/Summary\s+for\s+/i);

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];

      // Get coverage name (first line or until newline)
      const nameMatch = section.match(/^([^\n]+)/);
      if (!nameMatch) continue;

      let coverageName = nameMatch[1].trim();
      // Clean up coverage name - remove location info like "(001: 1145 BARNES MILL RD)"
      coverageName = coverageName.replace(/\s*\([^)]*\)\s*$/, '').trim();

      // Extract values using regex
      const getValue = (pattern) => {
        const match = section.match(pattern);
        return match ? parseDollarAmount(match[1]) : 0;
      };

      // Parse different fields
      const lineItemTotal = getValue(/Line\s+Item\s+Total\s+\$?([\d,.-]+)/i);
      const overhead = getValue(/Overhead\s+\$?([\d,.-]+)/i);
      const profit = getValue(/Profit\s+\$?([\d,.-]+)/i);
      const salesTax = getValue(/(?:Material\s+)?Sales\s+Tax\s+\$?([\d,.-]+)/i);
      const rcv = getValue(/Replacement\s+Cost\s+Value\s+\$?([\d,.-]+)/i);

      // Depreciation - can be negative in parentheses or with minus
      const depMatch = section.match(/Less\s+Depreciation\s+\(?([\d,.-]+)\)?/i);
      const depreciation = depMatch ? Math.abs(parseDollarAmount(depMatch[1])) : 0;

      const acv = getValue(/Actual\s+Cash\s+Value\s+\$?([\d,.-]+)/i);

      // Deductible - can be negative
      const dedMatch = section.match(/Less\s+Deductible\s+\(?([\d,.-]+)\)?/i);
      const deductible = dedMatch ? Math.abs(parseDollarAmount(dedMatch[1])) : 0;

      // Prior payments - can be negative
      const priorMatch = section.match(/Less\s+Prior\s+Payment[s]?\s+\(?([\d,.-]+)\)?/i);
      const priorPayments = priorMatch ? Math.abs(parseDollarAmount(priorMatch[1])) : 0;

      // Net claim remaining
      const netClaimMatch = section.match(/Net\s+Claim(?:\s+Remaining)?\s+\$?([\d,.-]+)/i);
      const netClaim = netClaimMatch ? parseDollarAmount(netClaimMatch[1]) : 0;

      // Recoverable depreciation
      const recDepMatch = section.match(/(?:Total\s+)?Recoverable\s+Depreciation\s+\$?([\d,.-]+)/i);
      const recoverableDepreciation = recDepMatch ? parseDollarAmount(recDepMatch[1]) : 0;

      // Non-recoverable depreciation (if explicitly stated)
      const nrcdMatch = section.match(/(?:Total\s+)?Non[- ]?Recoverable\s+Depreciation\s+\$?([\d,.-]+)/i);
      const nonRecoverableDepreciation = nrcdMatch ? parseDollarAmount(nrcdMatch[1]) : 0;

      // Determine coverage type for special handling
      let coverageType = 'standard';
      if (coverageName.match(/Ordinance\s+or\s+Law|O\s*&\s*L/i)) {
        coverageType = 'ordinance';
      } else if (coverageName.match(/Dwelling|Cov\s*A/i)) {
        coverageType = 'dwelling';
      } else if (coverageName.match(/Other\s+Structures|Cov\s*B/i)) {
        coverageType = 'otherStructures';
      } else if (coverageName.match(/Contents|Personal\s+Property|Cov\s*C/i)) {
        coverageType = 'contents';
      } else if (coverageName.match(/Equipment\s+Breakdown|Service\s+Line/i)) {
        coverageType = 'equipmentBreakdown';
      }

      parsedCoverages.push({
        id: Date.now() + i,
        name: coverageName,
        type: coverageType,
        rcv: rcv || (lineItemTotal + overhead + profit + salesTax),
        depreciation,
        acv,
        deductible,
        priorPayments,
        netClaim,
        recoverableDepreciation,
        nonRecoverableDepreciation,
        // For Ordinance or Law - Paid When Incurred
        paidWhenIncurred: coverageType === 'ordinance' ? rcv : 0,
      });
    }

    return parsedCoverages;
  };

  // ============ HANDLER FUNCTIONS ============

  const handleParseEstimate = () => {
    const parsed = parseEstimateSummaries(rawEstimateText);
    setCoverages(parsed);
  };

  const handleManualFieldChange = (field, value) => {
    setManualFields(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverageChange = (id, field, value) => {
    setCoverages(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: parseDollarAmount(value) } : c
    ));
  };

  const removeCoverage = (id) => {
    setCoverages(prev => prev.filter(c => c.id !== id));
  };

  const clearSettlementEmail = () => {
    const confirmed = window.confirm('Are you sure? This will clear all settlement email data.');
    if (confirmed) {
      setRawEstimateText('');
      setCoverages([]);
      setManualFields(initialManualFields);
      setGeneratedEmail('');
      setGeneratedHtml('');
      localStorage.removeItem('fieldnote_settlement_data');
    }
  };

  // Copy plain text to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedEmail);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Copy HTML to clipboard (for Outlook)
  const copyHtmlToClipboard = async () => {
    try {
      const blob = new Blob([generatedHtml], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([clipboardItem]);
      setCopyHtmlSuccess(true);
      setTimeout(() => setCopyHtmlSuccess(false), 2000);
    } catch (error) {
      // Fallback for browsers that don't support ClipboardItem
      try {
        await navigator.clipboard.writeText(generatedHtml);
        setCopyHtmlSuccess(true);
        setTimeout(() => setCopyHtmlSuccess(false), 2000);
      } catch (fallbackError) {
        console.error('Failed to copy HTML:', fallbackError);
      }
    }
  };

  // ============ EMAIL GENERATION ============

  // Calculate totals
  const getTotals = () => {
    let totalNetClaim = 0;
    let totalRecoverableDepreciation = 0;
    let totalNonRecoverableDepreciation = 0;
    let totalPaidWhenIncurred = 0;
    let hasOrdinanceOrLaw = false;

    coverages.forEach(c => {
      totalNetClaim += c.netClaim || 0;
      totalRecoverableDepreciation += c.recoverableDepreciation || 0;
      totalNonRecoverableDepreciation += c.nonRecoverableDepreciation || 0;
      if (c.type === 'ordinance') {
        hasOrdinanceOrLaw = true;
        totalPaidWhenIncurred += c.paidWhenIncurred || 0;
      }
    });

    return {
      totalNetClaim,
      totalRecoverableDepreciation,
      totalNonRecoverableDepreciation,
      totalPaidWhenIncurred,
      hasOrdinanceOrLaw
    };
  };

  // Generate email content
  useEffect(() => {
    if (coverages.length === 0) {
      setGeneratedEmail('');
      setGeneratedHtml('');
      return;
    }

    const totals = getTotals();
    const { insuredName, paymentType, checkDelivery, claimNumberPrefix, claimNumberMiddle, claimNumberSuffix, nrcdType } = manualFields;

    // Build full claim number
    const fullClaimNumber = claimNumberMiddle ? `${claimNumberPrefix}-${claimNumberMiddle}-${claimNumberSuffix}` : 'xxxxx';

    // Build email sections
    let emailParts = [];
    let htmlParts = [];

    // Opening
    const salutation = insuredName ? `Mr. and Mrs. ${insuredName}` : 'Mr. and Mrs. [NAME]';
    emailParts.push(`${salutation},\n\nAttached is the approved estimate for the repairs to your dwelling. Please provide the approved estimate to the contractor of your choice. If your contractor has issues/concerns with the attached approved estimate, then please advise your contractor to submit an itemized estimate for review. Please be advised that any work performed above and beyond what is outlined in the attached approved estimate without prior approval from Auto-Owners Insurance Company could cause coverage concerns.`);

    htmlParts.push(`<p>${salutation},</p><p>Attached is the approved estimate for the repairs to your dwelling. Please provide the approved estimate to the contractor of your choice. If your contractor has issues/concerns with the attached approved estimate, then please advise your contractor to submit an itemized estimate for review. Please be advised that any work performed above and beyond what is outlined in the attached approved estimate without prior approval from Auto-Owners Insurance Company could cause coverage concerns.</p>`);

    // Payment method - CHECK
    if (paymentType === 'Check') {
      if (checkDelivery === 'inPerson') {
        emailParts.push(`\nYour payment has been issued by check and was provided to you in person. If applicable your check may include your mortgage company and will require their endorsement. Please contact your mortgage company for details on their endorsement process.`);
        htmlParts.push(`<p>Your payment has been issued by check and was provided to you in person. If applicable your check may include your mortgage company and will require their endorsement. Please contact your mortgage company for details on their endorsement process.</p>`);
      } else {
        emailParts.push(`\nYour payment has been issued by check and should arrive within 3-5 business days. If applicable your check may include your mortgage company and will require their endorsement. Please contact your mortgage company for details on their endorsement process.`);
        htmlParts.push(`<p>Your payment has been issued by check and should arrive within 3-5 business days. If applicable your check may include your mortgage company and will require their endorsement. Please contact your mortgage company for details on their endorsement process.</p>`);
      }
    }

    // Coverage breakdown header
    emailParts.push(`\nBelow is a breakdown of the attached approved estimate:`);
    htmlParts.push(`<p><strong>Below is a breakdown of the attached approved estimate:</strong></p>`);

    // Build HTML table for coverages
    let tableHtml = `<table style="border-collapse: collapse; width: 100%; max-width: 600px; font-family: Arial, sans-serif; margin: 16px 0;">`;

    // Process each coverage
    coverages.forEach(coverage => {
      let coverageText = '';

      if (coverage.type === 'ordinance') {
        // Ordinance or Law - special format
        coverageText = `\nSummary for ${coverage.name}:\nPaid when Incurred: ${formatDollar(coverage.paidWhenIncurred)}\nNet Claim: ${formatDollar(coverage.netClaim)}`;

        tableHtml += `
          <tr style="background-color: #f8fafc;">
            <td colspan="2" style="padding: 12px; font-weight: bold; border-bottom: 2px solid #2563eb; color: #1f2937;">Summary for ${coverage.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">Paid when Incurred:</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #1f2937;">${formatDollar(coverage.paidWhenIncurred)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1f2937;">Net Claim:</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #2563eb;">${formatDollar(coverage.netClaim)}</td>
          </tr>
          <tr><td colspan="2" style="padding: 8px;"></td></tr>`;
      } else {
        // Standard coverage format - only show if there's depreciation
        if (coverage.depreciation > 0) {
          coverageText = `\nSummary for ${coverage.name} Replacement Cost:\n${formatDollar(coverage.rcv)}\nLess Recoverable Depreciation: ${formatDollar(coverage.recoverableDepreciation)}\nLess Deductible: ${formatDollar(coverage.deductible)}\nNet Claim: ${formatDollar(coverage.netClaim)}`;

          tableHtml += `
            <tr style="background-color: #f8fafc;">
              <td colspan="2" style="padding: 12px; font-weight: bold; border-bottom: 2px solid #2563eb; color: #1f2937;">Summary for ${coverage.name} Replacement Cost</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">Replacement Cost Value:</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #1f2937;">${formatDollar(coverage.rcv)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">Less Recoverable Depreciation:</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #dc2626;">${formatDollar(coverage.recoverableDepreciation)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">Less Deductible:</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #dc2626;">${formatDollar(coverage.deductible)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1f2937;">Net Claim:</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #2563eb;">${formatDollar(coverage.netClaim)}</td>
            </tr>
            <tr><td colspan="2" style="padding: 8px;"></td></tr>`;
        } else {
          // No depreciation - simpler format
          coverageText = `\nSummary for ${coverage.name}:\nReplacement Cost Value: ${formatDollar(coverage.rcv)}\nLess Deductible: ${formatDollar(coverage.deductible)}\nNet Claim: ${formatDollar(coverage.netClaim)}`;

          tableHtml += `
            <tr style="background-color: #f8fafc;">
              <td colspan="2" style="padding: 12px; font-weight: bold; border-bottom: 2px solid #2563eb; color: #1f2937;">Summary for ${coverage.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">Replacement Cost Value:</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #1f2937;">${formatDollar(coverage.rcv)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">Less Deductible:</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #dc2626;">${formatDollar(coverage.deductible)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1f2937;">Net Claim:</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #2563eb;">${formatDollar(coverage.netClaim)}</td>
            </tr>
            <tr><td colspan="2" style="padding: 8px;"></td></tr>`;
        }
      }

      emailParts.push(coverageText);
    });

    // Total initial payment row
    tableHtml += `
      <tr style="background-color: #2563eb;">
        <td style="padding: 12px; font-weight: bold; color: white;">Total Initial Payment:</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: white;">${formatDollar(totals.totalNetClaim)}</td>
      </tr>`;
    tableHtml += `</table>`;

    emailParts.push(`\nTotal Initial Payment: ${formatDollar(totals.totalNetClaim)}`);
    htmlParts.push(tableHtml);

    // Recoverable Depreciation section (only if there is RD)
    if (totals.totalRecoverableDepreciation > 0) {
      const rdText = `\nRecoverable depreciation in the amount of ${formatDollar(totals.totalRecoverableDepreciation)} has been withheld pending completion of repairs. To claim the recoverable depreciation, the repairs must be completed within two years from the date of loss. Once the work is completed, please submit the contractor's final invoice along with photos of the completed repairs. If approved, we will issue a payment for the recoverable depreciation or the actual cost of repairs incurred, whichever is less. More details regarding your recoverable depreciation are provided in the attached ACV letter.`;
      emailParts.push(rdText);
      htmlParts.push(`<p>${rdText.trim()}</p>`);
    }

    // Non-Recoverable Depreciation section (based on user selection)
    if (nrcdType === 'roof' && totals.totalNonRecoverableDepreciation > 0) {
      const nrcdRoofText = `\nNon-recoverable depreciation in the amount of ${formatDollar(totals.totalNonRecoverableDepreciation)} has been applied based on the age and condition of the damaged roofing materials. Your policy includes an Actual Cash Value Loss Settlement for Roof Surfacing Damaged by Windstorm or Hail endorsement, which applies ACV settlement to cladding, shingles, tiles, sheeting, flashing, or other materials used on or above the decking for protection from moisture. Therefore, depreciation on these items is not recoverable, and the settlement reflects the actual cash value at the time of loss.`;
      emailParts.push(nrcdRoofText);
      htmlParts.push(`<p>${nrcdRoofText.trim()}</p>`);
    } else if (nrcdType === 'pp' && totals.totalNonRecoverableDepreciation > 0) {
      const nrcdPPText = `\nNon-recoverable depreciation has been withheld in the amount of ${formatDollar(totals.totalNonRecoverableDepreciation)}. Your policy settles certain types of property such as personal property, structures that are not buildings, antennas, carpeting, awnings, domestic appliances, and outdoor equipment at actual cash value based on their age and condition at the time of loss. As a result, depreciation on these items is not recoverable.`;
      emailParts.push(nrcdPPText);
      htmlParts.push(`<p>${nrcdPPText.trim()}</p>`);
    }

    // Paid When Incurred / Ordinance or Law section (only if O&L exists)
    if (totals.hasOrdinanceOrLaw && totals.totalPaidWhenIncurred > 0) {
      const pwiText = `\nPaid when incurred code upgrades in the amount of ${formatDollar(totals.totalPaidWhenIncurred)} have been withheld pending installation. These items were not part of the original structure or repairs but are now required by current building codes. Code upgrade costs are payable when incurred, subject to policy limits. Once installed, please submit photographs of the code upgrade items. If approved, we will issue payment for the incurred code upgrade costs, up to the amount allowed.`;
      emailParts.push(pwiText);
      htmlParts.push(`<p>${pwiText.trim()}</p>`);
    }

    // Payment method - EFT
    if (paymentType === 'EFT') {
      const eftText = `\nWe are issuing your supplement payment electronically. You will receive an email from Auto Owners informing you that a payment has been issued. Following this email, you will receive an email from One Inc. with a link to accept payment. After you click Accept Payment, it will ask you for your claim number and it will require you to go through a verification process. The verification process is a pin sent via text message to your phone number on file. After verifying your identity, you will then be asked to enter either your debit card or checking account number and routing number. Once this information is given you will get message confirming everything is ok. If you do not see this email, please check your spam folder. For security reasons, you must follow the instructions in the email within 3 business days, or the transaction will be voided. If you don't see this email, please check your spam folder.`;
      emailParts.push(eftText);
      htmlParts.push(`<p>${eftText.trim()}</p>`);
    }

    // Claim number and One Inc contact info (only for EFT)
    if (paymentType === 'EFT') {
      emailParts.push(`\nYour Claim # is: ${fullClaimNumber}`);
      htmlParts.push(`<p><strong>Your Claim # is:</strong> ${fullClaimNumber}</p>`);

      emailParts.push(`\nIf you have any questions or issues regarding your electronic payment and deposit, you can contact One, Inc. The customer service department will be able to better assist you. OneInc.'s customer service can be reached at (855) 682-1762.`);
      htmlParts.push(`<p>If you have any questions or issues regarding your electronic payment and deposit, you can contact One, Inc. The customer service department will be able to better assist you. OneInc.'s customer service can be reached at (855) 682-1762.</p>`);
    }

    // Closing
    emailParts.push(`\nIf you have any other questions related to your claim, please don't hesitate to contact me.`);
    htmlParts.push(`<p>If you have any other questions related to your claim, please don't hesitate to contact me.</p>`);

    // Disclaimer
    const disclaimer = `\nAll rights, terms, conditions and exclusions in your policy are in full force and effect and are completely reserved. No action by any employee, agent, attorney or other person on behalf of Auto-Owners Insurance; or hired by Auto-Owners Insurance on your behalf; shall waive or be construed as having waived any rights, term, condition, exclusion or any other provision of the policy.`;
    emailParts.push(disclaimer);
    htmlParts.push(`<p style="font-size: 11px; color: #64748b; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">${disclaimer.trim()}</p>`);

    setGeneratedEmail(emailParts.join('\n'));
    setGeneratedHtml(htmlParts.join(''));
  }, [coverages, manualFields]);

  // ============ RENDER ============

  return (
    <div>
      {/* Info Button */}
      <div className="info-button-container">
        <InfoButton onClick={() => setShowInfoModal(true)} />
      </div>

      {/* Info Modal */}
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} title="Settlement Email">
        <p>Very useful for onsite settlements. Paste your coverage summaries from your estimate into the parser and it will create a professional email template.</p>
        <p><strong>Features:</strong></p>
        <ul>
          <li>Copy and paste multiple coverages at once</li>
          <li>Automatically detects coverage types (Dwelling, Contents, O&L, etc.)</li>
          <li>Handles recoverable and non-recoverable depreciation</li>
          <li>Generates HTML table for Outlook formatting</li>
        </ul>
        <p><strong>Note:</strong> This does not currently work with supplements as prior payments have not been added, and the template has not been configured for this.</p>
        <p><strong>What to copy from Xactimate:</strong></p>
        <div style={{ background: 'var(--background-color)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace', lineHeight: '1.4', border: '1px solid var(--border-color)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Summary for Cov A: Dwelling</div>
          <div>Line Item Total: 5,691.45</div>
          <div>Overhead: 566.91</div>
          <div>Profit: 566.91</div>
          <div>Replacement Cost Value: $6,893.06</div>
          <div>Less Depreciation: (1,625.19)</div>
          <div>Less Deductible: (634.02)</div>
          <div>Net Claim Remaining: $1,101.95</div>
          <div>Total Recoverable Depreciation: 1,625.19</div>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--light-text-color)' }}>Copy from the "Summary for..." section in your Xactimate estimate PDF or preview.</p>
      </InfoModal>

      {/* Clear Button at Top */}
      {hasModifications() && (
        <div className="section-card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button
            className="clear-inspection-btn"
            onClick={clearSettlementEmail}
            style={{ background: 'var(--danger-color)' }}
          >
            Clear Settlement Email
          </button>
        </div>
      )}

      {/* Section 1: Manual Fields */}
      <div className="section-card" style={{ marginBottom: '2rem' }}>
        <h2>Settlement Details</h2>
        <div style={{ paddingTop: '1rem' }}>
          <label>Insured Name (Last Name):</label>
          <input
            type="text"
            value={manualFields.insuredName}
            onChange={(e) => handleManualFieldChange('insuredName', e.target.value)}
            placeholder="e.g., Smith"
          />

          <label>Payment Type:</label>
          <select
            value={manualFields.paymentType}
            onChange={(e) => handleManualFieldChange('paymentType', e.target.value)}
          >
            <option value="Check">Check</option>
            <option value="EFT">EFT (Electronic Funds Transfer)</option>
          </select>

          {/* Check delivery method - only show when Check is selected */}
          {manualFields.paymentType === 'Check' && (
            <>
              <label>Check Delivery:</label>
              <select
                value={manualFields.checkDelivery}
                onChange={(e) => handleManualFieldChange('checkDelivery', e.target.value)}
              >
                <option value="mail">Via Mail (3-5 business days)</option>
                <option value="inPerson">In Person</option>
              </select>
            </>
          )}

          {/* Claim number - only show when EFT is selected */}
          {manualFields.paymentType === 'EFT' && (
            <>
              <label>Claim Number:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  value={manualFields.claimNumberPrefix}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    handleManualFieldChange('claimNumberPrefix', val);
                  }}
                  style={{ width: '70px', textAlign: 'center', marginBottom: 0 }}
                  maxLength={3}
                />
                <span style={{ fontSize: '1.25rem', color: 'var(--light-text-color)' }}>-</span>
                <input
                  type="text"
                  value={manualFields.claimNumberMiddle}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    handleManualFieldChange('claimNumberMiddle', val);
                  }}
                  placeholder="Enter #"
                  style={{ flex: 1, textAlign: 'center', marginBottom: 0 }}
                  maxLength={10}
                />
                <span style={{ fontSize: '1.25rem', color: 'var(--light-text-color)' }}>-</span>
                <input
                  type="text"
                  value={manualFields.claimNumberSuffix}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    handleManualFieldChange('claimNumberSuffix', val);
                  }}
                  style={{ width: '80px', textAlign: 'center', marginBottom: 0 }}
                  maxLength={4}
                />
              </div>
            </>
          )}

          <label>Non-Recoverable Depreciation Type:</label>
          <select
            value={manualFields.nrcdType}
            onChange={(e) => handleManualFieldChange('nrcdType', e.target.value)}
          >
            <option value="none">None / Not Applicable</option>
            <option value="roof">ACV Roof Endorsement (Wind/Hail)</option>
            <option value="pp">Personal Property / Other ACV Items</option>
          </select>
        </div>
      </div>

      {/* Section 2: Estimate Parser */}
      <div className="section-card" style={{ marginBottom: '2rem' }}>
        <h2>Xactimate Estimate Parser</h2>
        <div style={{ paddingTop: '1rem' }}>
          <label>Paste Xactimate Summary Text:</label>
          <textarea
            value={rawEstimateText}
            onChange={(e) => setRawEstimateText(e.target.value)}
            placeholder="Paste the summary portion of your Xactimate estimate here..."
            style={{ minHeight: '200px' }}
          />
          <button onClick={handleParseEstimate}>Parse Estimate</button>
        </div>
      </div>

      {/* Section 3: Parsed Coverages */}
      {coverages.length > 0 && (
        <div className="section-card" style={{ marginBottom: '2rem' }}>
          <h2>Parsed Coverages</h2>
          <div style={{ paddingTop: '1rem' }}>
            {coverages.map((coverage, index) => (
              <div key={coverage.id} style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: 'var(--background-color)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>{coverage.name}</h4>
                  <button
                    className="remove-btn"
                    onClick={() => removeCoverage(coverage.id)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Remove
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem' }}>RCV:</label>
                    <input
                      type="text"
                      value={formatDollar(coverage.rcv)}
                      onChange={(e) => handleCoverageChange(coverage.id, 'rcv', e.target.value)}
                      style={{ marginBottom: '0.5rem' }}
                    />
                  </div>

                  {coverage.type !== 'ordinance' && (
                    <>
                      <div>
                        <label style={{ fontSize: '0.8rem' }}>Recoverable Depreciation:</label>
                        <input
                          type="text"
                          value={formatDollar(coverage.recoverableDepreciation)}
                          onChange={(e) => handleCoverageChange(coverage.id, 'recoverableDepreciation', e.target.value)}
                          style={{ marginBottom: '0.5rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem' }}>Non-Recoverable Depreciation:</label>
                        <input
                          type="text"
                          value={formatDollar(coverage.nonRecoverableDepreciation)}
                          onChange={(e) => handleCoverageChange(coverage.id, 'nonRecoverableDepreciation', e.target.value)}
                          style={{ marginBottom: '0.5rem' }}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label style={{ fontSize: '0.8rem' }}>Deductible:</label>
                    <input
                      type="text"
                      value={formatDollar(coverage.deductible)}
                      onChange={(e) => handleCoverageChange(coverage.id, 'deductible', e.target.value)}
                      style={{ marginBottom: '0.5rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem' }}>Net Claim:</label>
                    <input
                      type="text"
                      value={formatDollar(coverage.netClaim)}
                      onChange={(e) => handleCoverageChange(coverage.id, 'netClaim', e.target.value)}
                      style={{ marginBottom: '0.5rem' }}
                    />
                  </div>

                  {coverage.type === 'ordinance' && (
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Paid When Incurred:</label>
                      <input
                        type="text"
                        value={formatDollar(coverage.paidWhenIncurred)}
                        onChange={(e) => handleCoverageChange(coverage.id, 'paidWhenIncurred', e.target.value)}
                        style={{ marginBottom: '0.5rem' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Totals Summary */}
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05))',
              borderRadius: '12px',
              border: '1px solid var(--primary-color)'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0' }}>Totals</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div><strong>Total Net Claim:</strong> {formatDollar(getTotals().totalNetClaim)}</div>
                <div><strong>Total RD:</strong> {formatDollar(getTotals().totalRecoverableDepreciation)}</div>
                <div><strong>Total NRCD:</strong> {formatDollar(getTotals().totalNonRecoverableDepreciation)}</div>
                {getTotals().hasOrdinanceOrLaw && (
                  <div><strong>Total PWI:</strong> {formatDollar(getTotals().totalPaidWhenIncurred)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Email Preview with Copy Buttons */}
      {generatedHtml && (
        <div className="section-card" style={{ marginBottom: '2rem' }}>
          <h2>Email Preview</h2>
          <div style={{ paddingTop: '1rem' }}>
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '1rem'
              }}
              dangerouslySetInnerHTML={{ __html: generatedHtml }}
            />
            <div className="note-actions">
              <button
                className="copy-btn"
                onClick={copyToClipboard}
                style={copySuccess ? { background: '#16a34a' } : {}}
              >
                {copySuccess ? 'Copied!' : 'Copy Plain Text'}
              </button>
              <button
                className="copy-btn"
                onClick={copyHtmlToClipboard}
                style={copyHtmlSuccess ? { background: '#16a34a' } : { background: '#7c3aed' }}
              >
                {copyHtmlSuccess ? 'Copied!' : 'Copy HTML for Outlook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Button at Bottom */}
      {hasModifications() && (
        <div className="section-card" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            className="clear-inspection-btn"
            onClick={clearSettlementEmail}
            style={{ background: 'var(--danger-color)' }}
          >
            Clear Settlement Email
          </button>
        </div>
      )}
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
