interface CookieAttributes {
  path?: string;
  expires?: number | Date;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export const getCookieConfig = (): CookieAttributes => {
  const isProduction = process.env.NEXT_PUBLIC_ENV === 'production';
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Base config with stricter settings
  const config: CookieAttributes = {
    path: '/',
    sameSite: 'Lax',
    secure: isProduction || (typeof window !== 'undefined' && window.location.protocol === 'https:'),
    expires: 1 // 1 day expiry by default
  };

  // Only set domain in production and if it's not localhost or an IP address
  if (isProduction && 
      !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(currentDomain) && 
      currentDomain !== 'localhost') {
    config.domain = currentDomain;
  }

  console.log('Cookie config:', {
    isProduction,
    currentDomain,
    finalConfig: config
  });

  return config;
}; 