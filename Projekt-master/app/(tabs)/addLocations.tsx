import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { firestore } from '@/utils/firebase';
import { addDoc, collection } from 'firebase/firestore';
import QRCodeSVG from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot'; // Import view shot to capture the QR code

export default function AddLocation() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null); // State to store QR code
  const router = useRouter();
  const qrCodeRef = React.useRef<ViewShot>(null); // Reference to the QRCode component for capturing

  const handleAddLocation = async () => {
    if (!name || !address || !latitude || !longitude || !points) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Generate QR code data with all location data (including points)
      const data = JSON.stringify({
        name,
        address,
        latitude,
        longitude,
        points: parseInt(points, 10), // Make sure points are stored as an integer
      });

      // Capture the QR code as Base64
      const qrCodeBase64 = await captureQRCodeBase64(data);

      if (!qrCodeBase64) {
        throw new Error('Failed to generate QR code');
      }

      // Save location data to Firestore with the QR code Base64
      const newLocation = {
        name,
        address,
        latitude,
        longitude,
        points: parseInt(points, 10),
        qrCodeBase64,
        timestamp: new Date(),
      };

      await addDoc(collection(firestore, 'locations'), newLocation);

      // Reset the QR code state after successful submission
      setQrCodeBase64(null);

      Alert.alert('Success', 'Location and QR code saved!');
      router.push('/locations');
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location.');
    } finally {
      setLoading(false);
    }
  };

  const captureQRCodeBase64 = async (data: string): Promise<string | null> => {
    try {
      // Use ViewShot to capture the QR code as Base64
      if (qrCodeRef.current) {
        const base64 = qrCodeRef.current && qrCodeRef.current.capture ? await qrCodeRef.current.capture() : null;
        return base64 || null;
      }
      return null;
    } catch (error) {
      console.error('Error capturing QR code:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add New Location</Text>

      <TextInput
        style={styles.input}
        placeholder="Location Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />

      <TextInput
        style={styles.input}
        placeholder="Latitude"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Longitude"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Points"
        value={points}
        onChangeText={setPoints}
        keyboardType="numeric"
      />

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Button title="Add Location" onPress={handleAddLocation} />
      )}

      {qrCodeBase64 && (
        <>
          <Text style={styles.header}>Generated QR Code:</Text>
          {/* Display the QR code using the Image component */}
          <Image source={{ uri: qrCodeBase64 }} style={{ width: 200, height: 200 }} />
        </>
      )}

      {/* Use ViewShot to capture the QR code */}
      <ViewShot ref={qrCodeRef} options={{ format: 'jpg', quality: 0.9 }}>
        <QRCodeSVG value={JSON.stringify({ name, address, latitude, longitude, points: parseInt(points, 10) })} size={200} />
      </ViewShot>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
});



















