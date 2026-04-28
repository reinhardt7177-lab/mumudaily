// Open-Meteo: free, no API key, CORS-enabled
// Docs: https://open-meteo.com/en/docs

export type WeatherNow = {
  temperature: number
  apparent: number
  humidity: number
  weatherCode: number
  windSpeed: number
  isDay: boolean
}

export type AirQualityNow = {
  pm10: number
  pm2_5: number
}

export const getWeather = async (
  lat: number,
  lon: number
): Promise<WeatherNow | null> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=Asia%2FSeoul`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const c = data.current
    if (!c) return null
    return {
      temperature: c.temperature_2m,
      apparent: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      weatherCode: c.weather_code,
      windSpeed: c.wind_speed_10m,
      isDay: c.is_day === 1,
    }
  } catch {
    return null
  }
}

export const getAirQuality = async (
  lat: number,
  lon: number
): Promise<AirQualityNow | null> => {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=Asia%2FSeoul`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const c = data.current
    if (!c) return null
    return { pm10: c.pm10, pm2_5: c.pm2_5 }
  } catch {
    return null
  }
}

// WMO weather codes — https://open-meteo.com/en/docs
export const weatherDescription = (
  code: number,
  isDay: boolean
): { label: string; emoji: string } => {
  if (code === 0) return { label: '맑음', emoji: isDay ? '☀️' : '🌙' }
  if (code === 1) return { label: '대체로 맑음', emoji: isDay ? '🌤️' : '🌙' }
  if (code === 2) return { label: '구름 조금', emoji: '⛅' }
  if (code === 3) return { label: '흐림', emoji: '☁️' }
  if ([45, 48].includes(code)) return { label: '안개', emoji: '🌫️' }
  if ([51, 53, 55].includes(code)) return { label: '이슬비', emoji: '🌦️' }
  if ([56, 57].includes(code)) return { label: '얼어붙는 이슬비', emoji: '🌧️' }
  if ([61, 63, 65].includes(code)) return { label: '비', emoji: '🌧️' }
  if ([66, 67].includes(code)) return { label: '얼어붙는 비', emoji: '🌧️' }
  if ([71, 73, 75, 77].includes(code)) return { label: '눈', emoji: '🌨️' }
  if ([80, 81, 82].includes(code)) return { label: '소나기', emoji: '🌦️' }
  if ([85, 86].includes(code)) return { label: '눈 소나기', emoji: '🌨️' }
  if ([95, 96, 99].includes(code)) return { label: '뇌우', emoji: '⛈️' }
  return { label: '날씨', emoji: '🌡️' }
}

export const pmGrade = (pm25: number): { label: string; color: string } => {
  if (pm25 <= 15) return { label: '좋음', color: 'text-sky-600 bg-sky-100/70' }
  if (pm25 <= 35)
    return { label: '보통', color: 'text-emerald-600 bg-emerald-100/70' }
  if (pm25 <= 75)
    return { label: '나쁨', color: 'text-amber-600 bg-amber-100/70' }
  return { label: '매우나쁨', color: 'text-rose-600 bg-rose-100/70' }
}

export const getCoords = (): Promise<{ lat: number; lon: number } | null> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 5 * 60 * 1000 }
    )
  })
