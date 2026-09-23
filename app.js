
const carsGrid = document.getElementById("carsGrid");
const searchInput = document.getElementById("searchInput");

let cars = [];

/* =========================
   CARREGAR ANÚNCIOS
========================= */

async function loadCars() {
  carsGrid.innerHTML =
    '<p class="loading">Carregando anúncios...</p>';

  try {
    const { data, error } = await window.db
      .from("cars")
      .select("*")
      .eq("status", "available")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error("Erro ao carregar veículos:", error);

      carsGrid.innerHTML =
        '<p class="loading">Não foi possível carregar os veículos.</p>';

      return;
    }

    cars = data || [];

    renderCars(cars);

  } catch (error) {
    console.error("Erro inesperado:", error);

    carsGrid.innerHTML =
      '<p class="loading">Erro ao conectar ao sistema.</p>';
  }
}

/* =========================
   CONVERTER IMAGENS
========================= */

function getCarImages(carImages) {
  if (Array.isArray(carImages)) {
    return carImages.filter(Boolean);
  }

  if (typeof carImages === "string") {
    try {
      const parsed = JSON.parse(carImages);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }

      if (parsed) {
        return [parsed];
      }

    } catch (error) {
      console.warn(
        "Tentando interpretar a imagem como URL:",
        error
      );

      if (carImages.trim() !== "") {
        return [carImages.trim()];
      }
    }
  }

  return [];
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

  carsGrid.innerHTML = list
    .map((car) => {
      const images = getCarImages(car.images);

      const fallbackImage =
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80";

      const galleryImages = images.length
        ? images
        : [fallbackImage];

      const price = Number(car.price || 0).toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );

      const mileage =
        car.mileage !== null &&
        car.mileage !== undefined &&
        car.mileage !== ""
          ? `${Number(car.mileage).toLocaleString("pt-BR")} km`
          : "";

      const details = [
        car.year,
        mileage,
        car.fuel,
        car.transmission
      ]
        .filter(Boolean)
        .join(" • ");

      const whatsappMessage = encodeURIComponent(
        `Olá! Tenho interesse no ${car.brand} ${car.model} ${car.year}.`
      );

      const gallery = galleryImages
        .map(
          (image, index) => `
            <img
              class="car-image"
              src="${escapeHtml(image)}"
              alt="${escapeHtml(car.brand)} ${escapeHtml(car.model)} - Foto ${index + 1}"
              loading="lazy"
              onerror="this.classList.add('image-error')"
            >
          `
        )
        .join("");

      return `
        <article class="car-card">

          <div class="car-gallery">
            ${gallery}
          </div>

          <div class="car-info">

            <h3>
              ${escapeHtml(car.brand || "")}
              ${escapeHtml(car.model || "")}
            </h3>

            ${
              details
                ? `
                  <div class="car-meta">
                    ${escapeHtml(details)}
                  </div>
                `
                : ""
            }

            <div class="price">
              ${price}
            </div>

            ${
              car.description
                ? `
                  <p class="car-description">
                    ${escapeHtml(car.description)}
                  </p>
                `
                : ""
            }

            <a
              class="button"
              href="https://wa.me/554499935773?text=${whatsappMessage}"
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
   BUSCA DE VEÍCULOS
========================= */

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const search = searchInput.value
      .trim()
      .toLowerCase();

    const filtered = cars.filter((car) => {
      const text =
        `${car.brand || ""} ${car.model || ""}`.toLowerCase();

      return text.includes(search);
    });

    renderCars(filtered);
  });
}

/* =========================
   SEGURANÇA HTML
========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   INICIAR
========================= */

loadCars();
