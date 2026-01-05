import StoryApi from '../../data/story-api';
import app from '../../index'; 

const Login = {
  async render() {
    // Kriteria 4 Basic: HTML Semantik dan Label
    return `
      <section class="container" style="view-transition-name: auth-form;">
        <h1>Login ke StoryApp</h1>
        <form id="loginForm">
          <div class="form-group">
            <label for="loginEmail">Email</label>
            <input type="email" id="loginEmail" required>
          </div>
          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input type="password" id="loginPassword" required minlength="6">
          </div>
          <p id="message-status" style="color: red; margin-bottom: 15px;"></p>
          <button type="submit">Login</button>
          <p style="margin-top: 15px; text-align: center;">Belum punya akun? <a href="#/register">Daftar di sini</a></p>
        </form>
      </section>
    `;
  },

  async afterRender() {
    const form = document.getElementById('loginForm');
    const messageStatus = document.getElementById('message-status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageStatus.textContent = '';
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        messageStatus.textContent = 'Logging in...';
        await StoryApi.login({ email, password });
        
        alert('Login berhasil! Selamat datang.'); 
        app.updateNavVisibility(); 
        
        window.location.hash = '#/'; 
      } catch (error) {
        messageStatus.textContent = `Login Gagal: ${error.message}`;
        console.error('Login Error:', error); 
      }
    });
  },
};

export default Login;