import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert 
} from 'react-native';

// --- Interface & Constants ---
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  createdAt: Date;
}
const SENDER_USER = 'user';
const SENDER_BOT = 'bot';
const BOT_NAME = 'Liepāja Helper Bot';
const generateId = () => Date.now().toString() + Math.random().toString();

// --- React Component ---
export default function ChatBotScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null); 
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // --- Request Location Permission on Trigger ---
  useEffect(() => {
    (async () => {
      console.log("Requesting location permission...");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationErrorMsg('Permission to access location was denied');
        setHasLocationPermission(false);
        console.log("Location permission denied.");
        return;
      }
      setHasLocationPermission(true);
      console.log("Location permission granted.");

    })();
  }, []); 

  // Initial Message Effect
  useEffect(() => {
    setMessages([
      {
        id: generateId(),
        text: `Sveiki! Welcome to ${BOT_NAME}. How can I assist you today regarding Liepāja?`,
        sender: SENDER_BOT,
        createdAt: new Date(),
      },
    ]);
  }, []);

  // --- Logic to handle sending messages ---
  const handleSend = useCallback(async () => {
    const userMessageText = inputText.trim();
    if (!userMessageText || isLoading) return; // Prevent sending empty or while loading

    const userMessage: Message = {
      id: generateId(),
      text: userMessageText,
      sender: SENDER_USER,
      createdAt: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);

    let currentLat: number | null = null;
    let currentLon: number | null = null;

    // Checking if user wants nearby results AND have permission 
    const wantsNearby = userMessageText.toLowerCase().includes('near me') ||
                       userMessageText.toLowerCase().includes('nearby');

    if (wantsNearby && hasLocationPermission === true) {
      console.log("User wants nearby, attempting to get current location...");
      try {
        // Get fresh location just before sending
        let location = await Location.getCurrentPositionAsync({
             accuracy: Location.Accuracy.Balanced, // Balance accuracy and power
        });
        currentLat = location.coords.latitude;
        currentLon = location.coords.longitude;
        setLocationCoords({ latitude: currentLat, longitude: currentLon }); // Update state too
        setLocationErrorMsg(null); // Clear previous location errors
        console.log("Current location obtained:", currentLat, currentLon);
      } catch (error) {
        console.error("Error getting current location for send:", error);
        setLocationErrorMsg("Could not get current location for this search.");
        // Decide: Do you still send to backend without coords, or show error?
        // For now, let's proceed without coords, backend will use default area.
      }
    } else if (wantsNearby && hasLocationPermission !== true) {
       console.log("User wants nearby, but permission not granted or pending.");
       setLocationErrorMsg("Location permission needed for 'near me' search.");
       // Add a message to the chat indicating permission needed?
    }

    try {
      // Use http://10.0.2.2:8000 for Android Emulator (if backend is on same machine)
      // Use http://localhost:8000 for iOS Simulator (if backend is on same machine)
      // Use http://YOUR_COMPUTER_LOCAL_IP:8000 for physical device on same WiFi 192.168.0.102
      const backendUrl = 'http://10.0.2.2:8000/send-message/'; 
      // ---------------------------------------------------------

      const requestBody: { message: string; thread_id: string | null; latitude?: number; longitude?: number } = {
        message: userMessageText,
        thread_id: threadId
      };
      // Add coordinates only if we successfully got them for this request
      if (wantsNearby && currentLat !== null && currentLon !== null) {
        requestBody.latitude = currentLat;
        requestBody.longitude = currentLon;
        console.log("Sending coordinates to backend:", requestBody);
      }

      console.log(`Sending to backend: ${userMessageText}, threadId: ${threadId}`);

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ---> CORRECTED: Send the prepared requestBody <---
        body: JSON.stringify(requestBody),
        // -------------------------------------------------
      });

      setIsLoading(false);

      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorData.reply || errorMsg; // Try to get detail from backend
        } catch(e) { /* Ignore if not JSON */ }
        throw new Error(`API Error: ${errorMsg} (${response.status})`);
      }

      const data = await response.json();
      const replyText = data.reply || "Sorry, I received an empty response.";

      // Store/update the threadId returned from the backend
      if (data.thread_id) {
        if(!threadId) console.log("Received initial threadId:", data.thread_id);
        setThreadId(data.thread_id);
      }

      // Create and display bot message
      const botMessage: Message = {
        id: generateId(),
        text: replyText,
        sender: SENDER_BOT,
        createdAt: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

    } catch (error) {
      console.error('Backend query failed:', error);
      setIsLoading(false);
      const errorText = `Error: ${error instanceof Error ? error.message : 'Could not connect to server.'}`;
      // Display error in chat
      const errorMessage: Message = {
        id: generateId(),
        text: errorText,
        sender: SENDER_BOT,
        createdAt: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  }, [inputText, threadId, isLoading, hasLocationPermission]); // Include isLoading in dependencies

  // --- Function to render each message item ---
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUserMessage = item.sender === SENDER_USER;
    return (
      <View style={[ styles.messageBubble, isUserMessage ? styles.userMessage : styles.botMessage ]}>
        <Text style={isUserMessage ? styles.userMessageText : styles.botMessageText}>
          {item.text}
        </Text>
      </View>
    );
  };

  // --- Component UI ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Adjust as necessary
      >
        <FlatList
          ref={flatListRef}
          style={styles.messageList}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={isLoading ? <ActivityIndicator style={{ margin: 10 }} size="small" color="#005dab"/> : null}
        />
        <View style={styles.inputContainer}>
           <TextInput
             style={styles.textInput}
             value={inputText}
             onChangeText={setInputText}
             placeholder="Type your message..."
             placeholderTextColor="#999"
             multiline
             editable={!isLoading} // Disable input while loading
           />
           <TouchableOpacity
             style={[styles.sendButton, (isLoading || inputText.trim().length === 0) && styles.sendButtonDisabled]} // Style disabled button
             onPress={handleSend}
             disabled={isLoading || inputText.trim().length === 0}
            >
             <Text style={styles.sendButtonText}>Send</Text>
           </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingTop: Platform.OS === 'android' ? 40 : 0, // Adjust for Android status bar
    paddingBottom: Platform.OS === 'android' ? 10 : 0, // Adjust for iOS bottom bar
  },
  container: {
    flex: 1,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageBubble: {
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#007bff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  botMessage: {
    backgroundColor: '#e5e5ea',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  userMessageText: {
    color: '#ffffff',
    fontSize: 16,
  },
  botMessageText: {
    color: '#000000',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    backgroundColor: '#ffffff',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { // Style for disabled button
    backgroundColor: '#a0cfff', // Lighter blue
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});