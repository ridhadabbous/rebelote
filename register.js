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
          color: '#7C3AED',
          fillColor: '#7C3AED',
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

  // Attach location if captured
  if (capturedLocation) {
    dataObj.location = capturedLocation;
  } else if (document.getElementById('map')) {
    // If map exists but no location selected, prompt user
    messageEl.textContent = 'Please select a location on the map.';
    messageEl.className = 'form-message error';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
    return;
  }

  // Format payload
  const payload = {
    access_key: WEB3FORMS_KEY,
    subject: `🚀 New ${userType} Pre-Production Registration`,
    from_name: 'Rebelote Registration',
    replyto: dataObj.email || '',
    // Send the data directly as JSON string in the message body
    message: JSON.stringify(dataObj, null, 2),
    botcheck: ''
  };

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      const successMsg = 'Registration successful! We will review your account information and reach back to you soon.';
      messageEl.textContent = successMsg;
      messageEl.className = 'form-message success';
      messageEl.style.display = 'block';
      alert(successMsg); // Show a popup notification as requested
      form.reset();
      if (markerInstance) mapInstance.removeLayer(markerInstance);
      if (circleInstance) mapInstance.removeLayer(circleInstance);
      capturedLocation = null;
    } else {
      throw new Error(result.message || 'Submission failed');
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
