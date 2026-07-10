import { ReactNode } from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface NeuCardProps {
  children: ReactNode;
  style?: ViewStyle;
  pressed?: boolean;
}

export function NeuCard({ children, style, pressed }: NeuCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#151e30',
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: pressed ? '#0e1726' : '#1e2a42',
          shadowColor: '#000',
          shadowOffset: pressed
            ? { width: 1, height: 1 }
            : { width: 4, height: 6 },
          shadowOpacity: pressed ? 0.3 : 0.5,
          shadowRadius: pressed ? 4 : 10,
          elevation: pressed ? 2 : 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface NeuBadgeProps {
  children: ReactNode;
  color?: string;
}

export function NeuBadge({ children, color = '#4da6ff' }: NeuBadgeProps) {
  return (
    <View
      style={{
        backgroundColor: `${color}18`,
        borderRadius: 100,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: `${color}40`,
      }}
    >
      <Text
        style={{
          color,
          fontSize: 11,
          fontFamily: 'Glow Sans SC',
        }}
      >
        {children}
      </Text>
    </View>
  );
}

interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <Text
      style={{
        color: '#6b7a99',
        fontSize: 12,
        fontFamily: 'Glow Sans SC',
        marginBottom: 8,
        marginLeft: 2,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      {label}
    </Text>
  );
}

interface NeuButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function NeuButton({
  label,
  onPress,
  variant = 'secondary',
  icon,
  disabled,
  fullWidth,
}: NeuButtonProps) {
  const bg =
    variant === 'primary'
      ? '#1a4a8a'
      : variant === 'danger'
        ? '#5a1a1a'
        : '#151e30';
  const textColor =
    variant === 'primary'
      ? '#4da6ff'
      : variant === 'danger'
        ? '#ff6b6b'
        : '#94a3b8';
  const borderColor =
    variant === 'primary'
      ? '#2a6ab8'
      : variant === 'danger'
        ? '#8a2a2a'
        : '#1e2a42';

  return (
    <View
      style={[
        fullWidth && { width: '100%' },
        {
          backgroundColor: disabled ? '#0f1624' : bg,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: disabled ? '#1e2a42' : borderColor,
          shadowColor: '#000',
          shadowOffset: { width: 3, height: 4 },
          shadowOpacity: disabled ? 0.2 : 0.4,
          shadowRadius: 6,
          elevation: disabled ? 1 : 4,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 20,
          gap: 8,
        }}
      >
        {icon}
        <Text
          style={{
            color: disabled ? '#6b7a99' : textColor,
            fontFamily: 'Glow Sans SC',
            fontSize: 14,
            fontWeight: '600',
          }}
          onPress={disabled ? undefined : onPress}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
