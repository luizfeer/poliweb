import Dexie from 'dexie';

export const db = new Dexie('myDatabase');
db.version(1).stores({
  cart: '++id, [ad+idProd], link, label, category, value, name, quantity'
})


