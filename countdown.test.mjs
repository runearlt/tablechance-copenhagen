import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bookingInstant,revealInstant,revealDue,validateBookings} from './core.mjs';
const D=JSON.parse(fs.readFileSync(new URL('./restaurants.json',import.meta.url)));
for(const [date,time,utc] of [['2026-07-01','20:00','2026-07-01T18:00:00Z'],['2026-12-01','20:00','2026-12-01T19:00:00Z'],['2026-10-24','20:00','2026-10-24T18:00:00Z'],['2026-10-25','20:00','2026-10-25T19:00:00Z'],['2027-03-28','20:00','2027-03-28T18:00:00Z']]){
 const b={date,time,scheduled:true};const start=Date.parse(utc);assert.equal(bookingInstant(b),start);assert.equal(revealInstant(b),start-900000);assert.equal(revealDue(b,start-900001),false);assert.equal(revealDue(b,start-900000),true);
}
const a=D.areas[0],b={id:'12345678-1234-1234-1234-123456789abc',area:a.id,date:'2026-10-24',time:'20:00',guests:2,scheduled:true,restaurant:null,candidateWalks:Object.fromEntries(a.restaurants.map(id=>[id,{seconds:200,distance:210}]))};
assert.deepEqual(validateBookings([b],D),[b]);
const bad=structuredClone(b);delete bad.candidateWalks[a.restaurants[0]];assert.deepEqual(validateBookings([bad],D),[]);
const far=structuredClone(b);far.candidateWalks[a.restaurants[0]].seconds=301;assert.deepEqual(validateBookings([far],D),[]);
const legacy={...b,restaurant:a.restaurants[0],walkSeconds:200,walkDistance:210};delete legacy.scheduled;delete legacy.candidateWalks;assert.deepEqual(validateBookings([legacy],D),[legacy]);
console.log('PASS: Copenhagen summer/winter/DST conversion; exact 15-minute boundary; pending storage; legacy bookings; invalid route rejection.');
