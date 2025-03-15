import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoPlaceholderProps {
  size: number;
  color?: string;
}

const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({ size, color = '#4CAF50' }) => {
  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: color
        }
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>
        F
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LogoPlaceholder; 