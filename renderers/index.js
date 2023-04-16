document.querySelector('#sign-out-button').addEventListener('click', async (event) => {
    console.log('Signing out...')
    await window.authAPI.signOut();
    window.location.href = "login.html";
});