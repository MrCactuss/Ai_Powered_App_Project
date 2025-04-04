import React, { createContext, useState, useContext, ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, UserCredential } from 'firebase/auth';
import { auth } from '@/utils/firebase'; // Assuming the auth instance is correctly initialized

type AuthContextProps = {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

type FirebaseAuthProviderProps = {
  children: ReactNode; // Explicitly define children prop type
};

export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return userCredential;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};


// import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { auth } from '@/utils/firebase';
// import { onAuthStateChanged, User } from 'firebase/auth';

// // Define the shape of the Auth context
// interface AuthContextProps {
//   user: User | null;
//   loading: boolean;
// }

// // Create the Auth context
// const AuthContext = createContext<AuthContextProps>({
//   user: null,
//   loading: true,
// });

// // Define the type for the provider's props
// interface FirebaseAuthProviderProps {
//   children: ReactNode;
// }

// // Provider component
// export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user);
//       setLoading(false);
//     });

//     return unsubscribe; // Cleanup on unmount
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook to use the Auth context
// export const useAuth = () => {
//   return useContext(AuthContext);
// };

