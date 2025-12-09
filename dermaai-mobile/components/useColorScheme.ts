// Force light theme for now to avoid system theme inconsistencies
// Original: export { useColorScheme } from 'react-native';
export function useColorScheme() {
    return 'light' as const;
}
