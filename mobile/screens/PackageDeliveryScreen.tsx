import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = ['Details', 'Schedule', 'Recipient', 'Confirm'];
const CheckIcon = () => <Text style={{ color: 'white' }}>✓</Text>;

export default function PackageDeliveryScreen({ navigation }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [packageDetails, setPackageDetails] = useState({ from: '', to: '', size: 'medium' });

    const handleNext = () => {
        if(currentStep === 4) {
            Alert.alert("Package Sent!", `Your tracking ID is PKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
            navigation.goBack();
        } else {
            setCurrentStep(prev => prev + 1)
        }
    };
    const handleBack = () => setCurrentStep(prev => prev - 1);
    
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return <Text style={styles.placeholderText}>Package Details Form Here</Text>;
            case 2: return <Text style={styles.placeholderText}>Schedule Selection Here</Text>;
            case 3: return <Text style={styles.placeholderText}>Recipient Info Form Here</Text>;
            case 4: return <Text style={styles.placeholderText}>Confirmation Summary Here</Text>;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Send a Package</Text>
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
                
                <View style={styles.stepContentContainer}>
                    {renderStepContent()}
                </View>
            </ScrollView>
             <View style={styles.footer}>
                {currentStep > 1 && <TouchableOpacity style={styles.backNavButton} onPress={handleBack}><Text>Back</Text></TouchableOpacity>}
                <TouchableOpacity style={styles.nextNavButton} onPress={handleNext}>
                    <Text style={styles.nextNavText}>{currentStep === 4 ? 'Confirm & Pay' : 'Next'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
    backButton: { fontSize: 24, fontWeight: 'bold', marginRight: 16, color: '#0033A0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { flex: 1 },
    stepper: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', padding: 20, backgroundColor: 'white' },
    step: { alignItems: 'center', width: 80 },
    stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
    stepActive: { backgroundColor: '#3B82F6' },
    stepCompleted: { backgroundColor: '#10B981' },
    stepText: { color: '#6B7280', fontWeight: 'bold' },
    stepTextActive: { color: 'white', fontWeight: 'bold' },
    stepLabel: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
    stepLabelActive: { color: '#1F2937' },
    stepConnector: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginTop: 15 },
    stepContentContainer: { padding: 20, minHeight: 300, justifyContent: 'center' },
    placeholderText: { color: '#9CA3AF', textAlign: 'center' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: 'white' },
    backNavButton: { padding: 12, borderRadius: 8 },
    nextNavButton: { flex: 1, backgroundColor: '#0033A0', padding: 16, borderRadius: 8, alignItems: 'center' },
    nextNavText: { color: 'white', fontWeight: 'bold' },
});