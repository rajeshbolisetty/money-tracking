import {
  SignInPage,
  type AuthProvider,
  type AuthResponse,
} from '@toolpad/core/SignInPage';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AppProvider } from '@toolpad/core';
import { darkTheme } from '../../themes/dark-theme';

const LoginPage = () => {
  const navigate = useNavigate();

  const providers = [
    { id: 'google', name: 'Google' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'twitter', name: 'Twitter' },
  ];

  const handleSignIn: (
    provider: AuthProvider,
  ) => void | Promise<AuthResponse> = async (provider) => {
    switch (provider.id) {
      case 'google': {
        try {
          await signInWithPopup(auth, new GoogleAuthProvider());
          navigate('/home');
          return { status: 'success' };
        } catch (err) {
          console.error('Google Sign-In failed', err);
          return { status: 'error', error: 'Google Sign-In failed' };
        }
      }
      case 'facebook': {
        try {
          await signInWithPopup(auth, new FacebookAuthProvider());
          navigate('/home');
          return { status: 'success' };
        } catch (err) {
          console.error('facebook Sign-In failed', err);
          return { status: 'error', error: 'facebook Sign-In failed' };
        }
      }
      default:
        return { status: 'error', error: 'Unsupported provider' };
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <AppProvider theme={darkTheme}>
        <SignInPage signIn={handleSignIn} providers={providers} />
      </AppProvider>
    </Box>
  );
};

export default LoginPage;
