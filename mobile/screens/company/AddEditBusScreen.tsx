import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

type AddEditBusScreenRouteProp = RouteProp<RootStackParamList, 'AddEditBus'>;
// @ts-ignore
type AddEditBusScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddEditBus'>;

type Props = {
  route: AddEditBusScreenRouteProp;
  navigation: AddEditBusScreenNavigationProp;
};

export default function AddEditBusScreen({ route, navigation }: Props) {
    const { bus } = route.params || {};
    const isEditing = !!bus;

    const [plate, setPlate] = useState(bus?.plate || '');
    const [model, setModel] = useState(bus?.model || '');
    const [capacity, setCapacity] = useState(bus?.capacity?.toString() || '');
    const [amenities, setAmenities] = useState(bus?.amenities || { wifi: false, ac: true, charging: true });

    const handleSave = () => {
        if (!plate || !model || !capacity) {
            Alert.alert("Missing Fields", "Please fill in all required fields.");
            return;
        }
        // Save logic here
        Alert.alert("Success", `Bus ${isEditing ? 'updated' : 'added'} successfully!`);
        navigation.goBack();
    };
    
    const toggleAmenity = (amenity: keyof typeof amenities) => {
        setAmenities(prev => ({...prev, [amenity]: !prev[amenity]}));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Bus' : 'Add New Bus'}</Text>
            </View>
            <ScrollView style={styles.content}>
                <Text style={styles.label}>Plate Number</Text>
                <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="e.g., RAD 123 B" />
                
                <Text style={styles.label}>Bus Model</Text>
                <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="e.g., Yutong Explorer" />

                <Text style={styles.label}>Capacity</Text>
                <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="e.g., 55" />

                <Text style={styles.label}>Amenities</Text>
                <View style={styles.amenitiesContainer}>
                    <View style={styles.amenityRow}>
                        <Text style={styles.amenityLabel}>WiFi</Text><Switch value={amenities.wifi} onValueChange={() => toggleAmenity('wifi')} />
                    </View>
                    <View style={styles.amenityRow}>
                        <Text style={styles.amenityLabel}>Air Conditioning</Text><Switch value={amenities.ac} onValueChange={() => toggleAmenity('ac')} />
                    </View>
                    <View style={styles.amenityRow}>
                        <Text style={styles.amenityLabel}>Charging Ports</Text><Switch value={amenities.charging} onValueChange={() => toggleAmenity('charging')} />
                    </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Bus</Text>
                </TouchableOpacity>
                 {isEditing && (
                    <TouchableOpacity style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>Delete Bus</Text>
                    </TouchableOpacity>
                )}
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
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: 'white', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
    amenitiesContainer: { backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
    amenityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    amenityLabel: { fontSize: 16 },
    saveButton: { backgroundColor: '#0033A0', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    deleteButton: { backgroundColor: '#FEE2E2', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    deleteButtonText: { color: '#DC2626', fontWeight: 'bold', fontSize: 16 },
});
