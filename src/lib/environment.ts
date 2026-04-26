export const isElectron = () => {
  return typeof window !== 'undefined' && (
    !!(window as any).electron || 
    !!(window as any).electronAPI ||
    navigator.userAgent.toLowerCase().indexOf(' electron/') > -1
  );
};

export const isWebsite = () => {
  return !isElectron();
};
