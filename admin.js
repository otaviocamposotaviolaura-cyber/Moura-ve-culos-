
const loginSection =
  document.getElementById("loginSection");

const dashboardSection =
  document.getElementById("dashboardSection");

const loginForm =
  document.getElementById("loginForm");

const loginMessage =
  document.getElementById("loginMessage");

const logoutButton =
  document.getElementById("logoutButton");

const carForm =
  document.getElementById("carForm");

const adminCars =
  document.getElementById("adminCars");

const formMessage =
  document.getElementById("formMessage");

const cancelEdit =
  document.getElementById("cancelEdit");

const imageInput =
  document.getElementById("images");

const imagePreview =
  document.getElementById("imagePreview");

const carId =
  document.getElementById("carId");

const formTitle =
  document.getElementById("formTitle");


let currentImages = [];

let isLoggingOut = false;


/* =========================================
   NORMALIZAR IMAGENS
========================================= */

function normalizeImages(value) {

  if (Array.isArray(value)) {

    return value.filter(
      image =>
        typeof image === "string" &&
        image.trim() !== ""
    );

  }


  if (typeof value === "string") {

    try {

      const parsed =
        JSON.parse(value);


      if (Array.isArray(parsed)) {

        return parsed.filter(
          image =>
            typeof image === "string" &&
            image.trim() !== ""
        );

      }

    } catch (error) {

      if (value.trim() !== "") {

        return [value.trim()];

      }

    }

  }


  return [];

}



/* =========================================
   EXIBIR LOGIN E PAINEL
========================================= */

function showLogin() {

  loginSection.classList.remove("hidden");

  dashboardSection.classList.add("hidden");

}


function showDashboard() {

  loginSection.classList.add("hidden");

  dashboardSection.classList.remove("hidden");

}



/* =========================================
   VERIFICAR SESSÃO
========================================= */

async function checkSession() {

  try {

    const {
      data,
      error
    } =
      await window.db.auth.getSession();


    if (error) {

      console.error(
        "Erro ao verificar sessão:",
        error
      );

      showLogin();

      return;

    }


    if (data && data.session) {

      showDashboard();

      await loadAdminCars();

    } else {

      showLogin();

    }

  } catch (error) {

    console.error(
      "Erro na sessão:",
      error
    );

    showLogin();

  }

}



/* =========================================
   VERIFICAR USUÁRIO AUTENTICADO
========================================= */

async function getCurrentSession() {

  const {
    data,
    error
  } =
    await window.db.auth.getSession();


  if (error) {

    throw error;

  }


  if (!data || !data.session) {

    showLogin();

    throw new Error(
      "Sua sessão terminou. Faça login novamente."
    );

  }


  return data.session;

}



/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    loginMessage.textContent =
      "Entrando...";


    const email =
      document
        .getElementById("email")
        .value
        .trim();


    const password =
      document
        .getElementById("password")
        .value;


    if (!email || !password) {

      loginMessage.textContent =
        "Digite o e-mail e a senha.";

      return;

    }


    try {

      const {
        data,
        error
      } =
        await window.db.auth.signInWithPassword({

          email,

          password

        });


      if (error) {

        throw error;

      }


      if (!data || !data.session) {

        throw new Error(
          "Login não concluído."
        );

      }


      loginMessage.textContent = "";

      showDashboard();

      await loadAdminCars();


    } catch (error) {

      console.error(
        "Erro no login:",
        error
      );


      loginMessage.textContent =
        "Erro ao entrar: " +
        error.message;

    }

  }
);



/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener(
  "click",
  async () => {

    if (isLoggingOut) {

      return;

    }


    isLoggingOut = true;

    logoutButton.disabled = true;

    logoutButton.textContent =
      "Saindo...";


    try {

      const {
        error
      } =
        await window.db.auth.signOut();


      if (error) {

        throw error;

      }


      currentImages = [];

      carForm.reset();

      imagePreview.innerHTML = "";

      carId.value = "";

      formTitle.textContent =
        "Novo veículo";

      formMessage.textContent = "";

      loginMessage.textContent = "";

      showLogin();


    } catch (error) {

      console.error(
        "Erro ao sair:",
        error
      );


      loginMessage.textContent =
        "Erro ao sair: " +
        error.message;


    } finally {

      isLoggingOut = false;

      logoutButton.disabled = false;

      logoutButton.textContent =
        "Sair";

    }

  }
);



