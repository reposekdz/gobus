import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';

export default function ReportLostItemScreen({ navigation }) {
    const [item, setItem] = useState('');
    const [description, setDescription] = useState('');
    const [route, setRoute] = useState('');
    const [date, setDate] = useState('');
    const [contact, setContact] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = () => {
        if (!item || !route || !date || !contact) {
            Alert.alert("Missing Information", "Please fill in all fields to submit your report.");
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            Alert.alert("Report Submitted", "Thank you for your report. We will contact you if we find a match.");
            navigation.goBack();
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Report a Lost Item</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <AppTextInput label="What did you lose?" placeholder="e.g., Black backpack" value={item} onChangeText={setItem} />
                <AppTextInput label="Description" placeholder="Any specific details (brand, contents, etc.)" value={description} onChangeText={setDescription} multiline />
                <AppTextInput label="Bus Route" placeholder="e.g., Kigali to Huye" value={route} onChangeText={setRoute} />
                <AppTextInput label="Date of Travel" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
                <AppTextInput label="Your Contact Number" placeholder="e.g., 0788123456" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
                <AppButton title="Submit Report" onPress={handleSubmit} isLoading={isLoading} />
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
});