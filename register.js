let mapInstance = null;
let markerInstance = null;
let circleInstance = null;
let capturedLocation = null;

const DRAFT_KEY = 'rebelo_reg_draft';

function saveDraft() {
  const form = document.querySelector('.register-form');
  if (!form) return;
  const fd = new FormData(form);
  const data = {};
  fd.forEach((v, k) => { data[k] = v; });
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (e) {}
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.entries(data).forEach(([key, val]) => {
      const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
      if (el && el.type !== 'checkbox' && el.type !== 'hidden') {
        el.value = val;
      }
    });
  } catch (e) {}
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
}

const COUNTRIES = {
  tn: { code: '+216', cities: ['Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte', 'Beja', 'Jendouba', 'Kef', 'Siliana', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Gafsa', 'Tozeur', 'Kebili', 'Gabes', 'Medenine', 'Tataouine'], center: [36.8065, 10.1815] },
  dz: { code: '+213', cities: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Setif', 'Tlemcen', 'Bejaia', 'Batna', 'Skikda', 'Biskra', 'Tizi Ouzou'], center: [36.7538, 3.0588] },
  ly: { code: '+218', cities: ['Tripoli', 'Benghazi', 'Misrata', 'Zawiya', 'Al Khums', 'Derna', 'Tobruk', 'Sabha', 'Bayda', 'Sirte', 'Gharyan', 'Zliten'], center: [32.8872, 13.1913] },
  fr: { code: '+33', cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Grenoble'], center: [48.8566, 2.3522] }
};

/**
 * Initializes a Leaflet Map defaulting to Tunis, Tunisia.
 * @param {boolean} requireRadius - Whether to show a working radius circle.
 */
function initMap(requireRadius = false) {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  const ccEl = document.getElementById('country_code');
  const selected = ccEl ? ccEl.value : '+216';
  const country = Object.values(COUNTRIES).find(c => c.code === selected) || COUNTRIES.tn;
  const defaultLocation = country.center;

  mapInstance = L.map('map', {
    center: defaultLocation,
    zoom: 12,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(mapInstance);

  // Force render after container is visible
  setTimeout(() => mapInstance.invalidateSize(), 300);

  mapInstance.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    capturedLocation = { lat: lat.toFixed(6), lng: lng.toFixed(6) };

    if (markerInstance) {
      markerInstance.setLatLng(e.latlng);
    } else {
      markerInstance = L.marker(e.latlng).addTo(mapInstance);
    }

    if (requireRadius) {
      if (circleInstance) {
        circleInstance.setLatLng(e.latlng);
      } else {
        circleInstance = L.circle(e.latlng, {
          color: '#FF5252',
          fillColor: '#FF5252',
          fillOpacity: 0.15,
          radius: 5000
        }).addTo(mapInstance);
      }
      capturedLocation.radius_km = 5;
    }
  });
}

/**
 * Handles form submission and sends JSON payload to the registration backend
 */
async function handleRegistration(event, userType) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = form.querySelector('.submit-btn');
  const messageEl = document.getElementById('form-message');
  const dict = typeof translations !== 'undefined' ? translations[currentLang] : null;

  submitBtn.disabled = true;
  const submittingText = (dict && dict['form_submitting']) || 'Submitting...';
  submitBtn.innerHTML = `<span class="spinner"></span> ${submittingText}`;
  messageEl.className = 'form-message';
  messageEl.style.display = 'none';

  const formData = new FormData(form);
  const dataObj = {};
  formData.forEach((value, key) => {
    dataObj[key] = value;
  });

  if (dataObj.city) {
    dataObj.working_city = dataObj.city;
    delete dataObj.city;
  }

  dataObj.type = userType;

  if (capturedLocation) {
    dataObj.latitude = parseFloat(capturedLocation.lat);
    dataObj.longitude = parseFloat(capturedLocation.lng);
  } else if (document.getElementById('map')) {
    const mapPrompt = (dict && dict['form_map_prompt']) || 'Please select a location on the map.';
    messageEl.textContent = mapPrompt;
    messageEl.className = 'form-message error';
    submitBtn.disabled = false;
    const submitText = (dict && dict['form_submit']) || 'Submit Registration';
    submitBtn.innerHTML = submitText;
    return;
  }

  try {
    const res = await fetch('https://registration-backend.dsridha.workers.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dataObj)
    });

    let result;
    try {
      result = await res.json();
    } catch (e) {
      result = { success: false, message: 'Invalid response from server' };
    }

    if (res.ok && result.success) {
      const successTitle = (dict && dict['modal_success_title']) || 'Success!';
      const successDesc = (dict && dict['modal_success_desc']) || 'Registration successful! We will review your account information and reach back to you soon.';
      const btnText = (dict && dict['modal_btn']) || 'Close';

      messageEl.textContent = successDesc;
      messageEl.className = 'form-message success';
      messageEl.style.display = 'block';

      const modalHtml = `
        <div id="custom-modal-overlay" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 class="modal-title">${successTitle}</h3>
            <p class="modal-desc">${successDesc}</p>
            <button class="modal-btn" onclick="document.getElementById('custom-modal-overlay').remove()">${btnText}</button>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      setTimeout(() => {
        const overlay = document.getElementById('custom-modal-overlay');
        if (overlay) {
          overlay.style.opacity = '1';
          const content = overlay.querySelector('.modal-content');
          if (content) content.style.transform = 'scale(1)';
        }
      }, 10);

      clearDraft();
      form.reset();
      if (markerInstance) mapInstance.removeLayer(markerInstance);
      if (circleInstance) mapInstance.removeLayer(circleInstance);
      capturedLocation = null;
    } else {
      throw new Error(result.error || result.message || 'Submission failed');
    }
  } catch (err) {
    console.error('Registration Error:', err);
    const errMsg = (dict && dict['form_error']) || 'Something went wrong. Please try again later.';
    messageEl.textContent = errMsg;
    messageEl.className = 'form-message error';
    messageEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    const submitText = (dict && dict['form_submit']) || 'Submit Registration';
    submitBtn.innerHTML = submitText;
  }
}

const COUNTRY_FLAGS = { tn: '\u{1F1F9}\u{1F1F3}', dz: '\u{1F1E9}\u{1F1FF}', ly: '\u{1F1F1}\u{1F1FE}', fr: '\u{1F1EB}\u{1F1F7}' };

function populateCountryCode() {
  const sel = document.getElementById('country_code');
  if (!sel) return;
  sel.innerHTML = '';
  Object.entries(COUNTRIES).forEach(([key, c]) => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = `${COUNTRY_FLAGS[key]} ${c.code}`;
    if (c.code === '+216') opt.selected = true;
    sel.appendChild(opt);
  });
}

function populateCities() {
  const ccSel = document.getElementById('country_code');
  const citySel = document.getElementById('city');
  if (!ccSel || !citySel) return;
  const dict = typeof translations !== 'undefined' ? translations[currentLang] : null;
  const placeholder = (dict && dict['form_city_sel']) || 'Select your city...';
  const country = Object.values(COUNTRIES).find(c => c.code === ccSel.value) || COUNTRIES.tn;
  citySel.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
  country.cities.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    citySel.appendChild(opt);
  });
}

function updateMapCenter() {
  if (!mapInstance) return;
  const ccSel = document.getElementById('country_code');
  if (!ccSel) return;
  const country = Object.values(COUNTRIES).find(c => c.code === ccSel.value) || COUNTRIES.tn;
  mapInstance.setView(country.center, 12);
  if (markerInstance) {
    mapInstance.removeLayer(markerInstance);
    markerInstance = null;
  }
  if (circleInstance) {
    mapInstance.removeLayer(circleInstance);
    circleInstance = null;
  }
  capturedLocation = null;
}

// Turnstile: add widget here when ready
// See https://developers.cloudflare.com/turnstile/

document.addEventListener('DOMContentLoaded', () => {
  populateCountryCode();
  populateCities();

  const ccSel = document.getElementById('country_code');
  if (ccSel) {
    ccSel.addEventListener('change', () => {
      populateCities();
      updateMapCenter();
    });
  }

  restoreDraft();

  const form = document.querySelector('.register-form');
  if (form) {
    form.addEventListener('change', saveDraft);
  }

  if (window.innerWidth <= 900) {
    const formSide = document.querySelector('.premium-form-side');
    if (formSide) {
      setTimeout(() => {
        const yOffset = -90;
        const scrollY = window.scrollY !== undefined ? window.scrollY : window.pageYOffset;
        const y = formSide.getBoundingClientRect().top + scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 300);
    }
  }
});