/* =========================================
   CARREGAR ANÚNCIOS
========================================= */

async function loadAdminCars() {

  adminCars.innerHTML =
    "<p>Carregando anúncios...</p>";


  try {

    await getCurrentSession();


    const {
      data,
      error
    } =
      await window.db
        .from("cars")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    if (!data || !data.length) {

      adminCars.innerHTML =
        "<p>Nenhum anúncio cadastrado.</p>";

      return;

    }


    adminCars.innerHTML =
      data.map(car => {

        const price =
          Number(car.price || 0)
            .toLocaleString(
              "pt-BR",
              {
                style: "currency",
                currency: "BRL"
              }
            );


        const images =
          normalizeImages(car.images);


        const image =
          images.length
            ? images[0]
            : "";


        return `

          <article class="admin-card">

            ${
              image
                ? `
                  <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(
                      `${car.brand || ""} ${car.model || ""}`
                    )}"
                    loading="lazy"
                  >
                `
                : `
                  <div class="no-image">
                    Sem imagem
                  </div>
                `
            }

            <div>

              <h3>
                ${escapeHtml(car.brand || "")}
                ${escapeHtml(car.model || "")}
              </h3>

              <p>
                ${escapeHtml(String(car.year || ""))}
                •
                ${price}
              </p>

              <p>
                Status:
                ${
                  car.status === "available"
                    ? "Disponível"
                    : "Vendido"
                }
              </p>

              <p>
                Fotos cadastradas:
                ${images.length}
              </p>

              <div class="form-actions">

                <button
                  type="button"
                  onclick="editCar('${escapeHtml(car.id)}')"
                >
                  Editar
                </button>

                <button
                  type="button"
                  class="secondary"
                  onclick="deleteCar('${escapeHtml(car.id)}')"
                >
                  Excluir
                </button>

              </div>

            </div>

          </article>

        `;

      }).join("");


  } catch (error) {

    console.error(
      "Erro ao carregar anúncios:",
      error
    );


    adminCars.innerHTML =
      "<p>Erro ao carregar anúncios.</p>";

  }

}



/* =========================================
   SALVAR ANÚNCIO
========================================= */

carForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    formMessage.textContent =
      "Salvando anúncio...";


    try {

      await getCurrentSession();


      const id =
        carId.value.trim();


      const brand =
        document
          .getElementById("brand")
          .value
          .trim();


      const model =
        document
          .getElementById("model")
          .value
          .trim();


      const year =
        Number(
          document
            .getElementById("year")
            .value
        );


      const price =
        Number(
          document
            .getElementById("price")
            .value
        );


      const mileageValue =
        document
          .getElementById("mileage")
          .value;


      const mileage =
        mileageValue
          ? Number(mileageValue)
          : null;


      const fuel =
        document
          .getElementById("fuel")
          .value
          .trim();


      const transmission =
        document
          .getElementById("transmission")
          .value
          .trim();


      const status =
        document
          .getElementById("status")
          .value;


      const description =
        document
          .getElementById("description")
          .value
          .trim();


      const files =
        Array.from(imageInput.files || []);


      if (files.length) {

        formMessage.textContent =
          "Enviando fotos...";


        const uploaded =
          await uploadImages(files);


        currentImages =
          [
            ...currentImages,
            ...uploaded
          ];

      }


      const vehicle = {

        brand,

        model,

        year,

        price,

        mileage,

        fuel,

        transmission,

        status,

        description,

        images: currentImages

      };


      formMessage.textContent =
        "Salvando anúncio...";


      let result;


      if (id) {

        result =
          await window.db
            .from("cars")
            .update(vehicle)
            .eq("id", id);

      } else {

        result =
          await window.db
            .from("cars")
            .insert(vehicle);

      }


      if (result.error) {

        throw result.error;

      }


      formMessage.textContent =
        "Anúncio salvo com sucesso!";


      resetForm();


      await loadAdminCars();


    } catch (error) {

      console.error(
        "Erro ao salvar anúncio:",
        error
      );


      formMessage.textContent =
        "Erro: " +
        error.message;

    }

  }
);



