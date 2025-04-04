import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { firestore, auth } from '@/utils/firebase'; // import Firebase
import { doc, getDoc } from 'firebase/firestore';

export default function Index() {
  const [userData, setUserData] = useState<any>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      {/* User Info Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: Colors[colorScheme ?? 'light'].background },
        ]}
      >
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: 'https://www.w3schools.com/howto/img_avatar.png' }}
            style={styles.profileImage}
          />
          <View style={styles.profileDetails}>
            <Text
              style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}
            >
              {userData.name}
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}
            >
              Level: {userData.level}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={[styles.cardDetail, { color: Colors[colorScheme ?? 'light'].text }]}>
            Points Earned: {userData.points}
          </Text>
          <Text style={[styles.cardDetail, { color: Colors[colorScheme ?? 'light'].text }]}>
            Locations Scanned: {userData.locationsScanned}
          </Text>
        </View>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Changed to position the card near the top
    alignItems: 'center',
    paddingTop: 40, // Added padding from the top to give space
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    elevation: 5, // Adds shadow for Android
    shadowColor: 'black', // iOS shadow color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileDetails: {
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 18,
    color: '#888',
  },
  statsContainer: {
    marginBottom: 20,
  },
  cardDetail: {
    fontSize: 16,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


