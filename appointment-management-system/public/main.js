// tiny helper for posting QR payloads for checkin (demo)
async function checkinQR(data){
  const res = await fetch('/checkin/qr', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data})});
  const j = await res.json();
  console.log(j);
  alert('Check-in result: '+ (j.ok? 'OK':'ERROR'));
}
