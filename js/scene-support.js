export const sceneMinWidth = page => (page === 'beyond' ? 900 : 760);

export const lowPowerDevice = () => {
  const cores = navigator.hardwareConcurrency;
  const memory = navigator.deviceMemory;
  return (typeof cores === 'number' && cores <= 2) || (typeof memory === 'number' && memory <= 1);
};
