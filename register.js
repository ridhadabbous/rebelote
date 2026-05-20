let mapInstance = null;
let markerInstance = null;
let circleInstance = null;
let capturedLocation = null;

/**
 * Initializes a Leaflet Map defaulting to Tunis, Tunisia.
 * @param {boolean} requireRadius - Whether to show a working radius circle.
 */
function initMap(requireRadius = false) {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Default to Tunis, Tunisia
  const defaultLocation = [36.8065, 10.1815];

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
          color: '#E53935',
          fillColor: '#E53935',
          fillOpacity: 0.15,
          radius: 5000
        }).addTo(mapInstance);
      }
      capturedLocation.radius_km = 5;
    }
  });
}

/**
 * Handles form submission and sends JSON payload via Web3Forms
 */
async function handleRegistration(event, userType) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = form.querySelector('.submit-btn');
  const messageEl = document.getElementById('form-message');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  messageEl.className = 'form-message';
  messageEl.style.display = 'none';

  // Gather form data
  const formData = new FormData(form);
  const dataObj = {};
  formData.forEach((value, key) => {
    dataObj[key] = value;
  });

  // Map city to working_city as expected by the worker
  if (dataObj.city) {
    dataObj.working_city = dataObj.city;
    delete dataObj.city;
  }

  // Set the registration type for the worker to route correctly
  dataObj.type = userType;

  // Attach location if captured
  if (capturedLocation) {
    dataObj.latitude = parseFloat(capturedLocation.lat);
    dataObj.longitude = parseFloat(capturedLocation.lng);
  } else if (document.getElementById('map')) {
    // If map exists but no location selected, prompt user
    messageEl.textContent = 'Please select a location on the map.';
    messageEl.className = 'form-message error';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
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
      const dict = typeof translations !== 'undefined' ? translations[currentLang] : null;
      const successTitle = (dict && dict['modal_success_title']) || 'Success!';
      const successDesc = (dict && dict['modal_success_desc']) || 'Registration successful! We will review your account information and reach back to you soon.';
      const btnText = (dict && dict['modal_btn']) || 'Close';

      messageEl.textContent = successDesc;
      messageEl.className = 'form-message success';
      messageEl.style.display = 'block';
      
      // Inject custom modal
      const modalHtml = `
        <div id="custom-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;">
          <div style="background: #111111; border: 1px solid rgba(229, 57, 53, 0.3); border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <div style="width: 60px; height: 60px; background: rgba(229, 57, 53, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 style="color: #fff; font-size: 1.5rem; margin-bottom: 12px; font-family: 'Outfit', sans-serif;">${successTitle}</h3>
            <p style="color: rgba(255,255,255,0.7); font-size: 1rem; line-height: 1.5; margin-bottom: 24px;">${successDesc}</p>
            <button onclick="document.getElementById('custom-modal-overlay').remove()" style="background: #E53935; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.2s;">${btnText}</button>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      setTimeout(() => {
        const overlay = document.getElementById('custom-modal-overlay');
        if (overlay) {
          overlay.style.opacity = '1';
          overlay.children[0].style.transform = 'scale(1)';
        }
      }, 10);

      form.reset();
      if (markerInstance) mapInstance.removeLayer(markerInstance);
      if (circleInstance) mapInstance.removeLayer(circleInstance);
      capturedLocation = null;
    } else {
      throw new Error(result.error || result.message || 'Submission failed');
    }
  } catch (err) {
    console.error('Registration Error:', err);
    messageEl.textContent = 'Something went wrong. Please try again later.';
    messageEl.className = 'form-message error';
    messageEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
  }
}

// Auto-scroll to the form on mobile devices
document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth <= 900) {
    const formSide = document.querySelector('.premium-form-side');
    if (formSide) {
      setTimeout(() => {
        const yOffset = -90; // offset for fixed navbar and spacing
        const scrollY = window.scrollY !== undefined ? window.scrollY : window.pageYOffset;
        const y = formSide.getBoundingClientRect().top + scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 300);
    }
  }
});

