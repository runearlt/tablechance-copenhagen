import {WALK_LIMIT,ROUTE_TTL,copenhagenNow,addDays,planError,areaStatus,probability,chooseRestaurant,validateBookings,revealInstant,revealDue,serviceAvailable} from './core.mjs?v=20261031-copenhagen';
const $=id=>document.getElementById(id);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel=date=>new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
const walkLabel=w=>w?`${Math.max(1,Math.ceil(w.seconds/60))} min · ${w.distance} m`:'Route unavailable';
const DATA=await fetch('restaurants.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Restaurant data unavailable');return r.json()}).catch(()=>null);
if(!DATA){$('find-table').disabled=true;$('landing').insertAdjacentHTML('beforeend','<p class="error">Restaurant information could not load. Please reload the page.</p>');throw Error('Restaurant data unavailable')}
const venue=id=>DATA.restaurants.find(v=>v.id===id);
const neighbourhood=id=>DATA.neighbourhoods.find(n=>n.id===id);
let activeNeighbourhood='kodbyen';
try{const saved=sessionStorage.getItem('tablechance-cph-neighbourhood');if(neighbourhood(saved))activeNeighbourhood=saved}catch{}
const visibleAreas=()=>DATA.areas.filter(a=>a.neighbourhood===activeNeighbourhood);
const packageName=a=>a.packageName||`${neighbourhood(a.neighbourhood).name} dining package`;
const anchorVenue=a=>venue(a.anchor||a.restaurants[0]);
const odds=(a,id)=>Number(probability(a,id).toFixed(1));
function photograph(id,caption,css=''){
 const p=DATA.photos.find(p=>p.id===id);if(!p)return '';
 return `<figure class="restaurant-photo ${css}" data-photo="${p.id}"><button class="photo-view" data-view-photo="${p.id}" aria-label="View photograph: ${esc(caption)}"><img src="${p.file}" alt="${esc(caption)}" loading="lazy"><span class="photo-unavailable">Photo unavailable · view source ↗</span></button><figcaption><span>${esc(caption)}</span><button class="photo-credit" data-photo-credits="${p.id}" aria-label="Photo credit for ${esc(caption)}">Credit ↗</button></figcaption></figure>`;
}
function photoCredits(id){const photos=id?DATA.photos.filter(p=>p.id===id):DATA.photos;show(`<div class="modal-label">THE PEOPLE BEHIND THE PICTURES</div><h2 id="dialog-title">Photography credits.</h2><p>Neighbourhood views show the named area; restaurant photographs show the named venue. Independent photographs retain their listed licences. Restaurant and publication images retain their owners’ copyright; sources and storage details are listed below. Photography does not imply a partnership.</p>${photos.map(p=>`<div class="source-record"><strong>${esc(p.title)}</strong><p>${esc(p.author)} · ${esc(p.date)}<br>${esc(p.changes)}</p><div class="source-links"><a href="${p.source}" target="_blank" rel="noopener">Original & attribution ↗</a><a href="${p.licenseUrl}" target="_blank" rel="noopener">${p.license} ↗</a><a href="${p.file}" target="_blank" rel="noopener">Image file ↗</a></div></div>`).join('')}`)}
function viewPhoto(id){const p=DATA.photos.find(p=>p.id===id);if(!p)return;show(`<div class="modal-label">${p.kind==='neighbourhood'?'A FEEL FOR THE NEIGHBOURHOOD':'INSIDE THE EXPERIENCE'}</div><h2 id="dialog-title">${esc(p.caption||p.title)}</h2><img class="photo-lightbox" src="${p.file}" alt="${esc(p.caption||p.description)}"><p class="fine">${esc(p.author)} · ${esc(p.date)}</p><div class="source-links"><a href="${p.source}" target="_blank" rel="noopener">View original source ↗</a><button class="text-button" data-photo-credits="${p.id}">Photo credit & details ↗</button></div>`)}
document.addEventListener('click',e=>{const credit=e.target.closest('[data-photo-credits]'),photo=e.target.closest('[data-view-photo]');if(credit)photoCredits(credit.dataset.photoCredits);else if(photo)viewPhoto(photo.dataset.viewPhoto)});
document.addEventListener('error',e=>{if(e.target.matches?.('.card-image img')){e.target.hidden=true;e.target.parentElement.insertAdjacentHTML('beforeend','<span class="missing-venue-photo">Photo unavailable</span>')}else if(e.target.matches?.('.photo-view img')){e.target.hidden=true;e.target.closest('.photo-view').classList.add('photo-failed')}},true);
function neighbourhoodPictures(n,compact=false){return `<div class="neighbourhood-pictures ${compact?'compact-pictures':''}"><div class="area-picture"><span class="picture-label">THE NEIGHBOURHOOD</span>${photograph(n.areaPhoto,n.areaCaption)}</div><div class="dining-picture"><span class="picture-label">ONE POSSIBLE TABLE</span>${photograph(n.photo,n.photoVenue)}</div></div>`}
$('hero-scenes').innerHTML=photograph('nyhavn-area','Nyhavn · an evening out','hero-scene street-scene')+photograph('bobe-photo','Bobe · Gråbrødretorv','hero-scene dining-scene')+photograph('fiskebar-photo','Kødbyens Fiskebar · a taste of the neighbourhood','hero-scene lane-scene');
$('start').innerHTML=DATA.starts.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
$('neighbourhood-stories').innerHTML=DATA.neighbourhoods.map((n,i)=>`<article class="neighbourhood-story story-${n.id}">${neighbourhoodPictures(n)}<div class="story-copy"><div class="story-index">0${i+1} / ${n.kicker}</div><h3>${n.name}</h3><p class="story-atmosphere">${n.atmosphere}</p><p>${n.description}</p><button class="story-link" data-discover="${n.id}">Find a table in ${n.name} <span>↗</span></button></div></article>`).join('');
document.querySelectorAll('[data-discover]').forEach(b=>b.onclick=()=>{chooseNeighbourhood(b.dataset.discover);enter()});
function chooseNeighbourhood(id){activeNeighbourhood=id;if(!explicitStart&&origin.id){origin={...DATA.starts.find(s=>s.id===id)};$('start').value=origin.id;$('origin-label').textContent=origin.name.replace(' · package centre','');}selectedArea=null;focusedVenue=null;try{sessionStorage.setItem('tablechance-cph-neighbourhood',id)}catch{};renderNeighbourhood();if(map&&!$('experience').hidden)fetchWalks();else{routeFetchedAt=0;render();drawMap()}bounds()}
function renderNeighbourhood(){
 const a=visibleAreas()[0];
 $('map-heading').textContent=neighbourhood(activeNeighbourhood).name;
 $('restaurant-count').textContent=a.restaurants.length+' places';
 document.querySelector('.map-instruction').textContent='One of these '+a.restaurants.length+' restaurants will be yours. Find out 15 minutes before your table.';
}
function renderAreaChoices(){
 const p=plan();document.querySelector('.area-lead').textContent=`${p.guests} people · ${dateLabel(p.date)} · ${p.time}`;
 $('area-choices').innerHTML=DATA.neighbourhoods.map(n=>{const photo=DATA.photos.find(p=>p.id===n.areaPhoto),a=DATA.areas.find(a=>a.neighbourhood===n.id),available=serviceAvailable(a,DATA.restaurants,p,bookings),next=available?null:nextPackageTime(a);
 return `<button class="area-choice" data-neighbourhood="${n.id}" ${!available&&!next?'disabled':''} ${next?`data-suggested-date="${next.date}" data-suggested-time="${next.time}"`:''}><img src="${photo.file}" alt="${esc(n.areaCaption)}"><span><strong>${esc(n.name)}</strong><span class="area-availability">${available?p.time:next?'Next: '+(next.date===p.date?'':dateLabel(next.date)+' · ')+next.time:'No times available'}</span></span><b aria-hidden="true">↗</b></button>`}).join('');
 $('area-choices').querySelectorAll('[data-neighbourhood]').forEach(b=>b.onclick=()=>{if(b.dataset.suggestedTime){$('date').value=b.dataset.suggestedDate;$('time').value=b.dataset.suggestedTime;timeChosen=true;saveJourney()}chooseNeighbourhood(b.dataset.neighbourhood);location.hash='explore'});
}
function nextPackageTime(a){const p=plan();for(let offset=0;offset<=30;offset++){const date=addDays(p.date,offset);for(const time of slots){if(offset===0&&time<p.time)continue;const candidate={...p,date,time};if(serviceAvailable(a,DATA.restaurants,candidate,bookings))return candidate}}return null}

