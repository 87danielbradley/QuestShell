import { APNS_ENVIRONMENT, WEB_APP_URL } from './src/config/env';
import {
  Linking,
  NativeModules,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import React, { useRef } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { useApnsToken } from './src/hooks/useApnsToken';

type QuestLocationResult = {
  lat: number;
  lng: number;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number | null;
};

type QuestLocationModule = {
  getCurrentLocation: () => Promise<QuestLocationResult>;
};

const QuestLocation = NativeModules.QuestLocation as
  | QuestLocationModule
  | undefined;

function App() {
  const webViewRef = useRef<WebView>(null);
  const apnsToken = useApnsToken();

  const postToWebApp = (payload: unknown) => {
    webViewRef.current?.postMessage(JSON.stringify(payload));
  };

  const sendTokenToWebApp = () => {
    if (Platform.OS !== 'ios') return;
    if (!apnsToken) return;

    postToWebApp({
      type: 'apns-token',
      token: apnsToken,
      platform: 'ios',
      environment: APNS_ENVIRONMENT,
    });
  };

  const sendLocationToWebApp = async () => {
    if (!QuestLocation) {
      postToWebApp({
        type: 'location-error',
        code: 'native-module-missing',
        message: 'Native location module is not available.',
      });
      return;
    }

    try {
      const location = await QuestLocation.getCurrentLocation();

      postToWebApp({
        type: 'location',
        ...location,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to get location.';

      postToWebApp({
        type: 'location-error',
        code: 'location-failed',
        message,
      });
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'open-external-url' && data.url) {
        Linking.openURL(data.url);
        return;
      }

      if (data.type === 'request-apns-token') {
        sendTokenToWebApp();
        return;
      }

      if (data.type === 'request-location') {
        sendLocationToWebApp();
      }
    } catch (err) {
      console.warn('Invalid message from WebView', err);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.container}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <View style={styles.container}>
          <WebView
            ref={webViewRef}
            source={{ uri: WEB_APP_URL }}
            onMessage={handleMessage}
            onLoadEnd={sendTokenToWebApp}
            style={styles.container}
            containerStyle={styles.container}
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustsScrollIndicatorInsets={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={false}
            javaScriptEnabled
            domStorageEnabled
            androidLayerType="hardware"
            mixedContentMode="always"
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
