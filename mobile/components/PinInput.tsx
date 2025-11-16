import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

interface PinInputProps {
    pin: string[];
    onPinChange: (pin: string[]) => void;
}

const PinInput: React.FC<PinInputProps> = ({ pin, onPinChange }) => {
    const inputs = useRef<(TextInput | null)[]>([]);

    const handlePinChange = (text: string, index: number) => {
        const newPin = [...pin];
        newPin[index] = text;
        onPinChange(newPin);

        if (text && index < 3) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            {pin.map((digit, index) => (
                <TextInput
                    key={index}
                    ref={(ref) => { inputs.current[index] = ref; }}
                    style={styles.input}
                    value={digit}
                    onChangeText={(text) => handlePinChange(text, index)}
                    onKeyPress={(e) => handleKeyDown(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    secureTextEntry
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        alignSelf: 'center',
    },
    input: {
        width: 50,
        height: 60,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: '#F3F4F6',
    },
});

export default PinInput;
