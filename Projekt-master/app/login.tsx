import React, { useState } from 'react';
import { Text, View, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/FirebaseAuthProvider'; // Import the auth context

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const { signIn, loading: authLoading } = useAuth(); // Get the signIn method from the context
  
  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
      // After sign-in, navigate to the main app screen
      router.replace('/(tabs)'); // Ensure you're navigating to the authenticated screen
    } catch (error: unknown) { // Type the error as 'unknown'
      if (error instanceof Error) {  // Check if error is an instance of Error
        Alert.alert('Error', error.message); // Handle any sign-in errors
      } else {
        Alert.alert('Error', 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      {loading || authLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Sign In" onPress={handleSignIn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});

// import React, { useState } from 'react';
// import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';

// import { router } from 'expo-router';

// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '@/utils/firebase'; // Assuming this is the correct path to your firebase setup
// import { useAuth } from '@/providers/FirebaseAuthProvider'; // Adjust the import path accordingly

// function Login() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleLogin = () => {
//     setLoading(true);
//     signInWithEmailAndPassword(auth, email, password)
//       .then((userCredential) => {
//         setLoading(false);
//         Alert.alert('Success', 'User signed in successfully');
//         console.log('User signed in:', userCredential.user);
//       })
//       .catch((error) => {
//         setLoading(false);
//         Alert.alert('Error', error.message);
//         console.error('Error signing in:', error);
//       });
//   };

//   const handleSignUp = () => {
//     setLoading(true);
//     createUserWithEmailAndPassword(auth, email, password)
//       .then((userCredential) => {
//         setLoading(false);
//         Alert.alert('Success', 'User created successfully');
//         console.log('User created:', userCredential.user);
//       })
//       .catch((error) => {
//         setLoading(false);
//         Alert.alert('Error', error.message);
//         console.error('Error creating user:', error);
//       });
//   };

//   return (
//     <View style={styles.container}>
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         value={email}
//         onChangeText={setEmail}
//         autoCapitalize="none"
//         keyboardType="email-address"
//         accessibilityLabel="Email input"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         value={password}
//         secureTextEntry
//         onChangeText={setPassword}
//         accessibilityLabel="Password input"
//       />
//       {loading ? (
//         <ActivityIndicator size="large" color="#0000ff" />
//       ) : (
//         <>
//           <Button title="Login" onPress={handleLogin} />
//           <Button title="Sign Up" onPress={handleSignUp} />
//         </>
//       )}
//     </View>
//   );
// }

// export default Login;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     padding: 20,
//   },
//   input: {
//     height: 40,
//     borderColor: 'gray',
//     borderWidth: 1,
//     marginBottom: 12,
//     paddingHorizontal: 8,
//   },
//   button: {
//     padding: 10,
//   }
// });

