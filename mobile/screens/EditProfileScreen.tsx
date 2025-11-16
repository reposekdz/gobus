import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';

export default function EditProfileScreen({ navigation }) {
    const { user, setUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState('0788 123 456'); // Mock phone

    const handleSave = () => {
        if (user) {
            setUser({ ...user, name });
        }
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: user?.avatar_url }} style={styles.avatar} />
                    <TouchableOpacity>
                        <Text style={styles.changeText}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} />
                    
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput style={styles.input} value={user?.email} editable={false} />

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
                
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
    backButton: { fontSize: 24, fontWeight: 'bold', marginRight: 16, color: '#0033A0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 120, height: 120, borderRadius: 60 },
    changeText: { color: '#0033A0', fontWeight: '600', marginTop: 12 },
    form: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: 'white', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
    saveButton: { backgroundColor: '#0033A0', padding: 16, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
