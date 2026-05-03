export interface Theme {
  bg: string; bgCard: string; bgPanel: string;
  border: string; accent: string; accentSoft: string;
  text: string; textMuted: string; textDim: string;
  statFill: string; statBg: string;
  navBg: string; navBorder: string;
  btnBg: string; btnBorder: string; btnText: string;
  danger: string; success: string; special: string; overlay: string;
}

export const THEMES: Record<string, Theme> = {
  ink: {
    bg:'#0d0c0a', bgCard:'#16140f', bgPanel:'#1e1b14',
    border:'#3a3020', accent:'#c8941a', accentSoft:'#c8941a30',
    text:'#e8dfc0', textMuted:'#8a7a50', textDim:'#4a3f28',
    statFill:'#c8941a', statBg:'#2a2518',
    navBg:'#16140f', navBorder:'#3a3020',
    btnBg:'#2a2518', btnBorder:'#6a5a30', btnText:'#e8dfc0',
    danger:'#c84040', success:'#50a060', special:'#6080c8', overlay:'#0d0c0aee',
  },
  dark: {
    bg:'#08080f', bgCard:'#10101a', bgPanel:'#18182a',
    border:'#252540', accent:'#8060f0', accentSoft:'#8060f030',
    text:'#d0c8f0', textMuted:'#6060a0', textDim:'#303060',
    statFill:'#8060f0', statBg:'#201830',
    navBg:'#10101a', navBorder:'#252540',
    btnBg:'#201830', btnBorder:'#503080', btnText:'#d0c8f0',
    danger:'#e04060', success:'#40b060', special:'#40b0e0', overlay:'#08080fee',
  },
  rouge: {
    bg:'#0f0808', bgCard:'#1a1010', bgPanel:'#241818',
    border:'#402020', accent:'#d04828', accentSoft:'#d0482830',
    text:'#f0d8c8', textMuted:'#907060', textDim:'#503030',
    statFill:'#d04828', statBg:'#301818',
    navBg:'#1a1010', navBorder:'#402020',
    btnBg:'#301818', btnBorder:'#703030', btnText:'#f0d8c8',
    danger:'#e06040', success:'#60a050', special:'#d09040', overlay:'#0f0808ee',
  },
};
