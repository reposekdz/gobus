
import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';

interface ScreenProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

const Screen: React.FC<ScreenProps> = ({ children, style }) => {
    return (
        <SafeAreaView style={[styles.screen, style]}>
            {children}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
});

export default Screen;
