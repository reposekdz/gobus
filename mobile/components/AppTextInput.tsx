
import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';

interface AppTextInputProps {
    label?: string;
    [key: string]: any; // Allow any other TextInput props
}

const AppTextInput: React.FC<AppTextInputProps> = ({ label, ...otherProps }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={styles.input}
                placeholderTextColor="#9CA3AF"
                {...otherProps}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F3F4F6',
        padding: 14,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
});

export default AppTextInput;
