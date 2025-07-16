import Cookies from 'js-cookie';

// Client-side cookie access
export const getUserFromCookie = () => {
  const userId = Cookies.get('user_id');
  const userEmail = Cookies.get('user_email');
  const organization_id = Cookies.get('organization_id');
  const organizationId = Cookies.get('organizationId');
  const authToken = Cookies.get('auth_token');

  console.log('Client cookie values:', {
    userId,
    userEmail,
    organization_id,
    organizationId,
    allCookies: Cookies.get()
  });

  if (!userId) {
    console.error('No user ID found in cookies');
    throw new Error('Authentication required');
  }

  return {
    userId,
    userEmail,
    organization_id,
    organizationId,
    authToken
  };
};

// Server-side cookie access
export const getUserFromRequestCookie = (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || '';
  
  // Parse cookies with proper handling of quoted values
  const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie) => {
    const [key, ...valueParts] = cookie.trim().split('=');
    let value = valueParts.join('='); // Rejoin in case value contains =
    
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    acc[key.trim()] = value;
    return acc;
  }, {});

  console.log('Server cookie values:', {
    cookies,
    cookieHeader,
    parsedUserId: cookies['user_id'],
    parsedEmail: cookies['user_email'],
    parsedOrgId: cookies['organization_id']
  });

  const userId = cookies['user_id'];
  const userEmail = cookies['user_email'];
  const organization_id = cookies['organization_id'];

  if (!userId) {
    console.error('No user ID found in request cookies');
    throw new Error('Authentication required');
  }

  return {
    userId,
    userEmail,
    organization_id
  };
}; 