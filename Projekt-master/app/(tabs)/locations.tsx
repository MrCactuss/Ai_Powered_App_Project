import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, View, Image, TouchableOpacity, Button } from 'react-native';
import { firestore } from '@/utils/firebase'; // Adjust the import path as needed
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore methods

const Locations = () => {
  const [locations, setLocations] = useState<any[]>([]); // State to hold the locations
  const [loading, setLoading] = useState(true); // State to track loading state

  useEffect(() => {
    // Fetch locations from Firestore on component mount
    fetchLocations();
  }, []);

  // Fetch locations from Firestore
  const fetchLocations = async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const querySnapshot = await getDocs(collection(firestore, 'locations'));
      const locationsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLocations(locationsList);
    } catch (error) {
      console.error("Error fetching locations: ", error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  // Handle showing/hiding the QR code
  const toggleQRCodeVisibility = (id: string) => {
    setLocations((prevLocations) =>
      prevLocations.map((location) =>
        location.id === id ? { ...location, showQRCode: !location.showQRCode } : location
      )
    );
  };

  // Render each item in the FlatList
  const renderLocation = ({ item }: { item: any }) => (
    <View style={styles.locationItem}>
      <View style={styles.locationDetails}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
        <Text style={styles.locationPoints}>Points: {item.points}</Text>
      </View>

      {/* Toggle Button to Show/Hide QR Code */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => toggleQRCodeVisibility(item.id)}
      >
        <Text style={styles.toggleButtonText}>
          {item.showQRCode ? 'Hide QR Code' : 'Show QR Code'}
        </Text>
      </TouchableOpacity>

      {/* Show QR Code if visible */}
      {item.showQRCode && item.qrCodeBase64 && (
        <View style={styles.qrCodeContainer}>
          <Image source={{ uri: item.qrCodeBase64 }} style={styles.qrCode} />
        </View>
      )}
    </View>
  );

  if (loading) {
    return <Text style={styles.loadingText}>Loading locations...</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Update Locations Button */}
      <TouchableOpacity style={styles.updateButton} onPress={fetchLocations}>
        <Text style={styles.updateButtonText}>Update Locations</Text>
      </TouchableOpacity>

      <FlatList
        data={locations}
        renderItem={renderLocation}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f2f2f2', // Light background color
  },
  locationItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5, // Shadow effect on Android
    marginBottom: 20,
    padding: 20,
    overflow: 'hidden', // Ensures rounded corners work well with the shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  locationDetails: {
    marginBottom: 10,
  },
  locationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  locationAddress: {
    fontSize: 16,
    color: '#777',
  },
  locationPoints: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  qrCodeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  qrCode: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    borderRadius: 10, // Rounded corners for QR code
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#333',
  },
  updateButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Locations;





