import { StyleSheet, Text, type TextStyle } from 'react-native';

import { openLegalDoc } from '@/lib/auth/open-legal-doc';
import { palette } from '@/lib/theme/tokens';

type Props = {
  style?: TextStyle;
  linkStyle?: TextStyle;
};

export function AuthLegalNotice({ style, linkStyle }: Props) {
  return (
    <Text style={[styles.text, style]}>
      Ao continuar você aceita os{' '}
      <Text style={[styles.link, linkStyle]} onPress={() => void openLegalDoc('/termos')}>
        Termos de Uso
      </Text>{' '}
      e a{' '}
      <Text style={[styles.link, linkStyle]} onPress={() => void openLegalDoc('/privacidade')}>
        Política de Privacidade
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 11,
    color: palette.ink400,
    textAlign: 'center',
    lineHeight: 16,
  },
  link: {
    color: palette.cerrado700,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
