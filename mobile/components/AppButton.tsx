
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    style?: object;
    textStyle?: object;
}

const AppButton: React.FC<AppButtonProps> = ({ title, onPress, isLoading, disabled, style, textStyle }) => {
    return (
        <TouchableOpacity
            style={[styles.button, (disabled || isLoading) && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled || isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={[styles.text, textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#0033A0',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabled: {
        backgroundColor: '#9CA3AF',
    },
});

export default AppButton;
