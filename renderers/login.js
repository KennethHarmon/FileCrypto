document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#loginName').value;
    const password = document.querySelector('#loginPassword').value;
    await window.authAPI.signIn(email, password)
    .then((result) => {
        console.log('Sucesffuly signed in');
        console.log(result);
    })
    .catch((error) => {
        console.error(error);
    })
})