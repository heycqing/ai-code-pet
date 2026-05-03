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
}

export default function NavBar({ screen, setScreen, theme }: Props) {
  return (
    <View style={[styles.bar, { backgroundColor: theme.navBg, borderTopColor: theme.navBorder }]}>
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
            <Text style={styles.icon}>{tab.icon}</Text>
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
    borderTopWidth: 1,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 1,
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
