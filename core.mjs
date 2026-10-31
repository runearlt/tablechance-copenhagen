export const WALK_LIMIT = 300;
export const ROUTE_TTL = 15 * 60 * 1000;
export function copenhagenNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Copenhagen', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(now).map(p=>[p.type,p.value]));
  return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
}
export function addDays(date,n) { const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10); }
export function minutes(time) {return Number(time.slice(0,2))*60+Number(time.slice(3,5));}
export function validDate(date) {return /^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;}
export function planError(plan, now = new Date()) {
  const current=copenhagenNow(now), lead=copenhagenNow(new Date(now.getTime()+30*60000));
  if(!validDate(plan.date)||plan.date<current.date||plan.date>addDays(current.date,30))return 'Choose a date within the next 30 days.';
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.time))return 'Choose a valid time.';
  if(`${plan.date}T${plan.time}`<`${lead.date}T${lead.time}`)return 'Choose a time at least 30 minutes from now.';
  if(![2,3,4].includes(plan.guests))return 'Choose a party of 2–4 people.';
  return null;
}
export function serves(venue,date,time) {
  if(!validDate(date))return false;
  const day=new Date(date+'T12:00:00Z').getUTCDay(), start=minutes(time);
  return venue.hours[day].some(([open,close])=>start>=open&&start+90<=close);
}
export function seatsLeft(area,plan,bookings) {
  // Explicitly simulated inventory: two tables per area per 90-minute service.
  // Prevent overlapping bookings from silently overselling the same demo tables.
  const overlaps=bookings.filter(b=>b.area===area.id&&b.date===plan.date&&Math.abs(minutes(b.time)-minutes(plan.time))<90).length;
  return Math.max(0,2-overlaps);
}
export function serviceAvailable(area,venues,plan,bookings,now=new Date()) {
  return !planError(plan,now)&&area.restaurants.every(id=>serves(venues.find(v=>v.id===id),plan.date,plan.time))&&seatsLeft(area,plan,bookings)>0;
}
export function areaStatus(area,venues,walks,plan,bookings,now=new Date()) {
  const error=planError(plan,now);if(error)return {eligible:false,reason:error};
  const pool=area.restaurants.map(id=>venues.find(v=>v.id===id));
  const missing=pool.filter(v=>!walks[v.id]||!Number.isFinite(walks[v.id].seconds));
  if(missing.length)return {eligible:false,reason:'A walking route could not be verified for every restaurant.'};
  if(pool.some(v=>walks[v.id].seconds>WALK_LIMIT))return {eligible:false,reason:'Some restaurants are more than a five-minute estimated walk from your start.'};
  const closed=pool.filter(v=>!serves(v,plan.date,plan.time));
  if(closed.length)return {eligible:false,reason:`Outside the simulated 90-minute dining window for ${closed.map(v=>v.name).join(' and ')}.`};
  const remaining=seatsLeft(area,plan,bookings);
  if(!remaining)return {eligible:false,reason:'These demo tables are full for this service. Try a time at least 90 minutes away.'};
  return {eligible:true,remaining};
}
export function probability(area,id) {return id===area.featured?.toString()?20:80/(area.restaurants.length-1);}
export function chooseRestaurant(area,roll) {if(roll<.2)return area.featured;const rest=area.restaurants.filter(id=>id!==area.featured);for(let i=0;i<rest.length;i++){if(roll < (20+80*(i+1)/rest.length)/100)return rest[i]}return rest.at(-1);}
// Convert the reservation's Copenhagen wall time to an instant, including summer time.
export function bookingInstant(b) {
  const wall=Date.parse(`${b.date}T${b.time}:00Z`);
  let instant=wall;
  for(let i=0;i<3;i++){
    const local=copenhagenNow(new Date(instant));
    const offset=Date.parse(`${local.date}T${local.time}:00Z`)-instant;
    instant=wall-offset;
  }
  return instant;
}
export const revealInstant=b=>bookingInstant(b)-15*60*1000;
export const revealDue=(b,now=Date.now())=>!b.scheduled||now>=revealInstant(b);
export function validateBookings(raw,data) {
  if(!Array.isArray(raw))return [];
  const validWalk=w=>w&&Number.isFinite(w.seconds)&&w.seconds>=0&&w.seconds<=300&&Number.isFinite(w.distance)&&w.distance>=0;
  return raw.filter(b=>{
    if(!b||typeof b.id!=='string'||! /^[a-f0-9-]{36}$/.test(b.id)||!validDate(b.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time)||![2,3,4].includes(b.guests))return false;
    const a=data.areas.find(a=>a.id===b.area);if(!a)return false;
    if(b.scheduled===true&&!b.restaurant)return a.restaurants.every(id=>validWalk(b.candidateWalks?.[id]));
    return a.restaurants.includes(b.restaurant)&&validWalk({seconds:b.walkSeconds,distance:b.walkDistance});
  }).slice(0,100).map(b=>{
    const saved={id:b.id,area:b.area,restaurant:b.restaurant||null,date:b.date,time:b.time,guests:b.guests};
    if(b.scheduled===true)saved.scheduled=true;
    if(b.restaurant){saved.walkSeconds=b.walkSeconds;saved.walkDistance=b.walkDistance}
    else{const a=data.areas.find(a=>a.id===b.area);saved.candidateWalks=Object.fromEntries(a.restaurants.map(id=>[id,{seconds:b.candidateWalks[id].seconds,distance:b.candidateWalks[id].distance}]))}
    return saved;
  });
}
