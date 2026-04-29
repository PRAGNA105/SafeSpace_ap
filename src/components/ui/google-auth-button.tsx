import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface GoogleAuthButtonProps {
  onSuccess: (token: string, user: any) => void;
  mode?: 'login' | 'register';
}

export default function GoogleAuthButton({ onSuccess, mode = 'login' }: GoogleAuthButtonProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // Send Google credential to backend
      const response = await apiCall('oauth.php', {
        method: 'POST',
        requiresAuth: false,
        body: {
          credential: credentialResponse.credential
        }
      });

      if (response.success) {
        const token = response.token || response.access_token;
        const rawUser = response.user || response.data;
        const user = rawUser
          ? {
              ...rawUser,
              profile_picture:
                rawUser.profile_picture || rawUser.oauth_profile_image || '',
            }
          : null;

        if (!token || !user) {
          throw new Error('Authentication succeeded but session data is incomplete. Please try again.');
        }

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('auth-updated'));

        toast({
          title: '✅ Success!',
          description: response.message,
        });

        if (response.needs_profile_setup) {
          toast({
            title: '👋 Welcome to SafeSpace!',
            description: 'You can finish your profile anytime from the Profile page.',
          });
        }

        // Parent must run redirect (home, return URL after booking flow, etc.). Do not navigate only to /profile here or login never leaves the auth screen for new users.
        try {
          onSuccess(token, user);
        } catch {
          navigate('/', { replace: true });
        }
      } else {
        throw new Error(response.message || 'Google authentication failed');
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: "❌ Authentication Failed",
        description: error.message || 'Failed to authenticate with Google',
        variant: "destructive",
      });
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "❌ Google Login Failed",
      description: "Could not authenticate with Google. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        size="large"
        text={mode === 'login' ? 'signin_with' : 'signup_with'}
        shape="rectangular"
        theme="outline"
        width="100%"
      />
    </div>
  );
}
