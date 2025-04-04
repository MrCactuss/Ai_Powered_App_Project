import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { CameraView, Camera } from 'expo-camera';

function Scaning() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setData(data);
    alert(`Bar code with data ${data} has been scanned!`);
  };

  const resetScan = () => {
    setScanned(false);
    setData('');
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13'],
        }}
      >
        {scanned && (
          <View style={styles.scanResult}>
            <Text style={styles.resultText}>Scanned Data: {data}</Text>
            <Button title={'Tap to Scan Again'} onPress={resetScan} />
          </View>
        )}
      </CameraView>
    </View>
  );
}

export default Scaning;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanResult: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
  },
  resultText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
});




