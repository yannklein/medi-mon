import { useWindowDimensions } from 'react-native';

export const BREAKPOINT_WIDE = 768;

export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= BREAKPOINT_WIDE;
}
