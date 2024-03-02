document.addEventListener('DOMContentLoaded', function () {

    const logoutBtn = document.getElementById('logout_btn')

    logoutBtn.addEventListener('click', async function () {
        console.log('clic')
        try {
            const response = await fetch('/api/sessions/logout', {
                method: 'POST'
            })
            if (response.ok) {
                console.log('Logout exitoso')
                window.location.href = '/'
            } else {
                console.error('Error en el logout:', response.status);
                alert('Error en el logout. Inténtalo de nuevo más tarde.')
            }
        } catch (error) {
            console.error('Error en el logout:', error)
            alert('Error en el logout. Inténtalo de nuevo más tarde.')
        }
    })

})
