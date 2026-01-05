import { openDB } from 'idb';

const DATABASE_NAME = 'storyapp-db';
const DATABASE_VERSION = 2; // Naikkan versi karena ada object store baru
const OBJECT_STORE_NAME = 'favorite-stories';
const STORIES_STORE_NAME = 'stories'; // Store baru untuk cache feed

// Membuat atau membuka database
const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    // Membuat Object Store untuk menyimpan cerita favorit (Kriteria 4 Create)
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
    }
    // Store untuk cache offline (Fitur Offline)
    if (!database.objectStoreNames.contains(STORIES_STORE_NAME)) {
        database.createObjectStore(STORIES_STORE_NAME, { keyPath: 'id' });
    }
  },
});

const IndexedDBUtils = {
  // Ambil semua cerita favorit (Kriteria 4 Read)
  async getAllFavorites() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  // Ambil satu cerita favorit berdasarkan ID
  async getFavorite(id) {
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

  // Tambahkan cerita ke favorit (Kriteria 4 Create)
  async putFavorite(story) {
    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },

  // Hapus cerita dari favorit (Kriteria 4 Delete)
  async deleteFavorite(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },

  // === Cache Stories Methods ===
  async putStories(stories) {
    const db = await dbPromise;
    const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORIES_STORE_NAME);
    // Kita bisa clear dulu biar tidak numpuk sampah lama?
    // store.clear(); 
    // Tapi sebaiknya replace/update saja
    stories.forEach((story) => {
        store.put(story);
    });
    return tx.done;
  },

  async getAllCachedStories() {
    return (await dbPromise).getAll(STORIES_STORE_NAME);
  },
};

export default IndexedDBUtils;