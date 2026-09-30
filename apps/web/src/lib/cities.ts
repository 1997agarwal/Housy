// City registry. `mult` scales cost vs the Bareilly baseline (placeholder — calibrate with real quotes).
// status 'live'  = verified crews onboarded, site visits can be booked.
// status 'soon'  = estimates work, bookings go to a waitlist until crews are onboarded.
export type CityStatus = 'live' | 'soon';
export interface City { id: string; name: string; state: string; mult: number; status: CityStatus; localities: string[] }

export const CITIES: City[] = [
  { id: 'bareilly', name: 'Bareilly', state: 'Uttar Pradesh', mult: 1, status: 'live', localities: ['Civil Lines', 'Subhash Nagar', 'Rajendra Nagar', 'Izzatnagar', 'Pilibhit Bypass'] },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', mult: 1.12, status: 'live', localities: ['Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Alambagh'] },
  { id: 'agra', name: 'Agra', state: 'Uttar Pradesh', mult: 1.05, status: 'soon', localities: [] },
  { id: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', mult: 1.05, status: 'soon', localities: [] },
  { id: 'meerut', name: 'Meerut', state: 'Uttar Pradesh', mult: 1.1, status: 'soon', localities: [] },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', mult: 1.02, status: 'soon', localities: [] },
  { id: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', mult: 1.08, status: 'soon', localities: [] },
  { id: 'delhi-ncr', name: 'Delhi NCR', state: 'Delhi', mult: 1.4, status: 'soon', localities: [] },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', mult: 1.25, status: 'soon', localities: [] },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', mult: 1.15, status: 'soon', localities: [] },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', mult: 1.1, status: 'soon', localities: [] },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', mult: 1.05, status: 'soon', localities: [] },
  { id: 'patna', name: 'Patna', state: 'Bihar', mult: 1, status: 'soon', localities: [] },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', mult: 1.2, status: 'soon', localities: [] },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', mult: 1.6, status: 'soon', localities: [] },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', mult: 1.3, status: 'soon', localities: [] },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', mult: 1.4, status: 'soon', localities: [] },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', mult: 1.3, status: 'soon', localities: [] },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', mult: 1.3, status: 'soon', localities: [] },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', mult: 1.2, status: 'soon', localities: [] },
];

export const DEFAULT_CITY = 'bareilly';
export const getCity = (idOrName?: string | null) => {
  const k = (idOrName ?? '').toLowerCase();
  return CITIES.find((c) => c.id === k || c.name.toLowerCase() === k);
};
export const cityOrDefault = (idOrName?: string | null) => getCity(idOrName) ?? getCity(DEFAULT_CITY)!;
