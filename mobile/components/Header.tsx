import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
    title: string;
    canGoBack?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, canGoBack }) => {
    const navigation = useNavigation();
    return (
        <View style={styles.header}>
            {canGoBack && (
                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{'<'}</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.title}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 60,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        position: 'absolute',
        left: 16,
    },
    backButtonText: {
        fontSize: 24,
        color: '#0033A0',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default Header;