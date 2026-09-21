const carsGrid = document.getElementById("carsGrid");
const searchInput = document.getElementById("searchInput");

let cars = [];

async function loadCars() {
  carsGrid.innerHTML = '<p class="loading">Carregando anúncios...</p>';

  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar veículos:", error);
    carsGrid.innerHTML =
      '<p class="loading">Não foi possível carregar os veículos.</p>';
    return;
  }

  cars = data || [];
  renderCars(cars);
}

function renderCars(list) {
  if (!list.length) {
    carsGrid.innerHTML =
      '<p class="loading">Nenhum veículo disponível no momento.</p>';
    return;
  }

  carsGrid.innerHTML = list.map(car => {
    const image = car.images && car.images.length
      ? car.images[0]
      : "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80";

    const price = Number(car.price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    const mileage = car.mileage != null
      ? `${Number(car.mileage).toLocaleString("pt-BR")} km`
      : "";

    const details = [
      car.year,
      mileage,
      car.fuel,
      car.transmission
    ].filter(Boolean).join(" • ");

    const whatsappMessage = encodeURIComponent(
      `Olá! Tenho interesse no ${car.brand} ${car.model} ${car.year}.`
    );

    return `
      <article class="car-card">
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(car.brand)} ${escapeHtml(car.model)}"
          loading="lazy"
        >

        <div class="car-info">
          <h3>${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h3>

          <div class="car-meta">
            ${escapeHtml(details)}
          </div>

          <div class="price">
            ${price}
          </div>

          ${
            car.description
              ? `<p>${escapeHtml(car.description)}</p>`
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
  }).join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

searchInput.addEventListener("input", () => {
  const search = searchInput.value
    .trim()
    .toLowerCase();

  const filtered = cars.filter(car => {
    const text = `
      ${car.brand || ""}
      ${car.model || ""}
    `.toLowerCase();

    return text.includes(search);
  });

  renderCars(filtered);
});

loadCars();
