import IndexedDBUtils from '../../utils/indexeddb-utils';

const Favorites = {
  async render() {
    return `
      <section class="container">
        <h1>Cerita Favorit (Offline Ready)</h1>
        <div id="favorites-list" class="story-grid">
          <p style="text-align: center;">Memuat data favorit...</p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    if (!localStorage.getItem('userToken')) {
        window.location.hash = '#/login';
        return;
    }
    
    const listContainer = document.getElementById('favorites-list');
    
    try {
        const stories = await IndexedDBUtils.getAllFavorites(); // Kriteria 4 Read
        
        if (stories.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">Anda belum menambahkan cerita ke favorit.</p>';
            return;
        }

        let listHtml = '';
        stories.forEach(story => {
            // Tampilkan di Daftar (menggunakan struktur yang sama dengan Home)
            listHtml += `
                <div class="story-item">
                    <img src="${story.photoUrl}" alt="Lokasi cerita oleh ${story.name}" class="story-image">
                    <h3>${story.name}</h3>
                    <p class="description">${story.description.substring(0, 100)}...</p>
                    <small>Tanggal Disimpan: ${new Date().toLocaleDateString('id-ID')}</small>
                    
                    <!-- Button Delete (Kriteria 4 Delete) -->
                    <button class="delete-favorite-btn" data-id="${story.id}" style="background-color: #dc3545; color: white; padding: 10px; border: none; width: 100%;">
                        Hapus dari Favorit (🗑️)
                    </button>
                </div>
            `;
        });

        listContainer.innerHTML = listHtml;
        
        // --- Event Listener untuk Hapus Favorit ---
        document.querySelectorAll('.delete-favorite-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const storyId = e.target.dataset.id;
                
                try {
                    await IndexedDBUtils.deleteFavorite(storyId); // Kriteria 4 Delete
                    alert('Cerita dihapus dari favorit.');
                    // Render ulang halaman
                    window.location.reload(); 
                } catch (error) {
                    console.error('Failed to delete favorite:', error);
                    alert('Gagal menghapus favorit.');
                }
            });
        });

    } catch (error) {
        listContainer.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat favorit: ${error.message}</p>`;
    }
  },
};

export default Favorites;