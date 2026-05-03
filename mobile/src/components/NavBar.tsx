import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../theme';

export type NavTab = 'main' | 'feed' | 'train' | 'evolve' | 'compend' | 'settings';

const TABS: { id: NavTab; icon: string; label: string }[] = [
  { id: 'main',     icon: '🏠', label: '主界面' },
  { id: 'feed',     icon: '🍖', label: '喂食'   },
  { id: 'train',    icon: '⚔️', label: '训练'   },
  { id: 'evolve',   icon: '✨', label: '进化'   },
  { id: 'compend',  icon: '📖', label: '图鉴'   },
  { id: 'settings', icon: '⚙️', label: '设置'   },
];

interface Props {
  screen: NavTab;
  setScreen: (s: NavTab) => void;
  theme: Theme;
  bottomInset?: number;
}

export default function NavBar({ screen, setScreen, theme, bottomInset = 0 }: Props) {
  return (
    <View style={[
      styles.bar,
      { backgroundColor: theme.navBg, borderTopColor: theme.navBorder, paddingBottom: Math.max(bottomInset, 6) },
    ]}>
      {TABS.map(tab => {
        const active = tab.id === screen;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => setScreen(tab.id)}
            activeOpacity={0.7}
          >
            {active && (
              <View style={[styles.activeIndicator, { backgroundColor: theme.accent }]} />
            )}
            <Text style={[styles.icon, { opacity: active ? 1 : 0.5 }]}>{tab.icon}</Text>
            <Text style={[
              styles.label,
              { color: active ? theme.accent : theme.textMuted },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 2,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 1,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
