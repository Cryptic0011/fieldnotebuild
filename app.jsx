const { useState, useEffect, useRef } = React;

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/public/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(err => console.log('SW registration failed:', err));
  });
}

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

// SECURITY: API key should be managed via environment variables or backend proxy
// For production, move this to a secure backend endpoint
const GEMINI_API_KEY = 'AIzaSyDDYvU9wZEb_CNWsvThU2ZvDhlsfVdEtbw'; // TODO: Move to backend

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

  const copyToClipboard = () => navigator.clipboard.writeText(generatedNote);

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
            <label>Pipe jacks:</label><input type="text" value={fields.roofPipeJacks} onChange={e => handleFieldChange('roofPipeJacks', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>HVAC:</label><input type="text" value={fields.roofHVAC} onChange={e => handleFieldChange('roofHVAC', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>Turtle Vent:</label><input type="text" value={fields.roofTurtleVent} onChange={e => handleFieldChange('roofTurtleVent', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>Power:</label><input type="text" value={fields.roofPower} onChange={e => handleFieldChange('roofPower', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>Skylight:</label><input type="text" value={fields.roofSkylight} onChange={e => handleFieldChange('roofSkylight', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
            <label>Satellite:</label><input type="text" value={fields.roofSatellite} onChange={e => handleFieldChange('roofSatellite', e.target.value)} placeholder="Optional - leave empty to exclude from note" />
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
        <button className="copy-btn" onClick={copyToClipboard}>Copy Note</button>
        <button className="copy-btn" onClick={sendEmail}>Send Email</button>
        <button className="rewrite-btn" onClick={rewriteNoteWithAI} disabled={isRewriting}>
          {isRewriting ? 'Rewriting…' : 'Rewrite with AI'}
        </button>
      </div>
      {rewriteError && <div className="error-text">{rewriteError}</div>}
    </Section>,
  };

  return (
    <div>
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
      
      // Simple approach: look for embedded image signatures
      // JPG signature: FF D8 FF
      // PNG signature: 89 50 4E 47
      
      const images = [];
      
      // Search for JPG images
      for (let i = 0; i < uint8Array.length - 3; i++) {
        if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xD8 && uint8Array[i + 2] === 0xFF) {
          // Found JPG start
          let end = i + 3;
          // Look for JPG end marker (FF D9)
          while (end < uint8Array.length - 1) {
            if (uint8Array[end] === 0xFF && uint8Array[end + 1] === 0xD9) {
              end += 2;
              break;
            }
            end++;
          }
          if (end < uint8Array.length) {
            const imageData = uint8Array.slice(i, end);
            const blob = new Blob([imageData], { type: 'image/jpeg' });
            images.push({ blob, type: 'jpeg', size: blob.size, start: i });
          }
        }
      }
      
      // Search for PNG images
      for (let i = 0; i < uint8Array.length - 8; i++) {
        if (uint8Array[i] === 0x89 && uint8Array[i + 1] === 0x50 && 
            uint8Array[i + 2] === 0x4E && uint8Array[i + 3] === 0x47) {
          // Found PNG start
          let end = i + 8;
          // Look for PNG end marker (IEND chunk)
          while (end < uint8Array.length - 12) {
            if (uint8Array[end] === 0x49 && uint8Array[end + 1] === 0x45 && 
                uint8Array[end + 2] === 0x4E && uint8Array[end + 3] === 0x44) {
              end += 12; // Include IEND chunk and CRC
              break;
            }
            end++;
          }
          if (end < uint8Array.length) {
            const imageData = uint8Array.slice(i, end);
            const blob = new Blob([imageData], { type: 'image/png' });
            images.push({ blob, type: 'png', size: blob.size, start: i });
          }
        }
      }
      
      if (images.length === 0) {
        alert('No images found in the .msg file');
        return;
      }
      
      // Filter and deduplicate images
      // 1. Filter out very small images (likely thumbnails or icons) - keep only images > 50KB
      // Increased threshold to better filter out low-quality embedded images
      const filteredImages = images.filter(img => img.size > 50000);
      
      if (filteredImages.length === 0) {
        alert('No valid images found in the .msg file (all images were too small)');
        return;
      }
      
      // 2. Advanced deduplication - group similar images and keep only the highest quality
      // Sort by size (largest first) to prioritize higher quality images
      filteredImages.sort((a, b) => b.size - a.size);
      
      // 3. Validate images and extract dimensions for better deduplication
      const validatedImages = [];
      for (const img of filteredImages) {
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(img.blob);
          });
          
          // Try to load the image to ensure it's valid and get dimensions
          const imageInfo = await new Promise((resolve) => {
            const testImg = new Image();
            testImg.onload = () => {
              // Check if image has valid dimensions (not 0x0) and is not grayscale
              if (testImg.width > 0 && testImg.height > 0) {
                // Check if image is likely grayscale by sampling pixels
                const canvas = document.createElement('canvas');
                canvas.width = Math.min(testImg.width, 100);
                canvas.height = Math.min(testImg.height, 100);
                const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
                ctx.drawImage(testImg, 0, 0, canvas.width, canvas.height);
                
                try {
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imageData.data;
                  let colorDiff = 0;
                  const sampleSize = Math.min(1000, data.length / 4);
                  
                  // Sample pixels to check if image is grayscale
                  for (let i = 0; i < sampleSize * 4; i += 40) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    colorDiff += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
                  }
                  
                  const avgColorDiff = colorDiff / sampleSize;
                  const isGrayscale = avgColorDiff < 5; // Threshold for grayscale detection - lower value means stricter
                  
                  resolve({
                    valid: true,
                    width: testImg.width,
                    height: testImg.height,
                    isGrayscale,
                    aspectRatio: testImg.width / testImg.height
                  });
                } catch (e) {
                  // If we can't check pixels (CORS, etc), assume it's valid
                  resolve({
                    valid: true,
                    width: testImg.width,
                    height: testImg.height,
                    isGrayscale: false,
                    aspectRatio: testImg.width / testImg.height
                  });
                }
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
      
      // 4. Remove duplicates based on dimensions and quality
      // Group images by similar aspect ratio and dimensions
      const uniqueImages = [];
      const aspectRatioTolerance = 0.05; // 5% tolerance for aspect ratio matching
      
      for (const img of validatedImages) {
        // Check if we already have a similar image
        const isDuplicate = uniqueImages.some(existing => {
          // Check if aspect ratios are similar
          const aspectRatioDiff = Math.abs(existing.aspectRatio - img.aspectRatio);
          const isSimilarAspectRatio = aspectRatioDiff < aspectRatioTolerance;
          
          // Check if dimensions are similar (within 20% or exact match)
          const widthRatio = Math.min(existing.width, img.width) / Math.max(existing.width, img.width);
          const heightRatio = Math.min(existing.height, img.height) / Math.max(existing.height, img.height);
          const isSimilarSize = widthRatio > 0.8 && heightRatio > 0.8;
          
          return isSimilarAspectRatio && isSimilarSize;
        });
        
        // Skip grayscale images if we already have a color version
        const hasColorVersion = uniqueImages.some(existing => 
          !existing.isGrayscale && 
          Math.abs(existing.aspectRatio - img.aspectRatio) < aspectRatioTolerance
        );
        
        if (!isDuplicate && !(img.isGrayscale && hasColorVersion)) {
          // Prefer non-grayscale images
          if (img.isGrayscale) {
            // Only add grayscale if no color version exists
            const colorIndex = uniqueImages.findIndex(existing => 
              !existing.isGrayscale && 
              Math.abs(existing.aspectRatio - img.aspectRatio) < aspectRatioTolerance
            );
            if (colorIndex === -1) {
              uniqueImages.push(img);
            }
          } else {
            // Remove any grayscale version if this is a color version
            const grayscaleIndex = uniqueImages.findIndex(existing => 
              existing.isGrayscale && 
              Math.abs(existing.aspectRatio - img.aspectRatio) < aspectRatioTolerance
            );
            if (grayscaleIndex !== -1) {
              uniqueImages.splice(grayscaleIndex, 1);
            }
            uniqueImages.push(img);
          }
        }
      }
      
      // Add validated and deduplicated images to photos with orientation correction
      for (let index = 0; index < uniqueImages.length; index++) {
        const img = uniqueImages[index];
        let correctedDataUrl = img.dataUrl;
        
        // Check for EXIF orientation and correct if needed
        try {
          const arrayBuffer = await img.blob.arrayBuffer();
          const orientation = getOrientationFromExif(arrayBuffer);
          if (orientation !== 1) {
            correctedDataUrl = await correctImageOrientation(img.dataUrl, orientation);
          }
        } catch (error) {
          console.log('Could not read EXIF orientation for extracted image, using as-is:', error);
        }
        
        const file = new File([img.blob], `extracted_${index}.${img.type}`, { type: `image/${img.type}` });
        const newPhoto = {
          id: Date.now() + Math.random() + index,
          src: correctedDataUrl,
          caption: '',
          rotation: 0,
          file
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
      
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
    
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `photo-report-${timestamp}.pdf`;
      
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
          <button onClick={generatePdf} disabled={isGeneratingPdf}>
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
