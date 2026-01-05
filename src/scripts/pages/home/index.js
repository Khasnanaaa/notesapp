import L from 'leaflet'; 
import StoryApi from '../../data/story-api';
import IndexedDBUtils from '../../utils/indexeddb-utils'; 
import 'leaflet/dist/leaflet.css'; 

const Home = {
  async render() {
    return `
      <section class="container">
        <h1 style="view-transition-name: page-header;">Cerita Lokasi Terbaru</h1>
        
        <!-- Push Notification Tools (Button) -->
        <div id="push-notification-tools" class="push-tools-wrapper" style="text-align: center; margin-bottom: 20px;">
        </div>
        
        <!-- Kontainer Peta -->
        <div id="story-map" style="height: 500px; width: 100%;"></div> 
        
        <h2>Daftar Cerita</h2>
        
        <!-- Kontainer Daftar Cerita -->
        <div id="stories-list" class="story-grid">
          <p style="text-align: center;">Memuat data...</p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    if (!localStorage.getItem('userToken')) {
        window.location.hash = '#/login';
        return;
    }
    
    delete L.Icon.Default.prototype._getIconUrl; 
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    let stories = [];
    try {
      // 1. Coba ambil dari Network
      stories = await StoryApi.getAllStories();
      
      // 2. Jika berhasil, simpan ke cache (Offline Feature)
      IndexedDBUtils.putStories(stories); 
      
    } catch (error) {
       console.log('Offline: Mengambil dari cache...', error);
       // 3. Jika gagal (misal offline), ambil dari cache
       stories = await IndexedDBUtils.getAllCachedStories();
       
       if (stories.length > 0) {
          // Tampilkan indikator offline
          document.querySelector('h1').innerHTML += ' <span style="font-size: 0.5em; background: orange; padding: 2px 5px; border-radius: 4px; color: white;">Offline Mode</span>';
       } else {
           throw error; // Jika cache kosong juga, lempar error agar ditangkap di bawah
       }
    }

    try {
      // Logic render tetap sama
      const favoritedStories = await IndexedDBUtils.getAllFavorites(); 
      
      const map = L.map('story-map').setView([-0.7893, 113.9213], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const listContainer = document.getElementById('stories-list');
      listContainer.innerHTML = ''; 
      let listHtml = '';
      
      stories.forEach(story => {
        const isFavorited = favoritedStories.some(fav => fav.id === story.id);
        const favoriteIcon = isFavorited ? '❤️' : '🤍'; 
        
        if (story.lat && story.lon) {
            L.marker([story.lat, story.lon])
              .addTo(map)
              .bindPopup(`
                <b>${story.name}</b><br>
                <p>${story.description.substring(0, 80)}...</p>
                <small>${new Date(story.createdAt).toLocaleDateString('id-ID')}</small>
              `);
        }
        
        listHtml += `
          <div class="story-item">
            <img src="${story.photoUrl}" alt="Lokasi cerita oleh ${story.name}" class="story-image">
            <h3>${story.name}</h3>
            <p class="description">${story.description.substring(0, 100)}...</p>
            <small>Tanggal: ${new Date(story.createdAt).toLocaleDateString('id-ID')}</small>
            
            <!-- Button Favorite (Kriteria 4 Create/Delete) -->
            <button class="favorite-btn" data-id="${story.id}" data-favorited="${isFavorited}" data-story='${JSON.stringify(story)}'>
                ${favoriteIcon} ${isFavorited ? 'Hapus Favorit' : 'Tambahkan Favorit'}
            </button>
          </div>
        `;
      });
      
      listContainer.innerHTML = listHtml;
      
      if (stories.length > 0) {
          map.setView([stories[0].lat, stories[0].lon], 10);
      }

      map.invalidateSize(); 

      // Event listener favorite
      document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const storyId = e.target.dataset.id;
            const isFavorited = e.target.dataset.favorited === 'true';
            const storyData = JSON.parse(e.target.dataset.story);
            
            try {
                if (isFavorited) {
                    await IndexedDBUtils.deleteFavorite(storyId);
                    e.target.dataset.favorited = 'false';
                    e.target.innerHTML = '🤍 Tambahkan Favorit';
                    alert('Cerita dihapus dari favorit.');
                } else {
                    await IndexedDBUtils.putFavorite(storyData);
                    e.target.dataset.favorited = 'true';
                    e.target.innerHTML = '❤️ Hapus Favorit';
                    alert('Cerita ditambahkan ke favorit.');
                }
            } catch (error) {
                console.error('Failed to update favorite:', error);
                alert('Gagal memperbarui favorit.');
            }
        });
      });

    } catch (error) {
      console.error('Error rendering stories:', error);
      document.getElementById('stories-list').innerHTML = `<p style="color: red;">Gagal memuat cerita. Anda mungkin sedang offline dan belum ada data tersimpan.</p>`;
    }
  },
};

export default Home;