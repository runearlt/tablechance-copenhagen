import assert from 'node:assert/strict';
import fs from 'node:fs';
import {copenhagenNow,planError,areaStatus,seatsLeft,chooseRestaurant,probability,validateBookings} from './core.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./restaurants.json',import.meta.url)));
const now=new Date('2026-10-31T12:00:00Z'),plan={date:'2026-11-01',time:'19:30',guests:2};
const walks=Object.fromEntries(data.restaurants.map(v=>[v.id,{seconds:299,distance:300}]));
for(const a of data.areas){
 assert.equal(a.restaurants.length,5);assert.equal(new Set(a.restaurants).size,5);
 assert.ok(a.restaurants.includes(a.featured));assert.ok(a.restaurants.includes(a.anchor));
 assert.equal(areaStatus(a,data.restaurants,walks,plan,[],now).eligible,true);
 for(const id of a.restaurants){
  assert.equal(areaStatus(a,data.restaurants,{...walks,[id]:null},plan,[],now).eligible,false);
  assert.equal(areaStatus(a,data.restaurants,{...walks,[id]:{seconds:301}},plan,[],now).eligible,false);
 }
 assert.equal(areaStatus(a,data.restaurants,walks,{...plan,time:'21:00'},[],now).eligible,false);
 assert.equal(a.restaurants.reduce((sum,id)=>sum+probability(a,id),0),100);
 assert.equal(chooseRestaurant(a,0),a.featured);
 const rest=a.restaurants.filter(id=>id!==a.featured);
 rest.forEach((id,i)=>assert.equal(chooseRestaurant(a,.2+(i+.5)*.8/rest.length),id));
 const booked=[{...plan,area:a.id},{...plan,time:'20:00',area:a.id}];
 assert.equal(seatsLeft(a,plan,booked),0);assert.equal(seatsLeft(a,{...plan,time:'21:30'},booked),2);
}
assert.equal(planError({...plan,guests:5},now),'Choose a party of 2–4 people.');
assert.ok(planError({...plan,date:'2026-02-31'},now));assert.ok(planError({...plan,date:'2026-12-10'},now));
assert.equal(copenhagenNow(new Date('2026-07-01T22:30:00Z')).date,'2026-07-02');
assert.equal(copenhagenNow(new Date('2026-12-01T22:30:00Z')).date,'2026-12-01');
assert.deepEqual(validateBookings([{id:'<script>'}],data),[]);
for(const v of data.restaurants){assert.ok(v.lat>55.6&&v.lat<55.8&&v.lng>12.4&&v.lng<12.7);assert.ok(data.photos.some(p=>p.id===v.photo));}
console.log('PASS: five packages, route failures, five-minute boundary, demo capacity, service windows, odds and Copenhagen dates');
