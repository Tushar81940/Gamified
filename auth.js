(function(){
  const KEY_USER = 'gamified-user-v1';
  function saveUser(user){ try{ localStorage.setItem(KEY_USER, JSON.stringify(user)); }catch{} }
  function getUser(){ try{ return JSON.parse(localStorage.getItem(KEY_USER)||'null'); }catch{return null;} }
  function clearUser(){ try{ localStorage.removeItem(KEY_USER); }catch{} }

  function requireFields(obj, fields){
    for (const f of fields){ if(!obj[f] || String(obj[f]).trim()==='') return `Missing ${f}`; }
    return null;
  }

  window.Auth = {
    current: getUser,
    signup: function({name, email, password}){
      const err = requireFields({name,email,password}, ['name','email','password']);
      if (err) throw new Error(err);
      const user = { name: String(name).trim(), email: String(email).trim().toLowerCase() };
      saveUser(user);
      return user;
    },
    login: function({email}){
      const err = requireFields({email}, ['email']);
      if (err) throw new Error(err);
      const existing = getUser();
      if (!existing || existing.email !== String(email).trim().toLowerCase()) throw new Error('Account not found. Please sign up.');
      return existing;
    },
    logout: function(){ clearUser(); },
  };

  // Header helper
  function renderHeaderAuth(){
    document.querySelectorAll('.header-auth').forEach((nav)=>{
      const user = getUser();
      if (user){
        nav.innerHTML = `<span class="muted">Hi, ${user.name}</span><button class="cart-button" id="logoutBtn" type="button">Logout</button>`;
        nav.querySelector('#logoutBtn')?.addEventListener('click', ()=>{ clearUser(); window.location.href = 'index.html'; });
      } else {
        nav.innerHTML = `<a class="back-link" href="login.html">Login</a><a class="back-link" href="signup.html">Sign Up</a>`;
      }
    });
  }
  document.addEventListener('DOMContentLoaded', renderHeaderAuth);
})();


