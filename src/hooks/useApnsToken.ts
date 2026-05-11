import { useEffect, useState } from 'react';

import PushNotificationIOS from '@react-native-community/push-notification-ios';

export function useApnsToken() {
  const [apnsToken, setApnsToken] = useState<string | null>(null);

  useEffect(() => {
    const handleRegister = (token: string) => {
      console.log('APNs token:', token);
      setApnsToken(token);
    };

    const handleRegistrationError = (error: unknown) => {
      console.warn('APNs registration error:', error);
    };

    PushNotificationIOS.addEventListener('register', handleRegister);
    PushNotificationIOS.addEventListener('registrationError', handleRegistrationError);

    PushNotificationIOS.requestPermissions({
      alert: true,
      badge: true,
      sound: true,
    });

    return () => {
      PushNotificationIOS.removeEventListener('register');
      PushNotificationIOS.removeEventListener('registrationError');
    };
  }, []);

  return apnsToken;
}
