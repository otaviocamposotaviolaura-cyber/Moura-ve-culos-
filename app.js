
const carsGrid =
  document.getElementById("carsGrid");

const searchInput =
  document.getElementById("searchInput");


let cars = [];



/* =========================
   CARREGAR ANÚNCIOS
========================= */


async function loadCars() {

  carsGrid.innerHTML =
    '<p class="loading">Carregando anúncios...</p>';


  try {

    const {
      data,
      error
    } =
      await window.db
        .from("cars")
        .select("*")
        .eq("status", "available")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        "Erro ao carregar veículos:",
        error
      );


      carsGrid.innerHTML =
        '<p class="loading">Não foi possível carregar os veículos.</p>';


      return;

    }


    cars =
      data || [];


    renderCars(cars);


  } catch (error) {

    console.error(
      "Erro inesperado:",
      error
    );


    carsGrid.innerHTML =
      '<p class="loading">Erro ao conectar ao sistema.</p>';

  }

}



/* =========================
   RENDERIZAR ANÚNCIOS
========================= */


function renderCars(list) {

  if (!list.length) {

    carsGrid.innerHTML =
      '<p class="loading">Nenhum veículo disponível no momento.</p>';


    return;

  }


  carsGrid.innerHTML =
    list.map(car => {


      /*
        Garante que images seja
        um array válido.
      */

      let images = [];


      if (Array.isArray(car.images)) {

        images =
          car.images.filter(Boolean);

      }


      /*
        Caso o banco armazene
        o JSON como texto.
      */

      if (
        typeof car.images === "string"
      ) {

        try {

          const parsed =
            JSON.parse(car.images);


          if (Array.isArray(parsed)) {

            images =
              parsed.filter(Boolean);

          }

        } catch (error) {

          console.warn(
            "Não foi possível interpretar as imagens:",
            error
          );

        }

      }


      /*
        Imagem alternativa caso
        o anúncio não tenha foto.
      */

      const fallbackImage =
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80";


      const galleryImages =
        images.length
          ? images
          : [fallbackImage];


      /*
        Formatação do preço.
      */

      const price =
        Number(car.price)
          .toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL"
            }
          );


      /*
        Formatação da quilometragem.
      */

      const mileage =
        car.mileage != null
          ? `${Number(car.mileage).toLocaleString("pt-BR")} km`
          : "";


      /*
        Informações do veículo.
      */

      const details = [

        car.year,

        mileage,

        car.fuel,

        car.transmission

      ]
        .filter(Boolean)
        .join(" • ");



      /*
        Mensagem do WhatsApp.
        SUBSTITUA O NÚMERO PELO
        WHATSAPP DA EMPRESA.
      */

      const whatsappMessage =
        encodeURIComponent(
          `Olá! Tenho interesse no ${car.brand} ${car.model} ${car.year}.`
        );



      /*
        Criação da galeria
        com todas as imagens.
      */

      const gallery =
        galleryImages
          .map(
            (image, index) => `

              <img
                class="car-image"
                src="${escapeHtml(image)}"
                alt="${escapeHtml(car.brand)} ${escapeHtml(car.model)} - Foto ${index + 1}"
                loading="lazy"
              >

            `
          )
          .join("");



      /*
        Card completo do veículo.
      */

      return `

        <article class="car-card">


          <div class="car-gallery">

            ${gallery}

          </div>



          <div class="car-info">


            <h3>

              ${escapeHtml(car.brand)}
              ${escapeHtml(car.model)}

            </h3>



            <div class="car-meta">

              ${escapeHtml(details)}

            </div>



            <div class="price">

              ${price}

            </div>



            ${
              car.description
                ? `
                  <p>
                    ${escapeHtml(car.description)}
                  </p>
                `
                : ""
            }



            <a
              class="button"
              href="https://wa.me/5500000000000?text=${whatsappMessage}"
              target="_blank"
              rel="noopener noreferrer"
            >

              Falar pelo WhatsApp

            </a>


          </div>


        </article>

      `;

    })
    .join("");

}



/* =========================
   BUSCA
========================= */


searchInput.addEventListener(
  "input",
  () => {


    const search =
      searchInput.value
        .trim()
        .toLowerCase();


    const filtered =
      cars.filter(car => {


        const text =
          `${car.brand || ""} ${car.model || ""}`
            .toLowerCase();


        return text.includes(search);

      });


    renderCars(filtered);

  }
);



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
   INICIAR
========================= */


loadCars();
