import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppTextInput } from '../components/AppTextInput';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: any) => void;
}

const MobileAuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'register' | 'login'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+?25)?(078|079|072|073)\d{7}$/;
    return phoneRegex.test(phone);
  };

  const requestOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid Rwanda phone number (078/079/072/073)');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('otp');
        setOtpTimer(300); // 5 minutes
        startTimer();
        Alert.alert('Success', 'OTP sent to your phone number');
      } else {
        Alert.alert('Error', data.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp })
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user exists
        const loginResponse = await fetch('/api/auth/mobile-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, password: 'temp' })
        });

        if (loginResponse.status === 401) {
          // User doesn't exist, go to registration
          setStep('register');
        } else {
          // User exists, go to login
          setStep('login');
        }
      } else {
        Alert.alert('Error', data.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!name || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/mobile-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phoneNumber,
          password,
          role: 'passenger'
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Registration successful!');
        onAuthSuccess(data.token, data.user);
      } else {
        Alert.alert('Error', data.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/mobile-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Login successful!');
        onAuthSuccess(data.token, data.user);
      } else {
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (response.ok) {
        setOtpTimer(300);
        startTimer();
        Alert.alert('Success', 'OTP resent successfully');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPhoneStep = () => (
    <Card style={{ padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <Ionicons name="phone-portrait" size={64} color="#2563eb" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 15 }}>
          Verify Phone Number
        </Text>
        <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 10 }}>
          Enter your Rwanda phone number to receive a verification code
        </Text>
      </View>

      <AppTextInput
        placeholder="Phone Number (078XXXXXXX)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        style={{ marginBottom: 20 }}
      />

      <AppButton
        title={loading ? 'Sending...' : 'Send OTP'}
        onPress={requestOTP}
        disabled={loading}
      />
    </Card>
  );

  const renderOTPStep = () => (
    <Card style={{ padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <Ionicons name="chatbox-ellipses" size={64} color="#2563eb" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 15 }}>
          Enter OTP Code
        </Text>
        <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 10 }}>
          We sent a 6-digit code to {phoneNumber}
        </Text>
      </View>

      <AppTextInput
        placeholder="Enter 6-digit OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
        style={{ marginBottom: 20, textAlign: 'center', fontSize: 18 }}
      />

      {otpTimer > 0 && (
        <Text style={{ textAlign: 'center', color: '#64748b', marginBottom: 15 }}>
          Resend OTP in {formatTimer(otpTimer)}
        </Text>
      )}

      <AppButton
        title={loading ? 'Verifying...' : 'Verify OTP'}
        onPress={verifyOTP}
        disabled={loading}
        style={{ marginBottom: 15 }}
      />

      {otpTimer === 0 && (
        <TouchableOpacity onPress={resendOTP} disabled={loading}>
          <Text style={{ textAlign: 'center', color: '#2563eb', fontSize: 16 }}>
            Resend OTP
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        onPress={() => setStep('phone')} 
        style={{ marginTop: 15 }}
      >
        <Text style={{ textAlign: 'center', color: '#64748b' }}>
          Change Phone Number
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const renderRegisterStep = () => (
    <Card style={{ padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <Ionicons name="person-add" size={64} color="#2563eb" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 15 }}>
          Create Account
        </Text>
        <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 10 }}>
          Complete your registration to get started
        </Text>
      </View>

      <AppTextInput
        placeholder="Full Name *"
        value={name}
        onChangeText={setName}
        style={{ marginBottom: 15 }}
      />

      <AppTextInput
        placeholder="Email (Optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={{ marginBottom: 15 }}
      />

      <AppTextInput
        placeholder="Password (Min 6 characters) *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 20 }}
      />

      <AppButton
        title={loading ? 'Creating Account...' : 'Create Account'}
        onPress={register}
        disabled={loading}
      />
    </Card>
  );

  const renderLoginStep = () => (
    <Card style={{ padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <Ionicons name="log-in" size={64} color="#2563eb" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 15 }}>
          Welcome Back
        </Text>
        <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 10 }}>
          Enter your password to continue
        </Text>
      </View>

      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 16, color: '#64748b', marginBottom: 5 }}>
          Phone Number
        </Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
          {phoneNumber}
        </Text>
      </View>

      <AppTextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 20 }}
      />

      <AppButton
        title={loading ? 'Signing In...' : 'Sign In'}
        onPress={login}
        disabled={loading}
      />

      <TouchableOpacity 
        onPress={() => setStep('phone')} 
        style={{ marginTop: 15 }}
      >
        <Text style={{ textAlign: 'center', color: '#64748b' }}>
          Use Different Phone Number
        </Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2563eb' }}>
            GoBus
          </Text>
          <Text style={{ fontSize: 16, color: '#64748b', marginTop: 5 }}>
            Your Journey Starts Here
          </Text>
        </View>

        {step === 'phone' && renderPhoneStep()}
        {step === 'otp' && renderOTPStep()}
        {step === 'register' && renderRegisterStep()}
        {step === 'login' && renderLoginStep()}
      </View>
    </SafeAreaView>
  );
};

export default MobileAuthScreen;