/* =========================================
   UPLOAD DE IMAGENS
========================================= */

async function uploadImages(files) {

  const urls = [];


  for (const file of files) {

    if (!file.type.startsWith("image/")) {

      throw new Error(
        "Selecione somente arquivos de imagem."
      );

    }


    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();


    const fileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${extension}`;


    const filePath =
      fileName;


    const {
      error
    } =
      await window.db.storage
        .from("vehicle-images")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false
          }
        );


    if (error) {

      throw error;

    }


    const {
      data
    } =
      window.db.storage
        .from("vehicle-images")
        .getPublicUrl(filePath);


    if (!data || !data.publicUrl) {

      throw new Error(
        "Não foi possível obter o endereço da imagem."
      );

    }


    urls.push(data.publicUrl);

  }


  return urls;

}



/* =========================================
   EDITAR ANÚNCIO
========================================= */

async function editCar(id) {

  try {

    await getCurrentSession();


    const {
      data,
      error
    } =
      await window.db
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();


    if (error) {

      throw error;

    }


    carId.value =
      data.id;


    document
      .getElementById("brand")
      .value =
      data.brand || "";


    document
      .getElementById("model")
      .value =
      data.model || "";


    document
      .getElementById("year")
      .value =
      data.year || "";


    document
      .getElementById("price")
      .value =
      data.price || "";


    document
      .getElementById("mileage")
      .value =
      data.mileage || "";


    document
      .getElementById("fuel")
      .value =
      data.fuel || "";


    document
      .getElementById("transmission")
      .value =
      data.transmission || "";


    document
      .getElementById("status")
      .value =
      data.status || "available";


    document
      .getElementById("description")
      .value =
      data.description || "";


    currentImages =
      normalizeImages(data.images);


    formTitle.textContent =
      "Editar veículo";


    renderCurrentImages();


    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });


  } catch (error) {

    console.error(
      "Erro ao editar:",
      error
    );


    alert(
      "Erro ao carregar veículo: " +
      error.message
    );

  }

}



/* =========================================
   EXCLUIR ANÚNCIO
========================================= */

async function deleteCar(id) {

  const confirmed =
    confirm(
      "Tem certeza de que deseja excluir este anúncio?"
    );


  if (!confirmed) {

    return;

  }


  try {

    await getCurrentSession();


    const {
      error
    } =
      await window.db
        .from("cars")
        .delete()
        .eq("id", id);


    if (error) {

      throw error;

    }


    await loadAdminCars();


  } catch (error) {

    console.error(
      "Erro ao excluir:",
      error
    );


    alert(
      "Erro ao excluir: " +
      error.message
    );

  }

}



/* =========================================
   PRÉ-VISUALIZAÇÃO DAS IMAGENS
========================================= */

imageInput.addEventListener(
  "change",
  () => {

    renderCurrentImages();


    const files =
      Array.from(imageInput.files || []);


    files.forEach(file => {

      const reader =
        new FileReader();


      reader.onload =
        event => {

          const img =
            document.createElement("img");


          img.src =
            event.target.result;


          img.alt =
            file.name;


          imagePreview.appendChild(img);

        };


      reader.readAsDataURL(file);

    });

  }
);



function renderCurrentImages() {

  imagePreview.innerHTML = "";


  currentImages.forEach(url => {

    const img =
      document.createElement("img");


    img.src =
      url;


    img.alt =
      "Imagem do veículo";


    img.loading =
      "lazy";


    imagePreview.appendChild(img);

  });

}



/* =========================================
   LIMPAR FORMULÁRIO
========================================= */

cancelEdit.addEventListener(
  "click",
  resetForm
);



function resetForm() {

  carForm.reset();


  carId.value = "";


  currentImages = [];


  imagePreview.innerHTML = "";


  formTitle.textContent =
    "Novo veículo";


  formMessage.textContent =
    "";

}



/* =========================================
   SEGURANÇA HTML
========================================= */

function escapeHtml(value) {

  return String(value ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}



/* =========================================
   OBSERVAR AUTENTICAÇÃO
========================================= */

window.db.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "Autenticação:",
      event
    );


    if (session) {

      showDashboard();

    } else {

      showLogin();

    }

  }
);



/* =========================================
   INICIAR
========================================= */

checkSession();
 try {

    const {
      data,
      error
    } =
      await window.db
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();


    if (error) {

      throw error;

    }


    carId.value =
      data.id;


    document
      .getElementById("brand")
      .value =
      data.brand || "";


    document
      .getElementById("model")
      .value =
      data.model || "";


    document
      .getElementById("year")
      .value =
      data.year || "";


    document
      .getElementById("price")
      .value =
      data.price || "";


    document
      .getElementById("mileage")
      .value =
      data.mileage || "";


    document
      .getElementById("fuel")
      .value =
      data.fuel || "";


    document
      .getElementById("transmission")
      .value =
      data.transmission || "";


    document
      .getElementById("status")
      .value =
      data.status || "available";


    document
      .getElementById("description")
      .value =
      data.description || "";


    currentImages =
      data.images || [];


    formTitle.textContent =
      "Editar veículo";


    renderCurrentImages();


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });


  } catch (error) {

    console.error(
      "Erro ao editar:",
      error
    );

    alert(
      "Erro ao carregar veículo: " +
      error.message
    );

  }

}



/* =========================
   EXCLUIR
========================= */


async function deleteCar(id) {

  const confirmed =
    confirm(
      "Tem certeza que deseja excluir este anúncio?"
    );


  if (!confirmed) {

    return;

  }


  try {

    const {
      error
    } =
      await window.db
        .from("cars")
        .delete()
        .eq("id", id);


    if (error) {

      throw error;

    }


    await loadAdminCars();


  } catch (error) {

    console.error(
      "Erro ao excluir:",
      error
    );


    alert(
      "Erro ao excluir: " +
      error.message
    );

  }

}



/* =========================
   PREVIEW DAS IMAGENS
========================= */


imageInput.addEventListener(
  "change",
  () => {

    renderCurrentImages();


    const files =
      Array.from(
        imageInput.files
      );


    files.forEach(file => {

      const reader =
        new FileReader();


      reader.onload =
        event => {

          const img =
            document.createElement(
              "img"
            );


          img.src =
            event.target.result;


          img.alt =
            file.name;


          imagePreview.appendChild(
            img
          );

        };


      reader.readAsDataURL(file);

    });

  }
);



function renderCurrentImages() {

  imagePreview.innerHTML = "";


  currentImages.forEach(
    url => {

      const img =
        document.createElement(
          "img"
        );


      img.src = url;

      img.alt =
        "Imagem do veículo";


      imagePreview.appendChild(
        img
      );

    }
  );

}



/* =========================
   LIMPAR FORMULÁRIO
========================= */


cancelEdit.addEventListener(
  "click",
  resetForm
);


function resetForm() {

  carForm.reset();


  carId.value = "";


  currentImages = [];


  imagePreview.innerHTML = "";


  formTitle.textContent =
    "Novo veículo";


  formMessage.textContent = "";

}



/* =========================
   SEGURANÇA HTML
========================= */


function escapeHtml(value) {

  return String(value ?? "")

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}



/* =========================
   OBSERVAR AUTENTICAÇÃO
========================= */


window.db.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "Auth:",
      event
    );


    if (session) {

      showDashboard();

    } else {

      showLogin();

    }

  }
);



/* =========================
   INICIAR
========================= */


checkSession();
