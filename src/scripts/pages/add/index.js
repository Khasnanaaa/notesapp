import L from 'leaflet'; 
import StoryApi from '../../data/story-api';
import 'leaflet/dist/leaflet.css'; 

// Perbaikan wajib agar ikon marker Leaflet muncul dengan benar saat di-build/deploy
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const AddStory = {
  // Properti untuk menyimpan data state (sesuai gaya kode yang Anda inginkan)
  selectedLocation: { lat: null, lon: null }, 
  map: null,
  marker: null,

  async render() {
    return `
      <section class="container mt-4 mb-5" style="view-transition-name: page-header;">
        <h1>Bagikan Cerita Lokasi Baru</h1>
        <form id="addStoryForm">
          
          <div class="form-group mb-3">
            <label for="description" class="form-label fw-bold">Deskripsi Cerita</label>
            <textarea id="description" class="form-control" required rows="5" placeholder="Tuliskan pengalaman menarikmu..."></textarea>
          </div>

          <div class="form-group mb-3">
            <label for="photoFile" class="form-label fw-bold">Unggah Foto</label>
            <input type="file" id="photoFile" class="form-control" required accept="image/*">
          </div>
          
          <h2 class="mt-4">Pilih Lokasi</h2>
          <p class="text-muted mb-2">Penting: Klik pada peta di bawah ini untuk menentukan lokasi cerita Anda.</p>
          
          <!-- Kontainer Peta Digital -->
          <div id="add-map" style="height: 400px; width: 100%; border-radius: 8px; border: 1px solid #ccc; z-index: 1;"></div> 
          
          <!-- Status koordinat yang akan berubah otomatis saat peta diklik -->
          <p id="location-status" class="mt-2 fw-bold text-secondary">Lokasi: Belum dipilih (Klik peta)</p>

          <p id="message-status" style="color: red; margin-bottom: 15px; margin-top: 15px;"></p>
          
          <button type="submit" class="btn btn-primary w-100 py-2" id="btnSubmit">Unggah Cerita Sekarang</button>
        </form>
      </section>
    `;
  },

  async afterRender() {
    // 1. Proteksi Halaman (Hanya untuk user yang sudah login)
    if (!localStorage.getItem('userToken')) {
        window.location.hash = '#/login';
        return;
    }
    
    const locationStatus = document.getElementById('location-status');
    const messageStatus = document.getElementById('message-status');
    const form = document.getElementById('addStoryForm');
    const btnSubmit = document.getElementById('btnSubmit');

    // 2. Inisialisasi Peta (Kriteria 1)
    // Fokus awal di koordinat tengah Indonesia
    this.map = L.map('add-map').setView([-2.5489, 118.0149], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // 3. LOGIKA UTAMA: Event Click Peta (Kriteria Wajib Reviewer)
    // Mengambil koordinat secara otomatis saat user melakukan klik di peta
    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      // Simpan koordinat ke dalam state objek
      this.selectedLocation.lat = lat;
      this.selectedLocation.lon = lng;

      // Update UI untuk memberitahu user koordinat telah terpilih
      locationStatus.textContent = `Lokasi Terpilih: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      locationStatus.className = 'mt-2 fw-bold text-success';

      // Menampilkan atau memindahkan marker posisi
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map);
      }

      // Animasi peta bergeser ke titik yang diklik
      this.map.panTo(e.latlng);
    });

    // 4. Logika Pengiriman Data (Submit Form)
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageStatus.textContent = '';
      
      const description = document.getElementById('description').value;
      const photoFile = document.getElementById('photoFile').files[0];

      // Validasi: Harus pilih lokasi di peta dulu
      if (!this.selectedLocation.lat || !this.selectedLocation.lon) {
        messageStatus.textContent = 'Gagal: Mohon klik pada peta untuk menentukan lokasi cerita.';
        messageStatus.style.color = 'red';
        return;
      }

      if (!photoFile) {
        messageStatus.textContent = 'Gagal: Mohon unggah file foto.';
        return;
      }
      
      try {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Sedang Mengunggah...';
        messageStatus.style.color = 'blue';
        messageStatus.textContent = 'Menghubungkan ke API Dicoding...';
        
        // Kirim ke StoryApi (Sudah termasuk lat dan lon dari klik peta)
        await StoryApi.addNewStory({
          description: description,
          lat: this.selectedLocation.lat,
          lon: this.selectedLocation.lon,
          photo: photoFile, 
        });

        alert('Selamat! Cerita berhasil diunggah dengan koordinat lokasi.');
        window.location.hash = '#/'; 
      } catch (error) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Unggah Cerita Sekarang';
        messageStatus.style.color = 'red';
        messageStatus.textContent = `Gagal: ${error.message}`;
      }
    });
  },
};

export default AddStory;