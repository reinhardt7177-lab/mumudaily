// NEIS Open API client
// Docs: https://open.neis.go.kr
// Key is optional but recommended (higher rate limit). Set VITE_NEIS_KEY in .env.local

const BASE = 'https://open.neis.go.kr/hub'
const KEY = import.meta.env.VITE_NEIS_KEY as string | undefined
const keyParam = KEY ? `&KEY=${encodeURIComponent(KEY)}` : ''

export type School = {
  ATPT_OFCDC_SC_CODE: string // 시도교육청 코드
  ATPT_OFCDC_SC_NM: string // 시도교육청명
  SD_SCHUL_CODE: string // 표준학교 코드
  SCHUL_NM: string // 학교명
  SCHUL_KND_SC_NM: string // 학교종류명
  LCTN_SC_NM: string // 시도명
  ORG_RDNMA: string // 도로명주소
}

export type SchoolKind = 'els' | 'mis' | 'his' | 'sps'
export const detectSchoolKind = (name: string): SchoolKind => {
  if (name.includes('초등')) return 'els'
  if (name.includes('중학교')) return 'mis'
  if (name.includes('고등')) return 'his'
  return 'sps'
}

export type TimetableItem = {
  ALL_TI_YMD: string // 일자 YYYYMMDD
  PERIO: string // 교시
  ITRT_CNTNT: string // 수업내용 (과목명)
  CLASS_NM: string // 학급명
  GRADE: string // 학년
}

export type Meal = {
  MLSV_YMD: string // 급식일자 YYYYMMDD
  MMEAL_SC_NM: string // 식사명 (조식/중식/석식)
  DDISH_NM: string // 요리명 (HTML <br/> 포함)
  CAL_INFO: string // 칼로리
}

export type ScheduleItem = {
  AA_YMD: string // 일자
  EVENT_NM: string // 행사명
  EVENT_CNTNT: string // 내용
}

const yyyymmdd = (d: Date) =>
  `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d
    .getDate()
    .toString()
    .padStart(2, '0')}`

const fetchJson = async (url: string): Promise<unknown> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NEIS ${res.status}`)
  return res.json()
}

const extractRows = (
  raw: unknown,
  rootKey: string
): Record<string, string>[] => {
  const data = raw as Record<string, unknown>
  const node = data?.[rootKey]
  if (!Array.isArray(node)) return []
  // structure: [{head: [...]}, {row: [...]}]
  for (const block of node) {
    const b = block as Record<string, unknown>
    if (Array.isArray(b.row)) return b.row as Record<string, string>[]
  }
  return []
}

export const searchSchools = async (
  name: string,
  regionCode?: string
): Promise<School[]> => {
  if (!name.trim()) return []
  const region = regionCode ? `&ATPT_OFCDC_SC_CODE=${regionCode}` : ''
  const url = `${BASE}/schoolInfo?Type=json&pIndex=1&pSize=30${keyParam}${region}&SCHUL_NM=${encodeURIComponent(
    name
  )}`
  const raw = await fetchJson(url)
  return extractRows(raw, 'schoolInfo') as unknown as School[]
}

export const getMeal = async (
  ATPT_OFCDC_SC_CODE: string,
  SD_SCHUL_CODE: string,
  date: Date = new Date()
): Promise<Meal[]> => {
  const ymd = yyyymmdd(date)
  const url = `${BASE}/mealServiceDietInfo?Type=json&pIndex=1&pSize=10${keyParam}&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_YMD=${ymd}`
  try {
    const raw = await fetchJson(url)
    return extractRows(raw, 'mealServiceDietInfo') as unknown as Meal[]
  } catch {
    return []
  }
}

export const getSchedule = async (
  ATPT_OFCDC_SC_CODE: string,
  SD_SCHUL_CODE: string,
  from: Date,
  to: Date
): Promise<ScheduleItem[]> => {
  const url = `${BASE}/SchoolSchedule?Type=json&pIndex=1&pSize=100${keyParam}&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&AA_FROM_YMD=${yyyymmdd(
    from
  )}&AA_TO_YMD=${yyyymmdd(to)}`
  try {
    const raw = await fetchJson(url)
    return extractRows(raw, 'SchoolSchedule') as unknown as ScheduleItem[]
  } catch {
    return []
  }
}

export const cleanDishName = (raw: string): string[] =>
  raw
    .split(/<br\s*\/?>/i)
    .map((s) => s.replace(/\s*\([^)]*\)\s*/g, '').trim())
    .filter(Boolean)

const timetableEndpoint = (kind: SchoolKind): string => {
  switch (kind) {
    case 'els':
      return 'elsTimetable'
    case 'mis':
      return 'misTimetable'
    case 'his':
      return 'hisTimetable'
    case 'sps':
      return 'spsTimetable'
  }
}

const semesterFromMonth = (m: number): string => (m >= 3 && m <= 8 ? '1' : '2')

export const getTimetable = async (
  kind: SchoolKind,
  ATPT_OFCDC_SC_CODE: string,
  SD_SCHUL_CODE: string,
  grade: string,
  classNm: string,
  weekStart: Date
): Promise<TimetableItem[]> => {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const ay = start.getFullYear().toString()
  const sem = semesterFromMonth(start.getMonth() + 1)
  const endpoint = timetableEndpoint(kind)
  const url = `${BASE}/${endpoint}?Type=json&pIndex=1&pSize=200${keyParam}&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&AY=${ay}&SEM=${sem}&GRADE=${encodeURIComponent(
    grade
  )}&CLASS_NM=${encodeURIComponent(classNm)}&TI_FROM_YMD=${yyyymmdd(
    start
  )}&TI_TO_YMD=${yyyymmdd(end)}`
  try {
    const raw = await fetchJson(url)
    return extractRows(raw, endpoint) as unknown as TimetableItem[]
  } catch {
    return []
  }
}
