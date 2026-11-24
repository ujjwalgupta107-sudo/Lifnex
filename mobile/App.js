import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

// Local development endpoint and cloud production fallback
const DEV_URL = 'http://10.0.2.2:5173'; // Android Emulator loopback to host Vite dev server
const PROD_URL = 'https://lifnex.org';

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0D14" />
      <View style={styles.header}>
        <Text style={styles.brand}>LIF<Text style={styles.brandAccent}>NEX</Text></Text>
        <Text style={styles.statusIndicator}>● Triage Mesh Connected</Text>
      </View>
      <WebView
        source={{ uri: DEV_URL }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#FF2E54" />
            <Text style={styles.loaderText}>Connecting to Lifnex Emergency Network...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D14',
  },
  header: {
    height: 48,
    backgroundColor: '#121622',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 46, 84, 0.2)',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandAccent: {
    color: '#FF2E54',
  },
  statusIndicator: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0A0D14',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0D14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
});
