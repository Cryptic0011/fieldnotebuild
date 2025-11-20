// LocalStorage utilities for FieldNote app

const STORAGE_KEY = 'fieldnote_inspection_data';

export const saveInspectionData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save inspection data:', error);
    return false;
  }
};

export const loadInspectionData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load inspection data:', error);
    return null;
  }
};

export const clearInspectionData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear inspection data:', error);
    return false;
  }
};
