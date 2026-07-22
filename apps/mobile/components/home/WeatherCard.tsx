import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeWeather, HomeWeatherDay } from '@/lib/home/block-data';
import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = { cityName: string; weather: HomeWeather };

type IonName = keyof typeof Ionicons.glyphMap;

function iconForCode(code: number | null): IonName {
  if (code == null) return 'partly-sunny-outline';
  if (code === 0) return 'sunny-outline';
  if (code <= 3) return 'partly-sunny-outline';
  if (code <= 48) return 'cloud-outline';
  if (code <= 57) return 'cloudy-night-outline';
  if (code <= 67) return 'rainy-outline';
  if (code <= 77) return 'snow-outline';
  if (code <= 82) return 'rainy-outline';
  if (code >= 95) return 'thunderstorm-outline';
  return 'partly-sunny-outline';
}

function labelForCode(code: number | null): string {
  if (code == null) return 'Tempo local';
  if (code === 0) return 'Céu limpo';
  if (code <= 3) return 'Parcialmente nublado';
  if (code <= 48) return 'Neblina';
  if (code <= 67) return 'Chuva';
  if (code <= 77) return 'Neve';
  if (code <= 82) return 'Pancadas';
  if (code >= 95) return 'Tempestade';
  return 'Tempo variável';
}

function formatDayLabel(date: string, index: number): string {
  if (index === 0) return 'Hoje';
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(`${date}T12:00:00`));
  return label.replace('.', '');
}

function ForecastChip({ day, index }: { day: HomeWeatherDay; index: number }) {
  const isToday = index === 0;
  return (
    <View style={[styles.chip, isToday && styles.chipToday]}>
      <Text style={[styles.chipDay, isToday && styles.chipDayToday]}>
        {formatDayLabel(day.date, index)}
      </Text>
      <Ionicons
        name={iconForCode(day.weatherCode)}
        size={22}
        color={isToday ? palette.sun500 : 'rgba(255,255,255,0.92)'}
      />
      <Text style={styles.chipTemp}>
        {day.tempMax != null ? `${Math.round(day.tempMax)}°` : '—'}
      </Text>
      <Text style={styles.chipMin}>
        {day.tempMin != null ? `${Math.round(day.tempMin)}°` : ' '}
      </Text>
    </View>
  );
}

export function WeatherCard({ cityName, weather }: Props) {
  const temp = weather.temperature != null ? Math.round(weather.temperature) : null;
  const code = weather.weatherCode ?? weather.daily[0]?.weatherCode ?? null;
  const forecastDays = weather.daily.length > 0 ? weather.daily : [];

  return (
    <View style={{ paddingHorizontal: 16 }}>
      <Pressable
        onPress={() => router.push('/webview/servicos-clima' as never)}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}
      >
        <LinearGradient
          colors={['#2F8DCE', '#1F6798']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Clima agora</Text>
            <Text style={styles.city}>{cityName}</Text>
            <Text style={styles.desc}>{weather.description ?? labelForCode(code)}</Text>
          </View>

          <View style={styles.tempBlock}>
            <Ionicons name={iconForCode(code)} size={36} color={palette.white} />
            {temp != null ? <Text style={styles.temp}>{temp}°</Text> : null}
          </View>
        </View>

        {(weather.high != null || weather.low != null) ? (
          <View style={styles.minMax}>
            {weather.high != null ? (
              <View style={styles.minMaxItem}>
                <Ionicons name="arrow-up" size={11} color={palette.white} />
                <Text style={styles.minMaxText}>{Math.round(weather.high)}° máx</Text>
              </View>
            ) : null}
            {weather.low != null ? (
              <View style={styles.minMaxItem}>
                <Ionicons name="arrow-down" size={11} color={palette.white} />
                <Text style={styles.minMaxText}>{Math.round(weather.low)}° mín</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {forecastDays.length > 0 ? (
          <View style={styles.forecastRow}>
            {forecastDays.map((day, index) => (
              <ForecastChip key={day.date} day={day} index={index} />
            ))}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 16,
    ...shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  city: { color: palette.white, fontSize: 18, fontWeight: '900', marginTop: 4 },
  desc: { color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  tempBlock: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  temp: { color: palette.white, fontSize: 40, fontWeight: '900', letterSpacing: -1.5 },
  minMax: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  minMaxItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  minMaxText: { color: palette.white, fontSize: 12, fontWeight: '700' },
  forecastRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    gap: 6,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  chipToday: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  chipDay: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipDayToday: { color: palette.sun500 },
  chipTemp: { color: palette.white, fontSize: 15, fontWeight: '900' },
  chipMin: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
});
