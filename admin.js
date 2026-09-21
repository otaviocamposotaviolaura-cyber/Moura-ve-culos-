const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const logoutButton = document.getElementById("logoutButton");

const carForm = document.getElementById("carForm");
const formTitle = document.getElementById("formTitle");
const formMessage = document.getElementById("formMessage");

const carId = document.getElementById("carId");
const brand = document.getElementById("brand");
const model = document.getElementById("model");
const year = document.getElementById("year");
const price = document.getElementById("price");
const mileage = document.getElementById("mileage");
const fuel = document.getElementById("fuel");
const transmission = document.getElementById("transmission");
const status = document.getElementById("status");
const description = document.getElementById("description");
const images = document.getElementById("images");

const imagePreview = document.getElementById("imagePreview");
const cancelEdit = document.getElementById("cancelEdit");

const adminCars = document.getElementById("adminCars");

let currentImages = [];


/* =========================
   AUTENTICAÇÃO
========================= */

async function checkSession() {

  try {

    const { data, error } =
      await supabase.auth.getSession();

    if (error) {

      console.error(
        "Erro ao verificar sessão:",
        error
      );

      showLogin();

      return;
    }

    if (data.session) {

      showDashboard();

      await loadAdminCars();

    } else {

      showLogin();

    }

  } catch (error) {

    console.error(
      "Erro ao verificar sessão:",
      error
    );

    showLogin();

  }

}


function showLogin() {

  loginSection.classList.remove("hidden");

  dashboardSection.classList.add("hidden");

}


function showDashboard() {

  loginSection.classList.add("hidden");

  dashboardSection.classList.remove("hidden");

}


/* =========================
   LOGIN
========================= */

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    loginMessage.textContent =
      "Entrando...";

    const emailValue =
      document
        .getElementById("email")
        .value
        .trim();

    const passwordValue =
      document
        .getElementById("password")
        .value;

    if (!emailValue || !passwordValue) {

      loginMessage.textContent =
        "Digite o e-mail e a senha.";

      return;

    }

    try {

      console.log(
        "Tentando entrar no Supabase..."
      );

      const { data, error } =
        await supabase.auth.signInWithPassword({

          email: emailValue,

          password: passwordValue

        });


      console.log(
        "Resposta do Supabase:",
        data
      );

      console.log(
        "Erro do Supabase:",
        error
      );


      if (error) {

        console.error(
          "Erro de login:",
          error
        );

        loginMessage.textContent =
          "Erro: " + error.message;

        return;

      }


      if (!data || !data.session) {

        loginMessage.textContent =
          "Login não concluído. Nenhuma sessão foi criada.";

        return;

      }


      loginMessage.textContent = "";

      showDashboard();

      await loadAdminCars();

    } catch (error) {

      console.error(
        "Erro inesperado no login:",
        error
      );

      loginMessage.textContent =
        "Erro ao conectar ao Supabase: " +
        error.message;

    }

  }
);


/* =========================
   LOGOUT
========================= */

logoutButton.addEventListener(
  "click",
  async () => {

    try {

      const { error } =
        await supabase.auth.signOut();

      if (error) {

        console.error(
          "Erro ao sair:",
          error
        );

      }

    } catch (error) {

      console.error(
        "Erro inesperado ao sair:",
        error
      );

    }

    resetForm();

    showLogin();

  }
);


/* =========================
   CARREGAR ANÚNCIOS
========================= */

async function loadAdminCars() {

  adminCars.innerHTML =
    '<p class="loading">Carregando anúncios...</p>';


  try {

    const { data, error } =
      await supabase
        .from("cars")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        "Erro ao carregar anúncios:",
        error
      );

      adminCars.innerHTML =
        '<p class="loading">Erro: ' +
        escapeHtml(error.message) +
        '</p>';

      return;

    }


    if (!data || data.length === 0) {

      adminCars.innerHTML =
        '<p class="loading">Nenhum anúncio cadastrado.</p>';

      return;

    }


    adminCars.innerHTML =
      data.map(car => {

        const price =
          Number(car.price)
            .toLocaleString(
              "pt-BR",
              {
                style: "currency",
                currency: "BRL"
              }
            );


        const statusText =
          car.status === "available"
            ? "Disponível"
            : "Vendido";


        return `

          <div class="admin-item">

            <div>

              <strong>
                ${escapeHtml(car.brand)}
                ${escapeHtml(car.model)}
              </strong>

              <div class="car-meta">

                ${escapeHtml(car.year)}
                •
                ${price}
                •
                ${statusText}

              </div>

            </div>


            <div class="admin-item-actions">

              <button
                type="button"
                onclick="editCar('${car.id}')"
              >
                Editar
              </button>


              <button
                type="button"
                class="secondary"
                onclick="deleteCar('${car.id}')"
              >
                Excluir
              </button>

            </div>

          </div>

        `;

      }).join("");


  } catch (error) {

    console.error(
      "Erro inesperado:",
      error
    );

    adminCars.innerHTML =
      '<p class="loading">Erro: ' +
      escapeHtml(error.message) +
      '</p>';

  }

}


/* =========================
   SALVAR ANÚNCIO
========================= */

carForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    formMessage.textContent =
      "Salvando anúncio...";


    const data = {

      brand:
        brand.value.trim(),

      model:
        model.value.trim(),

      year:
        Number(year.value),

      price:
        Number(price.value),

      mileage:
        mileage.value
          ? Number(mileage.value)
          : null,

      fuel:
        fuel.value.trim() || null,

      transmission:
        transmission.value.trim() || null,

      status:
        status.value,

      description:
        description.value.trim() || null

    };


    try {


      /* NOVO ANÚNCIO */

      if (!carId.value) {

        const {
          data: insertedCar,
          error
        } = await supabase
          .from("cars")
          .insert(data)
          .select()
          .single();


        if (error) {

          throw error;

        }


        const uploadedImages =
          await uploadImages(
            insertedCar.id
          );


        if (uploadedImages.length > 0) {

          const {
            error: imageError
          } = await supabase
            .from("cars")
            .update({
              images: uploadedImages
            })
            .eq(
              "id",
              insertedCar.id
            );


          if (imageError) {

            throw imageError;

          }

        }


        formMessage.textContent =
          "Anúncio criado com sucesso.";

      }


      /* EDITAR ANÚNCIO */

      else {

        const uploadedImages =
          await uploadImages(
            carId.value
          );


        const finalImages = [
          ...currentImages,
          ...uploadedImages
        ];


        const { error } =
          await supabase
            .from("cars")
            .update({

              ...data,

              images: finalImages,

              updated_at:
                new Date().toISOString()

            })
            .eq(
              "id",
              carId.value
            );


        if (error) {

          throw error;

        }


        formMessage.textContent =
          "Anúncio atualizado com sucesso.";

      }


      resetForm();

      await loadAdminCars();


    } catch (error) {

      console.error(
        "Erro ao salvar anúncio:",
        error
      );

      formMessage.textContent =
        "Erro: " + error.message;

    }

  }
);


/* =========================
   UPLOAD DAS FOTOS
========================= */

async function uploadImages(carIdValue) {

  const files =
    Array.from(images.files);


  if (!files.length) {

    return [];

  }


  const uploadedUrls = [];


  for (const file of files) {

    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();


    const fileName =
      `${crypto.randomUUID()}.${extension}`;


    const filePath =
      `${carIdValue}/${fileName}`;


    const { error } =
      await supabase.storage
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

      console.error(
        "Erro no upload:",
        error
      );

      continue;

    }


    const { data } =
      supabase.storage
        .from("vehicle-images")
        .getPublicUrl(
          filePath
        );


    uploadedUrls.push(
      data.publicUrl
    );

  }


  return uploadedUrls;

}


/* =========================
   EDITAR
========================= */

async function editCar(id) {

  const { data, error } =
    await supabase
      .from("cars")
      .select("*")
      .eq("id", id)
      .single();


  if (error) {

    console.error(
      "Erro ao buscar veículo:",
      error
    );

    return;

  }


  carId.value =
    data.id;

  brand.value =
    data.brand || "";

  model.value =
    data.model || "";

  year.value =
    data.year || "";

  price.value =
    data.price || "";

  mileage.value =
    data.mileage || "";

  fuel.value =
    data.fuel || "";

  transmission.value =
    data.transmission || "";

  status.value =
    data.status || "available";

  description.value =
    data.description || "";

  currentImages =
    data.images || [];


  renderCurrentImages();


  formTitle.textContent =
    "Editar veículo";


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

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


  const { data, error } =
    await supabase
      .from("cars")
      .select("images")
      .eq("id", id)
      .single();


  if (error) {

    console.error(
      "Erro ao buscar fotos:",
      error
    );

    return;

  }


  if (
    data.images &&
    data.images.length
  ) {

    const paths =
      data.images
        .map(url => {

          const marker =
            "/vehicle-images/";

          const index =
            url.indexOf(marker);


          if (index === -1) {

            return null;

          }


          return decodeURIComponent(
            url.substring(
              index + marker.length
            )
          );

        })
        .filter(Boolean);


    if (paths.length) {

      const {
        error: storageError
      } = await supabase.storage
        .from("vehicle-images")
        .remove(paths);


      if (storageError) {

        console.error(
          "Erro ao apagar fotos:",
          storageError
        );

      }

    }

  }


  const {
    error: deleteError
  } = await supabase
    .from("cars")
    .delete()
    .eq("id", id);


  if (deleteError) {

    console.error(
      "Erro ao excluir anúncio:",
      deleteError
    );

    alert(
      "Não foi possível excluir o anúncio."
    );

    return;

  }


  await loadAdminCars();

}


/* =========================
   VISUALIZAÇÃO DAS FOTOS
========================= */

function renderCurrentImages() {

  imagePreview.innerHTML = "";


  if (!currentImages.length) {

    return;

  }


  currentImages.forEach(url => {

    const img =
      document.createElement("img");

    img.src = url;

    img.alt =
      "Foto do veículo";

    imagePreview.appendChild(img);

  });

}


/* =========================
   LIMPAR FORMULÁRIO
========================= */

cancelEdit.addEventListener(
  "click",
  () => {

    resetForm();

  }
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
   SEGURANÇA DO HTML
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
   SESSÃO
========================= */

supabase.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "Evento de autenticação:",
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
