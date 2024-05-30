const btnSignIn = document.getElementById("Sign-in"),
      btnSignUp = document.getElementById("Sign-Up"),
      formRegister = document.querySelector(".register"),
      formLogin = document.querySelector(".login");

btnSignIn.addEventListener("click", e => {
    formRegister.classList.add("hide");
    formLogin.classList.remove("hide");
});

btnSignUp.addEventListener("click", e => {
    formLogin.classList.add("hide");
    formRegister.classList.remove("hide");
});

document.addEventListener('DOMContentLoaded', function() {
    fetch('/categories')
      .then(response => response.json())
      .then(categories => {
        const container = document.getElementById('categories-container');
        container.innerHTML = ''; // Limpiar categorías existentes
        categories.forEach(category => {
          const categoryLink = document.createElement('a');
          categoryLink.href = `${category.NOMBRE_CATEGORIA.toLowerCase()}.html`;
          
          const categoryDiv = document.createElement('div');
          categoryDiv.className = `card-category category-${category.NOMBRE_CATEGORIA.toLowerCase()}`;
          categoryDiv.innerHTML = `<p>${category.NOMBRE_CATEGORIA}</p>`;
          
          categoryLink.appendChild(categoryDiv);
          container.appendChild(categoryLink);
        });
      })
      .catch(error => console.error('Error al obtener las categorías:', error));
  });
  