let origin={...DATA.starts[0]},walks={},routeErrors={},loading=false,routeIssue='',supported=true,map,markers,paths,originMarker,selectedArea=null,routeVersion=0,geoVersion=0,routeFetchedAt=0,controller,picking=false,toastTimer;
let areaLayer,tileIssue=false,focusedVenue=null,explicitStart=false;
try{const savedStart=sessionStorage.getItem('tablechance-cph-manual-start'),start=DATA.starts.find(s=>s.id===savedStart);if(start){origin={...start};explicitStart=true}else origin={...DATA.starts.find(s=>s.id===activeNeighbourhood)}}catch{}
$('start').value=origin.id;$('origin-label').textContent=origin.name.replace(' · package centre','');
let bookings=[];try{bookings=validateBookings(JSON.parse(localStorage.getItem('tablechance-cph-v1')||'[]'),DATA)}catch{}
const modal=$('modal');
function show(html){$('modal-body').innerHTML=html;if(!modal.open)modal.showModal();modal.scrollTop=0}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').style.display='block';toastTimer=setTimeout(()=>$('toast').style.display='none',4500)}
function persist(){try{localStorage.setItem('tablechance-cph-v1',JSON.stringify(bookings))}catch{toast('Storage is unavailable. Demo tables will only last until you close this page.')}updateCount()}
function updateCount(){$('count').textContent=bookings.length}updateCount();
$('close-modal').onclick=()=>modal.close();modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}});
const today=copenhagenNow().date;
const slots=['12:30','13:00','13:30','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00'];
$('date').min=today;$('date').max=addDays(today,30);$('date').value=today;
const plan=()=>({date:$('date').value,time:$('time').value,guests:Number($('guests').value)});
let partyChosen=false,timeChosen=false;
if(!slots.some(time=>DATA.areas.some(a=>serviceAvailable(a,DATA.restaurants,{...plan(),time},bookings))))$('date').value=addDays(today,1);
try{const saved=JSON.parse(sessionStorage.getItem('tablechance-cph-journey')||'null');if(saved&&[2,3,4].includes(saved.guests)){$('guests').value=saved.guests;partyChosen=!!saved.partyChosen;if(!planError(saved)){$('date').value=saved.date;$('time').value=saved.time;timeChosen=!!saved.timeChosen}}}catch{}
function saveJourney(){try{sessionStorage.setItem('tablechance-cph-journey',JSON.stringify({...plan(),partyChosen,timeChosen}))}catch{}}
function enter(){location.hash='party'}
function renderTimes(){
  $('time-eyebrow').textContent=`A TABLE FOR ${$('guests').value} · STEP 2 OF 3`;
  $('selected-date').textContent=$('date').validity.valid&&$('date').value?dateLabel($('date').value):'Choose a date';
  $('today-button').classList.toggle('selected',$('date').value===today);$('tomorrow-button').classList.toggle('selected',$('date').value===addDays(today,1));$('other-day').classList.toggle('selected',![$('date').value===today,$('date').value===addDays(today,1)].some(Boolean));
  $('time-options').innerHTML=slots.filter(time=>DATA.areas.some(a=>serviceAvailable(a,DATA.restaurants,{...plan(),time},bookings))).map(time=>`<button data-time="${time}" ${planError({...plan(),time})?'disabled':''} class="${timeChosen&&$('time').value===time?'selected':''}">${time}</button>`).join('');
  document.querySelectorAll('[data-time]').forEach(button=>button.onclick=()=>{const next={...plan(),time:button.dataset.time},error=planError(next);if(error){$('time-error').textContent=error;return}$('time').value=next.time;timeChosen=true;saveJourney();location.hash='areas'});
  $('time-error').textContent=slots.some(time=>DATA.areas.some(a=>serviceAvailable(a,DATA.restaurants,{...plan(),time},bookings)))?'':'No times left for this day. Choose another date.';
}
function page(){
  let step=location.hash.slice(1)||'home';
  const reservationId=step.startsWith('table/')?step.slice(6):null;
  if(reservationId)step='reservation';
  $('reservation-page').hidden=step!=='reservation';
  if(step!=='reservation')disposeReservationMap();
  if(['time','areas','explore'].includes(step)&&!partyChosen){location.replace('#party');return}
  if(['areas','explore'].includes(step)&&(!timeChosen||planError(plan()))){timeChosen=false;saveJourney();location.replace('#time');return}
  $('landing').hidden=step!=='home';$('guest-stories').hidden=step!=='home';$('neighbourhood-journal').hidden=step!=='home';$('party-page').hidden=step!=='party';$('time-page').hidden=step!=='time';$('experience').hidden=step!=='explore';$('area-page').hidden=step!=='areas';
  if(!['home','party','time','areas','explore','reservation'].includes(step)){location.replace('#home');return}
  document.body.dataset.step=step;
  if(step==='reservation')renderReservation(reservationId);
  if(step==='party')document.querySelectorAll('[data-party]').forEach(b=>b.setAttribute('aria-pressed',String(partyChosen&&b.dataset.party===$('guests').value)));
  if(step==='time')renderTimes();
  if(step==='areas')renderAreaChoices();
  if(step==='explore'){renderNeighbourhood();$('party-summary').textContent=`${$('guests').value} people ✎`;$('time-summary').textContent=`${dateLabel($('date').value)} · ${$('time').value} ✎`;initMap();requestAnimationFrame(()=>{map?.invalidateSize();bounds()});if(!routeFetchedAt||Date.now()-routeFetchedAt>ROUTE_TTL){if(!loading)fetchWalks()}else{render();drawMap()}}
  window.scrollTo({top:0,behavior:'instant'});
  const heading=step==='party'?'party-title':step==='time'?'time-title':step==='explore'?'map-heading':step==='areas'?'area-title':null;if(heading)$(heading).focus({preventScroll:true});
}
document.querySelectorAll('[data-party]').forEach(button=>button.onclick=()=>{$('guests').value=button.dataset.party;partyChosen=true;saveJourney();location.hash='time'});
function setDay(date){$('date').value=date;timeChosen=false;saveJourney();renderTimes()}
$('today-button').onclick=()=>setDay(today);$('tomorrow-button').onclick=()=>setDay(addDays(today,1));$('other-day').onclick=()=>{$('date-field').hidden=false;$('date').focus();$('date').showPicker?.()};
$('date').onchange=()=>setDay($('date').value);
$('find-table').onclick=enter;window.addEventListener('hashchange',page);
function bounds(){if(!map)return;const points=[[origin.lat,origin.lng],...visibleAreas().flatMap(a=>a.restaurants.map(id=>[venue(id).lat,venue(id).lng]))];if(areaLayer?.getBounds().isValid()){const b=areaLayer.getBounds();points.push(b.getSouthWest(),b.getNorthEast())}map.fitBounds(points,{paddingTopLeft:[34,55],paddingBottomRight:[34,65],maxZoom:17,animate:false})}
function initMap(){if(map)return;if(!window.L){$('map').innerHTML='<div class="map-fallback">The street map could not load. You can still choose a meeting point and review walking estimates below. Reload to try the map again.</div>';$('pick-map').disabled=true;return}
  $('map').replaceChildren();
  map=L.map('map',{scrollWheelZoom:false,zoomControl:false,zoomAnimation:false,fadeAnimation:false}).setView([55.669064,12.558715],17);
  map.createPane('walkingArea');map.getPane('walkingArea').style.zIndex=350;map.getPane('walkingArea').style.pointerEvents='none';
  const localTiles=false;
  map.getContainer().classList.toggle('shared-map',!localTiles);
  const tileUrl=localTiles?'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png':'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileCredits=(localTiles?'© <a href="https://stadiamaps.com/attribution/">Stadia Maps</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> ':'')+'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">Fix the map</a>';
  const tiles=L.tileLayer(tileUrl,{maxZoom:localTiles?20:19,attribution:tileCredits}).addTo(map);
  L.control.zoom({position:'topright'}).addTo(map);
  let tileErrors=0;tiles.on('tileerror',()=>{if(++tileErrors>=3){tileIssue=true;drawMap()}});tiles.on('load',()=>{tileIssue=[...map.getContainer().querySelectorAll('.leaflet-tile')].some(tile=>!tile.naturalWidth);drawMap()});
  markers=L.layerGroup().addTo(map);paths=L.layerGroup().addTo(map);
  map.on('resize',()=>bounds());
  map.on('moveend',drawMap);
  map.on('click',e=>{if(!picking)return;picking=false;$('pick-map').textContent='Drop a pin ↗';map.getContainer().style.cursor='';geoVersion++;setOrigin({name:'Dropped pin',lat:e.latlng.lat,lng:e.latlng.lng})});drawMap();bounds();
}
function drawAreaCircle(){
  const a=visibleAreas()[0];if(!a)return;
  const members=a.restaurants.map(venue),anchor=anchorVenue(a),centre=L.latLng(anchor.lat,anchor.lng);
  const radius=Math.max(100,...members.map(v=>centre.distanceTo([v.lat,v.lng])+25));
  if(areaLayer){areaLayer.setLatLng(centre);areaLayer.setRadius(radius)}
  else areaLayer=L.circle(centre,{radius,pane:'walkingArea',className:'dining-area-circle',color:'#3886ed',weight:2,opacity:.9,fillColor:'#4596ff',fillOpacity:.13,interactive:false}).addTo(map);
}
function drawMap(){if(!map)return;markers.clearLayers();paths.clearLayers();drawAreaCircle();
  const occupied=[],pinPoints=[map.latLngToContainerPoint([origin.lat,origin.lng])];
  originMarker=L.marker([origin.lat,origin.lng],{icon:L.divIcon({className:'',html:'<div class="origin-pin"></div>',iconSize:[18,18],iconAnchor:[9,9]}),title:`Starting point: ${origin.name}`,zIndexOffset:1000}).addTo(markers).bindTooltip(esc(origin.name),{direction:'bottom',offset:[0,12]});
  for(const a of visibleAreas()){const members=a.restaurants.map(venue),anchor=anchorVenue(a),lat=anchor.lat,lng=anchor.lng;
    members.forEach((v,index)=>{const reachable=walks[v.id]?.seconds<=WALK_LIMIT,featured=v.id===a.featured,isAnchor=v.id===anchor.id;
      // Separate nearby numbered labels while preserving each exact venue location.
      const actual=map.latLngToContainerPoint([v.lat,v.lng]);let display=actual;
      const offsets=[[0,0],... [44,66,88,110].flatMap(r=>Array.from({length:8},(_,i)=>[Math.cos(i*Math.PI/4)*r,Math.sin(i*Math.PI/4)*r]))];
      for(const [x,y] of offsets){const candidate=L.point(actual.x+x,actual.y+y);if(pinPoints.every(p=>candidate.distanceTo(p)>=44)){display=candidate;break}}
      pinPoints.push(display);const dx=display.x-actual.x,dy=display.y-actual.y;
      if(dx||dy){L.polyline([[v.lat,v.lng],map.containerPointToLatLng(display)],{className:'venue-label-connector',color:'#768373',weight:1.5,opacity:.8,interactive:false}).addTo(paths);L.circleMarker([v.lat,v.lng],{radius:3,color:'#fff',weight:1,fillColor:'#526b5c',fillOpacity:1,interactive:false}).addTo(paths)}
      L.marker([v.lat,v.lng],{title:`${index+1}. ${v.name}${featured?' · Spotlight':''}${isAnchor?' · Package centre':''}`,icon:L.divIcon({className:'venue-map-marker',html:`<span data-map-venue="${v.id}" data-anchor="${isAnchor}" class="venue-number ${isAnchor?'anchor-pin':''} ${featured?'spotlight-pin':''} ${reachable?'reachable':''} ${focusedVenue===v.id?'focused':''}">${index+1}${featured?'<b>✦</b>':''}${isAnchor?'<em>Centre</em>':''}</span>`,iconSize:[34,34],iconAnchor:[17-dx,17-dy]}),zIndexOffset:featured?800:600}).addTo(markers).bindTooltip(`${esc(v.name)}${isAnchor?' · Package centre':''}${featured?' · Spotlight':''}${walks[v.id]?' · '+Math.ceil(walks[v.id].seconds/60)+' min walk':''}`,{direction:'top',offset:[dx,dy-16]}).on('click',()=>showVenue(v.id));
    });

  }
  if(selectedArea){const a=DATA.areas.find(a=>a.id===selectedArea);for(const id of (focusedVenue?[focusedVenue]:[])){const w=walks[id];if(!w)continue;const line=w.geometry.map(([lng,lat])=>[lat,lng]);L.polyline(line,{color:'#fff',weight:8,opacity:.9,interactive:false}).addTo(paths);L.polyline(line,{className:'walking-route',color:'#1675ed',weight:4,opacity:w.seconds<=300?1:.35,interactive:false}).addTo(paths);if(w.connectors){const c=w.connectors;for(const pair of [[c[0],c[1]],[c[2],c[3]]])L.polyline(pair.map(([lng,lat])=>[lat,lng]),{color:'#1675ed',weight:2,dashArray:'3 4',interactive:false}).addTo(paths)}}$('map-title').textContent=focusedVenue?venue(focusedVenue).name:a.name;$('map-caption').textContent=focusedVenue?'Your walk from '+origin.name:`Your selected package includes all ${a.restaurants.length} numbered restaurants.`;}
  else{const a=visibleAreas()[0];$('map-title').textContent=`${a.restaurants.length} restaurants. Which will be yours?`;$('map-caption').textContent=`Centred on ${anchorVenue(a).name}. Gold marks the spotlight.`}
  $('walking-area-status').textContent=tileIssue?'Street map unavailable. Walking checks still work.':'Circle shows the dining area · walking times checked separately';
  $('walking-area-status').hidden=!tileIssue;$('map-title').hidden=!focusedVenue;$('map-caption').hidden=!focusedVenue;
}
function selectArea(id){selectedArea=id;focusedVenue=null;drawMap();render();bounds()}
async function fetchWalks(){const version=++routeVersion;controller?.abort();controller=new AbortController();walks={};routeErrors={};routeIssue='';loading=true;routeFetchedAt=0;render();drawMap();
  try{const response=await fetch(`/api/walks?lat=${origin.lat}&lng=${origin.lng}&area=${activeNeighbourhood}`,{signal:controller.signal});if(!response.ok)throw Error('Route service unavailable');const result=await response.json();if(version!==routeVersion)return;walks=result.walks||{};routeErrors=result.errors||{};supported=result.supported!==false;routeFetchedAt=Date.now();}
  catch(error){if(version!==routeVersion)return;if(error.name!=='AbortError'){routeIssue='Walking routes are temporarily unavailable. Retry before booking.';supported=true;}}
  finally{if(version===routeVersion){loading=false;render();drawMap();}}
}
function setOrigin(next){explicitStart=true;origin=next;try{if(next.id&&DATA.starts.some(s=>s.id===next.id))sessionStorage.setItem('tablechance-cph-manual-start',next.id);else sessionStorage.removeItem('tablechance-cph-manual-start')}catch{};if(next.id){activeNeighbourhood=neighbourhood(next.id)?next.id:'kodbyen';try{sessionStorage.setItem('tablechance-cph-neighbourhood',activeNeighbourhood)}catch{}}renderNeighbourhood();selectedArea=null;focusedVenue=null;const match=DATA.starts.find(s=>s.id===origin.id);let custom=$('start').querySelector('[value="custom"]');if(!match){if(!custom){custom=document.createElement('option');custom.value='custom';$('start').appendChild(custom)}custom.textContent=origin.name;$('start').value='custom'}else $('start').value=match.id;$('origin-label').textContent=origin.name.replace(' · package centre','');$('location-status').classList.remove('error');$('location-status').textContent='Your start point is used for walking routes. Precise location is not saved in your reservations.';const refresh=fetchWalks();if(map){if(Math.abs(origin.lat-55.68)>0.03||Math.abs(origin.lng-12.57)>0.03)map.setView([origin.lat,origin.lng],14);else bounds()}return refresh}
$('start').onchange=()=>{const s=DATA.starts.find(s=>s.id===$('start').value);if(s){geoVersion++;setOrigin({...s})}};
$('locate').onclick=()=>{if(!navigator.geolocation){$('location-status').textContent='This browser cannot share location. Choose a meeting point or drop a pin.';return}const version=++geoVersion;$('locate').disabled=true;$('location-status').textContent='Waiting for location permission…';navigator.geolocation.getCurrentPosition(position=>{if(version!==geoVersion){$('locate').disabled=false;return}$('locate').disabled=false;if(position.coords.accuracy>50){$('location-status').textContent='Your location is only accurate to about '+Math.round(position.coords.accuracy)+' m. Choose a meeting point or drop a pin for a reliable short walk.';$('location-status').classList.add('error');return}setOrigin({name:'Your current location',lat:position.coords.latitude,lng:position.coords.longitude})},error=>{if(version!==geoVersion){$('locate').disabled=false;return}$('locate').disabled=false;$('location-status').classList.add('error');$('location-status').textContent=error.code===1?'Location access was declined. Choose a meeting point or drop a pin instead.':'Your location could not be found. Choose a meeting point or drop a pin instead.'},{enableHighAccuracy:true,timeout:12000,maximumAge:0})};
$('pick-map').onclick=()=>{if(!map)return;picking=!picking;$('pick-map').textContent=picking?'Cancel pin placement':'Drop a pin ↗';map.getContainer().style.cursor=picking?'crosshair':'';if(picking){$('location-status').textContent='Tap or click a street on the map to set your starting point. You can also use the meeting-point menu.';$('map').scrollIntoView({behavior:'smooth',block:'center'})}};
$('fit-map').onclick=bounds;
$('search').onsubmit=e=>e.preventDefault();
function renderPackageSummary(){
 const a=visibleAreas()[0],anchor=anchorVenue(a),start=DATA.starts.find(s=>s.id===a.neighbourhood),status=areaStatus(a,DATA.restaurants,walks,plan(),bookings);
 const ready=!loading&&!routeIssue&&supported&&status.eligible;
 const near=a.restaurants.every(id=>walks[id]?.seconds<=WALK_LIMIT);
 const alternative=!loading&&!routeIssue&&!ready?recoveryTime(a):null;
 const reason=loading?'Checking walks…':routeIssue?'Couldn’t check walks.':!supported?'Choose a Copenhagen starting point.':!near?(Object.values(routeErrors).includes('route-unavailable')?'Some walks could not be checked.':'Choose a closer start for a five-minute walk.'):!ready?(alternative?'This package is available at another time.':status.reason):'';
 $('walk-summary').textContent=loading?'Checking walks…':near?'All restaurants within a 5-minute walk':'Walking distance not yet verified';
 $('start-choice').innerHTML=origin.id===start.id?'':`<div class="start-choice"><p>Planning to start in ${esc(neighbourhood(a.neighbourhood).name)}?</p><button id="use-neighbourhood-start" class="outline">Walk from ${esc(anchor.name)}</button></div>`;
 if($('use-neighbourhood-start'))$('use-neighbourhood-start').onclick=()=>{geoVersion++;setOrigin({...start})};
 const canRecover=!!alternative;
 $('package-summary').innerHTML=`${reason?`<div class="booking-status" role="status"><span>${esc(reason)}</span>${routeIssue||Object.values(routeErrors).includes('route-unavailable')?'<button id="retry" class="text-button">Retry ↻</button>':''}</div>`:''}<div class="booking-bar"><div><strong>Enjoy a new food experience</strong><span>Free to book · demo</span></div><button class="primary" data-review="${a.id}" ${ready||canRecover?'':'disabled'}>${canRecover?'Book '+(alternative.date===plan().date?'at ':dateLabel(alternative.date)+' · ')+alternative.time:'Book '+esc(neighbourhood(a.neighbourhood).name)} <span aria-hidden="true">↗</span></button></div>`;
 $('package-summary').querySelector('[data-review]').onclick=()=>{if(alternative){$('date').value=alternative.date;$('time').value=alternative.time;timeChosen=true;saveJourney();page()}review(a.id)};
 if($('retry'))$('retry').onclick=fetchWalks;

}
function recoveryTime(a){
 if(a.restaurants.some(id=>!walks[id]||walks[id].seconds>WALK_LIMIT))return null;
 const p=plan();
 for(let offset=0;offset<8;offset++){const date=addDays(p.date,offset);for(const time of slots){if(offset===0&&time<=p.time)continue;const candidate={...p,date,time};if(areaStatus(a,DATA.restaurants,walks,candidate,bookings).eligible)return candidate}}
 return null;
}
function render(){
 renderPackageSummary();
 const a=visibleAreas()[0];
 $('areas').innerHTML=`<ol class="simple-restaurants">${a.restaurants.map((id,index)=>{
  const v=venue(id),photo=DATA.photos.find(p=>p.id===v.photo),featured=id===a.featured;
  return `<li class="restaurant-card ${featured?'featured-card':''}" data-possibility="${id}"><button class="restaurant-preview" data-venue="${id}" aria-label="View ${esc(v.name)}"><div class="card-image">${photo?`<img src="${photo.file}" alt="${esc(v.name)}" loading="lazy">`:'<span class="missing-venue-photo">Photo coming soon</span>'}<span class="card-number">${index+1}</span>${featured?`<span class="spotlight-badge">Featured</span>`:''}</div><div class="card-body"><h3>${esc(v.name)}</h3><span class="restaurant-arrow" aria-hidden="true">↗</span></div></button></li>`;
 }).join('')}</ol>`;
 document.querySelectorAll('[data-venue]').forEach(b=>b.onclick=()=>showVenue(b.dataset.venue));
}
function links(v){return `<div class="source-links"><a href="${v.website}" target="_blank" rel="noopener">${v.sourceLabel||'Official site & hours'} ↗</a><a href="${v.menu}" target="_blank" rel="noopener">${v.sourceLabel?'Dining details':'Menu'} ↗</a>${v.hoursSource?`<a href="${v.hoursSource}" target="_blank" rel="noopener">Hours source ↗</a>`:''}${v.spotlightSource?`<a href="${v.spotlightSource}" target="_blank" rel="noopener">Spotlight source ↗</a>`:''}</div>`}
function showVenue(id){const v=venue(id),w=walks[id],a=visibleAreas().find(a=>a.restaurants.includes(id));show(`<div class="modal-label">ONE OF ${a?.restaurants.length||'THE'} POSSIBILITIES${a?.featured===id?' · SPOTLIGHT':''}</div><h2 id="dialog-title">${v.name}</h2><p class="venue-context">One possible table in this package · ${a?odds(a,id):0}% demo chance.</p>${v.spotlight?`<p class="spotlight-credential">✦ ${esc(v.spotlight)}</p>`:''}${photograph(v.photo,v.name,'venue-photo')}<p>${v.cuisine}<br>${v.address}</p><div class="review-meta">${w?`${walkLabel(w)} estimated walk from ${esc(origin.name)}`:'No verified walking route from your starting point.'}${w&&w.seconds>300?'<br>Outside your five-minute limit.':''}</div><p>${v.hoursText}</p>${links(v)}<p class="fine">Checked ${DATA.checkedOn}. Meals are paid at the restaurant. The displayed time slots are simulated. No table or partnership has been agreed with this venue.</p>`)}
async function review(id){
 const a=DATA.areas.find(a=>a.id===id),meeting=DATA.starts.find(s=>s.id===a.neighbourhood);
 if(origin.lat!==meeting.lat||origin.lng!==meeting.lng){toast('Checking walks from the package meeting point.');await setOrigin({...meeting});}
 if(Date.now()-routeFetchedAt>ROUTE_TTL){toast('Refreshing walking routes before you book.');await fetchWalks();}
 const p=plan(),status=areaStatus(a,DATA.restaurants,walks,p,bookings);
 if(loading||routeIssue||!status.eligible){toast(status.reason||'Please retry the walking check.');render();return}
 const snapshot={...p,area:id,version:routeVersion,walks:structuredClone(walks)};
 const revealTime=copenhagenNow(new Date(revealInstant(p))).time;
 show(`<h2 id="dialog-title">A surprise in ${esc(neighbourhood(a.neighbourhood).name)}.</h2><p class="confirm-date">${p.guests} people · ${dateLabel(p.date)} · ${p.time}</p><div class="confirm-reveal"><strong>Find out where at ${revealTime}</strong></div><p class="confirmation-perks">Enjoy a new food experience. Pay at the restaurant.</p><details class="package-more"><summary>See the restaurants</summary>${a.restaurants.map(id=>`<div class="review-choice"><strong>${esc(venue(id).name)}</strong><small>${odds(a,id)}% demo chance</small></div>`).join('')}<p>Meeting point: ${esc(anchorVenue(a).address)}. Each restaurant is within an estimated five-minute walk.</p></details><p class="demo-caption">Demo only · no real reservation.</p><button id="confirm-booking" class="primary full">Confirm booking ↗</button>`);

 $('confirm-booking').onclick=()=>{
  if(snapshot.version!==routeVersion||Date.now()-routeFetchedAt>ROUTE_TTL){modal.close();toast('Your walking routes changed. Please review again.');fetchWalks();return}
  const fresh=areaStatus(a,DATA.restaurants,snapshot.walks,snapshot,bookings);if(!fresh.eligible){modal.close();toast(fresh.reason);render();return}
  $('confirm-booking').disabled=true;
  const booking={id:crypto.randomUUID(),area:id,restaurant:null,date:p.date,time:p.time,guests:p.guests,scheduled:true,candidateWalks:Object.fromEntries(a.restaurants.map(id=>[id,{seconds:snapshot.walks[id].seconds,distance:snapshot.walks[id].distance}]))};
  bookings.unshift(booking);persist();render();modal.close();location.hash='table/'+booking.id;
 };
}
let reservationMap=null,reservationId=null,reservationPhase=null,reservationRouteVersion=0;
const avatar=`<div class="guest-avatar"><svg viewBox="0 0 64 80" aria-hidden="true"><ellipse cx="32" cy="72" rx="20" ry="6" fill="#1a4d4630"/><path d="M23 48l-4 20m22-20 4 20" stroke="#253b43" stroke-width="9" stroke-linecap="round"/><path d="M18 35l-7 17m35-17 7 17" stroke="#e9af85" stroke-width="7" stroke-linecap="round"/><path d="M20 29q12-7 24 0l3 24H17z" fill="#ed9b39"/><rect x="27" y="31" width="13" height="19" rx="5" fill="#b76333"/><circle cx="32" cy="18" r="12" fill="#edba92"/><path d="M20 18q-2-18 13-16 15 0 11 18l-6-10-14 5z" fill="#35372e"/><path d="M13 69h11m16 0h11" stroke="#faf8ed" stroke-width="6" stroke-linecap="round"/></svg><span>Meet here</span></div>`;
function disposeReservationMap(){reservationRouteVersion++;if(reservationMap){reservationMap.remove();reservationMap=null}reservationId=null;reservationPhase=null}
function unlockBooking(b){
 if(b.restaurant||!revealDue(b))return b;
 // Reuse a reveal already saved by another tab; do not reroll on refresh.
 try{const saved=validateBookings(JSON.parse(localStorage.getItem('tablechance-cph-v1')||'[]'),DATA).find(x=>x.id===b.id);if(saved?.restaurant){bookings=bookings.map(x=>x.id===b.id?saved:x);return saved}}catch{}
 const a=DATA.areas.find(a=>a.id===b.area),random=new Uint32Array(1);crypto.getRandomValues(random);
 const restaurant=chooseRestaurant(a,random[0]/4294967296),w=b.candidateWalks[restaurant];
 const revealed={id:b.id,area:b.area,restaurant,date:b.date,time:b.time,guests:b.guests,scheduled:true,walkSeconds:w.seconds,walkDistance:w.distance};
 bookings=bookings.map(x=>x.id===b.id?revealed:x);persist();return revealed;
}
function countdownText(ms){const seconds=Math.max(0,Math.ceil(ms/1000));return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':')}
function renderReservation(id){
 let b=bookings.find(b=>b.id===id);disposeReservationMap();
 if(!b){$('reservation-content').innerHTML='<h1 id="reservation-title">No table here yet.</h1><p>This booking may have been cancelled or saved in another browser.</p><a class="primary" href="#party">Book a table ↗</a>';return}
 b=unlockBooking(b);reservationId=id;reservationPhase=b.restaurant?'revealed':'waiting';
 const a=DATA.areas.find(a=>a.id===b.area),n=neighbourhood(a.neighbourhood),anchor=anchorVenue(a),v=b.restaurant?venue(b.restaurant):null;
 const revealTime=copenhagenNow(new Date(revealInstant(b))).time;
 $('reservation-content').innerHTML=`<div class="reservation-layout"><div class="reservation-copy"><div class="adventure-tag">${v?'✦ SURPRISE UNLOCKED':'✦ YOUR COPENHAGEN EVENING'}</div><h1 id="reservation-title" tabindex="-1">${v?esc(v.name):'A little mystery.<br><em>A good evening.</em>'}</h1><p class="reservation-meta">${esc(n.name)} · ${b.guests} people<br>${dateLabel(b.date)} · Table at ${b.time}</p>${v?`<p class="revealed-address">${esc(v.address)}</p><div class="unlocked-note" role="status">${v.id===anchor.id?'Your table is right at the meeting point.':'Your table is revealed. Time to explore.'}</div><a class="primary full" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=${anchor.lat},${anchor.lng}&destination=${v.lat},${v.lng}&travelmode=walking">Open walking directions ↗</a><p class="reservation-fine">${Math.ceil(b.walkSeconds/60)} min estimated walk from the meeting point</p>`:`<div class="countdown-panel"><span>YOUR RESTAURANT REVEALS IN</span><div id="reveal-countdown" role="timer" aria-label="Time until restaurant reveal">${countdownText(revealInstant(b)-Date.now())}</div><div class="countdown-units"><span>hours</span><span>minutes</span><span>seconds</span></div><p>Unlocks at <strong>${revealTime}</strong> · 15 minutes before your table</p></div><p class="waiting-hint">Enjoy the neighbourhood.<br>Your next stop is still a surprise.</p>`}<div class="adventure-steps" aria-label="Booking progress"><span class="complete">✓ Booked</span><i></i><span class="${v?'complete':'current'}">${v?'✓':'2'} Reveal</span><i></i><span>3 Dine</span></div><p class="reservation-fine">${v?'Enjoy a new food experience':'Keep this page open, or return through My tables.'}</p><p class="demo-caption">Demo booking · no real table reserved.</p><button class="text-button" id="cancel-reservation">Cancel demo booking</button></div><div class="adventure-map-wrap"><div class="adventure-map-top"><span>⌖ ${esc(n.name)}</span><span class="map-north" aria-label="North">↑ N</span></div><div id="reservation-map" role="img" aria-label="Street map of ${esc(n.name)} with a character at the meeting point${v?' and your revealed restaurant':''}"></div><div class="adventure-map-caption"><span class="map-stage-icon">${v?'✦':'⌖'}</span><div><strong>${v?'Your next stop is ready':'Your meeting point'}</strong><span>${v?(v.id===anchor.id?'Your restaurant is at the meeting point.':'Follow the route to your table.'):'Explore nearby. The surprise stays hidden.'}</span></div></div><p id="reservation-map-status" class="reservation-map-status" role="status"></p></div></div>`;
 $('cancel-reservation').onclick=()=>{bookings=bookings.filter(x=>x.id!==id);persist();location.hash='home';toast('Demo booking cancelled. No charge was made.')};
 $('reservation-title').focus({preventScroll:true});initReservationMap(b,a,v);
}
async function initReservationMap(b,a,v){
 const anchor=anchorVenue(a),token=++reservationRouteVersion;
 if(!window.L){$('reservation-map-status').textContent='Map unavailable. Meeting point: '+anchor.address;return}
 const m=reservationMap=L.map('reservation-map',{zoomControl:false,scrollWheelZoom:false,dragging:false,touchZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,zoomAnimation:false,fadeAnimation:false,zoomSnap:.25}).setView([anchor.lat,anchor.lng],16);
 const local=false;
 const tiles=L.tileLayer(local?'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png':'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:(local?'© <a href="https://stadiamaps.com/attribution/">Stadia Maps</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> · ':'')+'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m);
 tiles.on('tileerror',()=>{if(token===reservationRouteVersion)$('reservation-map-status').textContent='Map tiles unavailable. Meeting point: '+anchor.address});
 const radius=Math.max(100,...a.restaurants.map(id=>m.distance([anchor.lat,anchor.lng],[venue(id).lat,venue(id).lng])+25));
 const circle=L.circle([anchor.lat,anchor.lng],{radius,className:'adventure-circle',color:'#408d83',weight:2,dashArray:'7 8',fillColor:'#73b7a1',fillOpacity:.13,interactive:false}).addTo(m);
 L.marker([anchor.lat,anchor.lng],{icon:L.divIcon({className:'guest-marker',html:v?.id===anchor.id?avatar.replace('Meet here','Your table ✦'):avatar,iconSize:[64,100],iconAnchor:[32,74]}),interactive:false,zIndexOffset:1000}).addTo(m);
 const fit=()=>{m.invalidateSize();m.fitBounds(circle.getBounds(),{paddingTopLeft:[25,65],paddingBottomRight:[25,100],maxZoom:18,animate:false})};requestAnimationFrame(fit);m.on('resize',()=>m.fitBounds(circle.getBounds(),{paddingTopLeft:[25,65],paddingBottomRight:[25,100],maxZoom:18,animate:false}));
 if(!v)return;
 L.marker([v.lat,v.lng],{icon:L.divIcon({className:'destination-marker',html:'<span>✦</span>',iconSize:[38,38],iconAnchor:[19,19]}),title:v.name}).addTo(m).bindTooltip(esc(v.name));
 try{const response=await fetch(`/api/walks?lat=${anchor.lat}&lng=${anchor.lng}&area=${a.neighbourhood}`);if(!response.ok)throw Error();const result=await response.json();if(token!==reservationRouteVersion)return;const w=result.walks?.[v.id];if(!w)throw Error();L.polyline(w.geometry.map(([lng,lat])=>[lat,lng]),{className:'reservation-route',color:'#267b70',weight:5,opacity:.9}).addTo(m)}catch{if(token===reservationRouteVersion)$('reservation-map-status').textContent='Route preview unavailable. Use Open walking directions.'}
}
function refreshReveal(){
 if($('reservation-page').hidden||!reservationId)return;
 const b=bookings.find(b=>b.id===reservationId);if(!b){renderReservation(reservationId);return}
 if(!b.restaurant&&revealDue(b)){renderReservation(b.id);return}
 if(b.restaurant&&reservationPhase==='waiting'){renderReservation(b.id);return}
 if($('reveal-countdown'))$('reveal-countdown').textContent=countdownText(revealInstant(b)-Date.now());
}
setInterval(refreshReveal,1000);document.addEventListener('visibilitychange',refreshReveal);window.addEventListener('focus',refreshReveal);
function showBookings(){
 const items=bookings.map(b=>unlockBooking(b));
 show(`<div class="modal-label">SAVED IN THIS BROWSER</div><h2 id="dialog-title">Your evenings.</h2>${items.length?items.map(b=>{const a=DATA.areas.find(a=>a.id===b.area);return `<div class="reservation"><strong>${b.restaurant?esc(venue(b.restaurant).name):esc(neighbourhood(a.neighbourhood).name)+' · Surprise table'}</strong><p>${dateLabel(b.date)} · ${b.time} · ${b.guests} people</p><p>${b.restaurant?'Your restaurant is ready to explore.':'Reveals at '+copenhagenNow(new Date(revealInstant(b))).time+' · 15 minutes before your table'}</p><div class="reservation-actions"><button class="primary" data-open-booking="${b.id}">${b.restaurant?'See my table':'View countdown'} ↗</button><button class="text-button" data-cancel="${b.id}">Cancel</button></div></div>`}).join(''):'<p>No tables yet. Your next evening is waiting.</p><button id="browse" class="primary full">Find my table ↗</button>'}<p class="fine">Demo bookings only. No restaurant has been contacted.</p>`);
 document.querySelectorAll('[data-open-booking]').forEach(button=>button.onclick=()=>{modal.close();location.hash='table/'+button.dataset.openBooking;page()});
 document.querySelectorAll('[data-cancel]').forEach(button=>button.onclick=()=>{bookings=bookings.filter(b=>b.id!==button.dataset.cancel);persist();if(reservationId===button.dataset.cancel){location.hash='home'}render();showBookings();toast('Demo booking cancelled. No charge was made.')});
 if($('browse'))$('browse').onclick=()=>{modal.close();enter()};
}
$('bookings').onclick=showBookings;
$('how').onclick=()=>show('<div class="modal-label">A FEW TAPS TO A GOOD EVENING</div><h2 id="dialog-title">People. Time. Place.</h2><ol class="info-list"><li><strong>How many?</strong> Tap your party size.</li><li><strong>When?</strong> Choose a day and time.</li><li><strong>Where?</strong> Pick a neighbourhood package with at least five restaurants. See every restaurant, including a standout spotlight venue.</li><li><strong>Surprise!</strong> Confirm your package. Your restaurant unlocks 15 minutes before your table. Return to the countdown in My tables, then follow the walking directions. Booking is free; you pay for your meal at the restaurant.</li></ol><p class="fine">This is a concept preview. Bookings are simulated. Sample reveal odds are shown before you book. No real reservation is made.</p>');
$('walk-info').onclick=()=>show('<div class="modal-label">YOUR AREA, AT A GLANCE</div><h2 id="dialog-title">A restaurant at the centre.</h2><p>The blue circle is centred exactly on the named anchor restaurant and groups every possible restaurant in your package. The anchor is a walking reference, not a stop you must visit first. It is a visual dining area, not an exact five-minute walking boundary.</p><p>We check an actual pedestrian route from your selected start to every restaurant. Booking is available only when all possibilities are within an estimated five-minute walk and match your chosen time.</p><p>After revealing your table, you can choose “See my short walk” for directions to that restaurant. Hills, steps and crossings may take longer; routes are not verified as step-free.</p><p class="fine">Walking estimates use the greater of the provider time or a 4.32 km/h pace, plus a 20-second buffer. Your starting coordinates are sent to the routing provider and are not stored in bookings. <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener">Routing information ↗</a></p>');
$('sources').onclick=()=>show(`<div class="modal-label">RESEARCHED ${DATA.checkedOn}</div><h2 id="dialog-title">Real places. Traceable details.</h2><p>Details come from official restaurant sites, tourism and heritage listings, and the named directories. Map pins use OpenStreetMap or the linked location source.</p>${DATA.restaurants.map(v=>`<div class="source-record"><strong>${v.name}</strong><p>${v.address}<br>${v.hoursText}</p>${links(v)}<div class="source-links"><a href="${v.osm}" target="_blank" rel="noopener">Map source ↗</a></div></div>`).join('')}<button class="outline" data-photo-credits>Photography credits & licences ↗</button><p class="fine">Actual opening hours can change. seatme service times, inventory and reveal odds are simulated, not restaurant offers.</p>`);
$('partner').onclick=()=>{show('<div class="modal-label">FOR COPENHAGEN RESTAURANTS</div><h2 id="dialog-title">Your spare tables.<br>Someone’s next favourite.</h2><p>The proposed pilot lets you release specific tables and services, welcome nearby guests, and introduce your food to new guests. You stay in control of your capacity.</p><form id="partner-form" class="partner-form"><label>Restaurant name<input name="restaurant" maxlength="100" required placeholder="Your restaurant"></label><label>Work email<input name="email" type="email" required placeholder="you@restaurant.com"></label><button class="primary full">Preview partnership request ↗</button></form><p class="fine">Preview only. Your details are not sent or saved. No featured restaurant is a confirmed partner.</p>');$('partner-form').onsubmit=e=>{e.preventDefault();show('<div class="reveal-icon">✳</div><h2 id="dialog-title">A place for your restaurant.</h2><p>Your demo request is complete. A live pilot would next agree services, inventory and cancellation terms with you.</p><p class="fine">No details have been sent or saved.</p>')}};
window.addEventListener('storage',e=>{if(e.key==='tablechance-cph-v1'){try{bookings=validateBookings(JSON.parse(e.newValue||'[]'),DATA);updateCount();render();refreshReveal()}catch{}}});
renderNeighbourhood();page();$('find-table').disabled=false;
