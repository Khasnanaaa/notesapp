import L from "leaflet";
import StoryApi from "../../data/story-api";
import IndexedDBUtils from "../../utils/indexeddb-utils";
import "leaflet/dist/leaflet.css";

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
        
        <!-- Search Bar (Optional Feature) -->
        <div class="search-container" style="text-align: center; margin-bottom: 20px;">
            <label for="search-input" class="visually-hidden">Cari cerita (nama/deskripsi)</label>
            <input type="text" id="search-input" placeholder="Cari cerita (nama/deskripsi)..." style="padding: 10px; width: 80%; max-width: 400px; border-radius: 4px; border: 1px solid #ccc;">
        </div>

        <!-- Kontainer Daftar Cerita -->
        <div id="stories-list" class="story-grid">
          <p style="text-align: center;">Memuat data...</p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    if (!localStorage.getItem("userToken")) {
      window.location.hash = "#/login";
      return;
    }

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    let stories = [];
    let favoritedStories = [];

    // Helper: Render List
    const renderList = (data) => {
      const listContainer = document.getElementById("stories-list");
      listContainer.innerHTML = "";

      if (data.length === 0) {
        listContainer.innerHTML =
          '<p style="text-align: center;">Tidak ada cerita ditemukan.</p>';
        return;
      }

      let listHtml = "";
      data.forEach((story) => {
        const isFavorited = favoritedStories.some((fav) => fav.id === story.id);
        const favoriteIcon = isFavorited ? "❤️" : "🤍";

        listHtml += `
              <div class="story-item">
                <a href="#/stories/${
                  story.id
                }" style="text-decoration: none; color: inherit;">
                    <img src="${story.photoUrl}" alt="Lokasi cerita oleh ${
          story.name
        }" class="story-image">
                    <h3>${story.name}</h3>
                </a>
                <p class="description">${story.description.substring(
                  0,
                  100
                )}...</p>
                <small>Tanggal: ${new Date(story.createdAt).toLocaleDateString(
                  "id-ID"
                )}</small>
                
                <button class="favorite-btn" data-id="${
                  story.id
                }" data-favorited="${isFavorited}" data-story='${JSON.stringify(
          story
        )}'>
                    ${favoriteIcon} ${
          isFavorited ? "Hapus Favorit" : "Tambahkan Favorit"
        }
                </button>
              </div>
            `;
      });
      listContainer.innerHTML = listHtml;

      // Re-attach listeners
      document.querySelectorAll(".favorite-btn").forEach((button) => {
        button.addEventListener("click", async (e) => {
          const storyId = e.target.dataset.id;
          const isFavorited = e.target.dataset.favorited === "true";
          const storyData = JSON.parse(e.target.dataset.story);

          try {
            if (isFavorited) {
              await IndexedDBUtils.deleteFavorite(storyId);
              e.target.dataset.favorited = "false";
              e.target.innerHTML = "🤍 Tambahkan Favorit";
              // Update local favorite cache
              favoritedStories = favoritedStories.filter(
                (f) => f.id !== storyId
              );
              alert("Cerita dihapus dari favorit.");
            } else {
              await IndexedDBUtils.putFavorite(storyData);
              e.target.dataset.favorited = "true";
              e.target.innerHTML = "❤️ Hapus Favorit";
              favoritedStories.push(storyData);
              alert("Cerita ditambahkan ke favorit.");
            }
          } catch (error) {
            console.error("Failed to update favorite:", error);
            alert("Gagal memperbarui favorit.");
          }
        });
      });
    };

    try {
      stories = await StoryApi.getAllStories();
      IndexedDBUtils.putStories(stories);
    } catch (error) {
      console.log("Offline: Mengambil dari cache...", error);
      stories = await IndexedDBUtils.getAllCachedStories();
      if (stories.length > 0) {
        document.querySelector("h1").innerHTML +=
          ' <span style="font-size: 0.5em; background: orange; padding: 2px 5px; border-radius: 4px; color: white;">Offline Mode</span>';
      } else {
        throw error;
      }
    }

    try {
      favoritedStories = await IndexedDBUtils.getAllFavorites();

      const map = L.map("story-map").setView([-0.7893, 113.9213], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Render Initial List
      renderList(stories);

      // Setup Search Listener
      const searchInput = document.getElementById("search-input");
      searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = stories.filter(
          (story) =>
            story.name.toLowerCase().includes(keyword) ||
            story.description.toLowerCase().includes(keyword)
        );
        renderList(filtered);
      });

      stories.forEach((story) => {
        if (story.lat && story.lon) {
          L.marker([story.lat, story.lon]).addTo(map).bindPopup(`
                <b>${story.name}</b><br>
                <p>${story.description.substring(0, 80)}...</p>
              `);
        }
      });

      if (stories.length > 0) {
        map.setView([stories[0].lat, stories[0].lon], 10);
      }
      map.invalidateSize();
    } catch (error) {
      console.error("Error rendering stories:", error);
      document.getElementById(
        "stories-list"
      ).innerHTML = `<p style="color: red;">Gagal memuat cerita. Anda mungkin sedang offline dan belum ada data tersimpan.</p>`;
    }
  },
};

export default Home;
