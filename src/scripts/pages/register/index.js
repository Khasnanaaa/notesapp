import StoryApi from '../../data/story-api';

const Register = {
  async render() {
    return `
      <section class="container" style="view-transition-name: auth-form;">
        <h1>Daftar Akun Baru</h1>
        <form id="registerForm">
          <div class="form-group">
            <label for="registerName">Nama</label>
            <input type="text" id="registerName" required>
          </div>
          <div class="form-group">
            <label for="registerEmail">Email</label>
            <input type="email" id="registerEmail" required>
          </div>
          <div class="form-group">
            <label for="registerPassword">Password</label>
            <input type="password" id="registerPassword" required minlength="6">
          </div>
          <p id="message-status" style="color: red; margin-bottom: 15px;"></p>
          <button type="submit">Daftar</button>
          <p style="margin-top: 15px; text-align: center;">Sudah punya akun? <a href="#/login">Login di sini</a></p>
        </form>
      </section>
    `;
  },

  async afterRender() {
    const form = document.getElementById('registerForm');
    const messageStatus = document.getElementById('message-status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageStatus.textContent = '';
      
      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;

      try {
        messageStatus.textContent = 'Mendaftarkan akun...';
        
        const response = await fetch('https://story-api.dicoding.dev/v1/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        
        const responseJson = await response.json();
        
        if (!response.ok) {
            throw new Error(responseJson.message || 'Pendaftaran gagal (status HTTP bukan 2xx).');
        }

        if (responseJson.error) {
            throw new Error(responseJson.message);
        }

        alert('Pendaftaran berhasil! Silakan login.');
        window.location.hash = '#/login'; 
      } catch (error) {
        messageStatus.textContent = `Pendaftaran Gagal: ${error.message}`;
        console.error('Pendaftaran Gagal Catch Block:', error);
      }
    });
  },
};

export default Register;