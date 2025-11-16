// In a real React Native app, we'd use a library like react-native-vector-icons.
// This is a simplified mock to achieve a similar result without native dependencies.

import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

const iconMap = {
    'home': '🏠',
    'ticket': '🎟️',
    'briefcase': '💼',
    'user-circle': '👤',
    'chart-bar': '📊',
    'qr-code': '📲',
    'bus': '🚌',
    'users': '👥',
    'clipboard-document-list': '📜',
    'camera': '📷',
};

type IconName = keyof typeof iconMap;

interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
    const iconChar = iconMap[name] || '?';
    return (
        <Text style={[{ fontSize: size, color }, style]}>
            {iconChar}
        </Text>
    );
};

export default Icon;