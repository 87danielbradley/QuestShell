import { APNS_ENVIRONMENT, WEB_APP_URL } from './src/config/env';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import React, { useRef } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { useApnsToken } from './src/hooks/useApnsToken';

function App() {
  const webViewRef = useRef<WebView>(null);
  const apnsToken = useApnsToken();

  const sendTokenToWebApp = () => {
    if (Platform.OS !== 'ios') return;
    if (!apnsToken) return;

    webViewRef.current?.postMessage(
      JSON.stringify({
        type: 'apns-token',
        token: apnsToken,
        platform: 'ios',
        environment: APNS_ENVIRONMENT,
      })
    );
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'open-external-url' && data.url) {
        Linking.openURL(data.url);
      }

      if (data.type === 'request-apns-token') {
        sendTokenToWebApp();
      }
    } catch (err) {
      console.warn('Invalid message from WebView', err);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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
