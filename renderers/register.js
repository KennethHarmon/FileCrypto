document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#registerEmail').value;
    const password = document.querySelector('#registerPassword').value;
    await window.authAPI.signUp(email, password)
    .then((result) => {
        console.log('Sucesffuly signed up');
        console.log(result);
    })
    .catch((error) => {
        console.error(error);
    })
})