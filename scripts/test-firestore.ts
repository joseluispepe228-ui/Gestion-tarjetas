import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

async function test() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);
  console.log('Using db:', config.firestoreDatabaseId);
  for (const col of ['cards', 'responsibles', 'purchases', 'statements', 'adminFees', 'newPurchases']) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(col, 'count:', snap.size);
      snap.forEach(d => console.log('  -', col, d.id, JSON.stringify(d.data()).slice(0, 100)));
    } catch(e: any) {
      console.error('Error on', col, e.message);
    }
  }
  process.exit(0);
}
test();
