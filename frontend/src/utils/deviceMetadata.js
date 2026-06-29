export const getDeviceMetadata = () => {
  const userAgent = navigator.userAgent || '';
  let browser = 'Unknown Browser';
  let operatingSystem = 'Unknown OS';
  let deviceType = 'Desktop';

  // 1. Resolve Browser
  if (userAgent.indexOf('Edg/') !== -1) {
    browser = 'Edge';
  } else if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Safari') !== -1) {
    browser = 'Chrome';
  } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'Safari';
  } else if (userAgent.indexOf('Firefox') !== -1) {
    browser = 'Firefox';
  } else if (userAgent.indexOf('OPR/') !== -1 || userAgent.indexOf('Opera') !== -1) {
    browser = 'Opera';
  }

  // 2. Resolve Operating System
  if (userAgent.indexOf('Android') !== -1) {
    operatingSystem = 'Android';
    deviceType = 'Mobile';
  } else if (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1 || userAgent.indexOf('iPod') !== -1) {
    operatingSystem = 'iOS';
    deviceType = userAgent.indexOf('iPad') !== -1 ? 'Tablet' : 'Mobile';
  } else if (userAgent.indexOf('Windows NT') !== -1) {
    operatingSystem = 'Windows';
  } else if (userAgent.indexOf('Macintosh') !== -1) {
    operatingSystem = 'macOS';
  } else if (userAgent.indexOf('Linux') !== -1) {
    operatingSystem = 'Linux';
  }

  // 3. Resolve Screen Resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  return {
    browser,
    operatingSystem,
    deviceType,
    screenResolution
  };
};
