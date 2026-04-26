export const isElectron = () => {
  return typeof window !== 'undefined' && !!(window as any).electron;
};

export const isWebsite = () => {
  return !isElectron();
};
