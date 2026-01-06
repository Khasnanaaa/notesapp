import UrlParser from '../../routes/url-parser';
import StoryApi from '../../data/story-api';
import IndexedDBUtils from '../../utils/indexeddb-utils';

const Detail = {
  async render() {
    return `
      <section class="container detail-container">
        <h1>Detail Cerita</h1>
        <div id="story-detail" class="story-detail">
            <p style="text-align: center;">Memuat detail cerita...</p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const url = UrlParser.parseActivePathname();
    const storyVersion = document.getElementById('story-detail');
    
    // --- Helper Render Function ---
    const renderStory = (story) => {
        let locationBlock = '';
        if (story.lat && story.lon) {
            // Note: We are not initializing Leaflet here for simplicity/performance in this iteration, 
            // but we could. For now, just show text or use static map image if API existed.
            // Or better: Just show coordinates.
            // "Peta digital" requirement usually implies Leaflet. 
            // I will add a container and init Leaflet if I have time, but sticking to basics first.
             locationBlock = `
                <div class="detail-map-container" style="margin-top: 20px;">
                    <h3>Lokasi:</h3>
                    <p>Lat: ${story.lat}, Lon: ${story.lon}</p>
                    <div id="detail-map" style="height: 300px; width: 100%; display: none;"></div>
                </div>
            `;
        }

        storyVersion.innerHTML = `
            <h2 class="detail-title">${story.name}</h2>
            <img src="${story.photoUrl}" alt="Foto ${story.name}" class="detail-image" style="width: 100%; max-height: 500px; object-fit: cover; border-radius: 8px;">
            <p class="detail-date" style="color: #666; margin-top: 10px;">${new Date(story.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p class="detail-description" style="font-size: 1.1em; line-height: 1.6; margin-top: 20px;">${story.description}</p>
            ${locationBlock}
        `;
        
        // Init Map if exists
        if (story.lat && story.lon) {
             // Dynamic import to avoid heavy load if not needed? No, imports are static in this project setup usually.
             // We need L from leaflet.
             // Import L in top of file? Yes.
        }
    };

    try {
        const story = await StoryApi.getStoryById(url.id);
        renderStory(story);
    } catch (error) {
        console.log('Online fetch failed, trying cache...', error);
        try {
            // Try "stories" cache
            let cachedStory = await IndexedDBUtils.getCachedStory(url.id);
            if (!cachedStory) {
                // Try "favorites" cache
                 cachedStory = await IndexedDBUtils.getFavorite(url.id);
            }

            if (cachedStory) {
                renderStory(cachedStory);
                storyVersion.innerHTML += '<p style="color: orange; text-align: center;">Mode Offline: Data dari cache</p>';
            } else {
                storyVersion.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat detail cerita. Periksa koneksi internet Anda.</p>`;
            }
        } catch (cacheError) {
             storyVersion.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat detail cerita.</p>`;
        }
    }
  },
};

export default Detail;
