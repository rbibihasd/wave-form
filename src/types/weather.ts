export type OceanSport = 
  | 'surf' 
  | 'kitesurf' 
  | 'windsurf' 
  | 'bodyboard' 
  | 'foil' 
  | 'sup' 
  | 'swimming' 
  | 'diving';

export type BreakType = 
  | 'beach_break' 
  | 'point_break' 
  | 'reef_break' 
  | 'river_mouth' 
  | 'sheltered_bay';

export type TideLevel = 'low' | 'mid' | 'high' | 'all';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type WindRelation = 'offshore' | 'cross_offshore' | 'cross_shore' | 'cross_onshore' | 'onshore';

export type ConditionVerdict = 'Epic' | 'Good' | 'Fair' | 'Challenging' | 'Poor';

export interface SportSuitability {
  score: number; // 0.0 to 10.0
  verdict: ConditionVerdict;
  headline: string;
  recommendation: string;
  gearTip: string;
  highlights: string[];
  cautions: string[];
}

export interface TideEvent {
  time: string;
  type: 'high' | 'low';
  height: number; // meters
}

export interface HourlyForecastPoint {
  time: string; // ISO string
  displayTime: string; // e.g. "09:00"
  waveHeight: number; // meters
  wavePeriod: number; // seconds
  swellDirection: number; // degrees
  swellCardinal: string; // e.g. "WNW"
  windSpeedKnots: number;
  windSpeedKmh: number;
  windGustsKnots: number;
  windDirection: number;
  windCardinal: string;
  windRelation: WindRelation;
  temperature: number; // °C
  precipitationProbability: number; // 0 - 100%
  weatherCode: number;
  weatherLabel: string;
  tideHeight: number; // meters
  suitabilityScore: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  waveHeightMin: number;
  waveHeightMax: number;
  dominantPeriod: number;
  windAvgKnots: number;
  bestSport: OceanSport;
  weatherCode: number;
  weatherLabel: string;
}

export interface CurrentConditions {
  waveHeight: number; // meters
  wavePeriod: number; // seconds
  swellDirection: number; // degrees
  swellCardinal: string;
  windSpeedKnots: number;
  windSpeedKmh: number;
  windGustsKnots: number;
  windDirection: number;
  windCardinal: string;
  windRelation: WindRelation;
  temperatureAir: number; // °C
  temperatureFeelsLike: number;
  temperatureWater: number; // °C
  humidity: number;
  uvIndex: number;
  weatherCode: number;
  weatherLabel: string;
  tideStatus: 'rising' | 'falling' | 'slack_high' | 'slack_low';
  currentTideHeight: number;
  nextTide: TideEvent;
  secondarySwell?: { height: number; period: number; direction: string };
  sportsRatings: Record<OceanSport, SportSuitability>;
  wetsuitRecommendation: string;
}

export interface LiveOceanSpot {
  id: string;
  name: string;
  region: string;
  country: string;
  coordinates: { lat: number; lng: number };
  distanceKm: number;
  breakType: BreakType;
  seabed: string;
  shoreOrientationDeg: number; // e.g., facing 270 (West)
  idealSwellDir: string[];
  idealWindDir: string[];
  idealTide: TideLevel;
  skillLevel: SkillLevel;
  supportedSports: OceanSport[];
  description: string;
  hazards: string[];
  amenities: string[];
  image: string;
  webcamAvailable?: boolean;
  webcamNote?: string;
  isWorldSpot?: boolean;
  countryCode?: string;
  current: CurrentConditions;
  hourly: HourlyForecastPoint[];
  daily: DailyForecast[];
  tides: TideEvent[];
}

export interface WorldGeocodeResult {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  elevation?: number;
}

export interface SpotSearchFilters {
  query: string;
  sport: OceanSport | 'all';
  skillLevel: SkillLevel | 'all';
  minWaveHeight: number; // meters
  maxWaveHeight: number; // meters
  windCondition: 'all' | 'offshore_only' | 'light_wind' | 'strong_wind';
  breakType: BreakType | 'all';
  tide: TideLevel | 'all';
  minScore: number;
  onlyFavorites: boolean;
  scope: 'all' | 'local' | 'world';
  sortBy: 'suitability' | 'wave_height' | 'wind_speed' | 'distance' | 'alphabetical';
  unit: 'metric' | 'imperial';
}
