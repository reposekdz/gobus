import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = ['Trip Details', 'Contact Info', 'Confirmation'];
const CheckIcon = () => <Text style={{ color: 'white' }}>✓</Text>;


export default function BusCharterScreen({ navigation }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [charterRequest, setCharterRequest] = useState({
        from: '', to: '', departureDate: '', passengers: '20', name: '', phone: ''
    });

    const handleNext = () => {
        if(currentStep === 3) {
            Alert.alert("Request Sent", "A company representative will contact you shortly.");
            navigation.goBack();
        } else {
             setCurrentStep(prev => prev + 1);
        }
    };
    const handleBack = () => setCurrentStep(prev => prev - 1);
    
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <View>
                        <Text style={styles.label}>From</Text>
                        <TextInput style={styles.input} value={charterRequest.from} onChangeText={t => setCharterRequest(p=>({...p, from: t}))} placeholder="e.g., Kigali" />
                        <Text style={styles.label}>To</Text>
                        <TextInput style={styles.input} value={charterRequest.to} onChangeText={t => setCharterRequest(p=>({...p, to: t}))} placeholder="e.g., Rubavu" />
                        <Text style={styles.label}>Departure Date</Text>
                        <TextInput style={styles.input} value={charterRequest.departureDate} onChangeText={t => setCharterRequest(p=>({...p, departureDate: t}))} placeholder="YYYY-MM-DD" />
                        <Text style={styles.label}>Number of Passengers</Text>
                        <TextInput style={styles.input} value={charterRequest.passengers} onChangeText={t => setCharterRequest(p=>({...p, passengers: t}))} keyboardType="number-pad" />
                    </View>
                );
            case 2:
                return (
                    <View>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput style={styles.input} value={charterRequest.name} onChangeText={t => setCharterRequest(p=>({...p, name: t}))} placeholder="Your full name" />
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput style={styles.input} value={charterRequest.phone} onChangeText={t => setCharterRequest(p=>({...p, phone: t}))} keyboardType="phone-pad" placeholder="Your phone number" />
                    </View>
                );
            case 3:
                 return (
                    <View style={styles.confirmationContainer}>
                        <View style={styles.iconContainer}><CheckIcon /></View>
                        <Text style={styles.title}>Request Sent!</Text>
                        <Text style={styles.subtitle}>A company representative will contact you shortly with a quote.</Text>
                    </View>
                );
        }
    }

    return (
        <SafeAreaView style={styles.container}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Bus Charter Request</Text>
            </View>
            <ScrollView style={styles.content}>
                 {/* Stepper */}
                <View style={styles.stepper}>
                    {STEPS.map((step, index) => (
                        <React.Fragment key={step}>
                            <View style={styles.step}>
                                <View style={[styles.stepCircle, currentStep > index ? styles.stepCompleted : currentStep === index + 1 ? styles.stepActive : {}]}>
                                    {currentStep > index ? <CheckIcon/> : <Text style={currentStep === index+1 ? styles.stepTextActive : styles.stepText}>{index + 1}</Text>}
                                </View>
                                <Text style={[styles.stepLabel, currentStep >= index+1 ? styles.stepLabelActive : {}]}>{step}</Text>
                            </View>
                            {index < STEPS.length - 1 && <View style={styles.stepConnector} />}
                        </React.Fragment>
                    ))}
                </View>

                {renderStepContent()}
            </ScrollView>
            
            {currentStep < 3 && (
                 <View style={styles.footer}>
                    {currentStep > 1 && <TouchableOpacity style={styles.backNavButton} onPress={handleBack}><Text>Back</Text></TouchableOpacity>}
                    <TouchableOpacity style={styles.nextNavButton} onPress={handleNext}><Text style={styles.nextNavText}>Next</Text></TouchableOpacity>
                </View>
            )}
             {currentStep === 3 && (
                 <View style={styles.footer}>
                     <TouchableOpacity style={styles.nextNavButton} onPress={() => navigation.goBack()}><Text style={styles.nextNavText}>Done</Text></TouchableOpacity>
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
    backButton: { fontSize: 24, fontWeight: 'bold', marginRight: 16, color: '#0033A0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    stepper: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 24 },
    step: { alignItems: 'center', width: 100 },
    stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
    stepActive: { backgroundColor: '#3B82F6' },
    stepCompleted: { backgroundColor: '#10B981' },
    stepText: { color: '#6B7280', fontWeight: 'bold' },
    stepTextActive: { color: 'white', fontWeight: 'bold' },
    stepLabel: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
    stepLabelActive: { color: '#1F2937' },
    stepConnector: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginTop: 15 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    backNavButton: { padding: 12, borderRadius: 8 },
    nextNavButton: { flex: 1, backgroundColor: '#0033A0', padding: 16, borderRadius: 8, alignItems: 'center' },
    nextNavText: { color: 'white', fontWeight: 'bold' },
    confirmationContainer: { alignItems: 'center', paddingVertical: 40 },
    iconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: '#6B7280', textAlign: 'center', marginTop: 8 }
});