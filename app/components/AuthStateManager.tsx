'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';

export default function AuthStateManager() {
  useEffect(() => {
    let authChannel;
    
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        authChannel = new BroadcastChannel('auth_channel');
        
        // Listen for login in other tabs
        authChannel.onmessage = (event) => {
          if (event.data.type === 'OTHER_TAB_LOGIN') {
            // Get current tab's ID
            const currentTabId = Cookies.get('current_tab_id');
            
            // Only proceed if this is a different tab
            if (currentTabId !== event.data.sourceTabId) {
              // Just redirect to login, cookies are already handled by the login tab
              window.location.href = '/?session_ended=true';
            }
          }
        };
      }
    } catch (error) {
      console.warn('AuthStateManager: BroadcastChannel not supported');
    }

    // Cleanup
    return () => {
      if (authChannel) {
        authChannel.close();
      }
    };
  }, []);

  return null;
} 