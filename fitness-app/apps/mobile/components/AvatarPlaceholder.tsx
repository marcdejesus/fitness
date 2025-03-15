import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AvatarPlaceholderProps {
  size: number;
  name: string;
  backgroundColor?: string;
}

const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({ 
  size, 
  name = '', 
  backgroundColor = '#4CAF50' 
}) => {
  // Get initials from name
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return '?';
    
    const names = name.split(' ');
    if (names.length === 0) return '?';
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: backgroundColor 
        }
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AvatarPlaceholder; 