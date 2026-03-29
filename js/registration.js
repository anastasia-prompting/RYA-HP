/* =========================================================
   ЛОГИКА РЕГИСТРАЦИИ И ЛИЧНОГО КАБИНЕТА УЧАСТНИКА
   1) Регистрация хранит базовые данные в localStorage
   2) После регистрации открывается личный кабинет
   3) Кабинет автоматически получает имя / телефон / email
   4) Профиль можно дозаполнить и сохранить локально
   ========================================================= */
(function () {
  var storageKeys = {
    registration: "juliaParticipantRegistration",
    profile: "juliaParticipantProfile",
  };

  var registrationForm = document.querySelector("[data-registration-form]");
  var profileForm = document.querySelector("[data-profile-form]");
  var profileSection = document.querySelector("[data-personal-cabinet-section]");

  if (!registrationForm || !profileForm || !profileSection) {
    return;
  }

  var registrationInputs = {
    name: registrationForm.querySelector('[data-field="name"]'),
    phone: registrationForm.querySelector('[data-field="phone"]'),
    email: registrationForm.querySelector('[data-field="email"]'),
  };

  var registrationStatus = registrationForm.querySelector("[data-form-status]");

  var profileInputs = {
    lastName: profileForm.querySelector('[data-profile-field="lastName"]'),
    firstName: profileForm.querySelector('[data-profile-field="firstName"]'),
    middleName: profileForm.querySelector('[data-profile-field="middleName"]'),
    birthDate: profileForm.querySelector('[data-profile-field="birthDate"]'),
    phone: profileForm.querySelector('[data-profile-field="phone"]'),
    city: profileForm.querySelector('[data-profile-field="city"]'),
    email: profileForm.querySelector('[data-profile-field="email"]'),
  };

  var profileStatus = profileForm.querySelector("[data-profile-status]");
  var accountBadge = document.querySelector("[data-account-badge]");
  var summaryNodes = {
    name: document.querySelector("[data-account-summary-name]"),
    phone: document.querySelector("[data-account-summary-phone]"),
    email: document.querySelector("[data-account-summary-email]"),
    city: document.querySelector("[data-account-summary-city]"),
  };

  function safeParseJSON(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function readStorage(key) {
    try {
      return safeParseJSON(window.localStorage.getItem(key));
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function trimValue(input) {
    return input ? input.value.trim() : "";
  }

  function getRegistrationErrorNode(fieldName) {
    return registrationForm.querySelector('[data-error-for="' + fieldName + '"]');
  }

  function getProfileErrorNode(fieldName) {
    return profileForm.querySelector('[data-profile-error-for="' + fieldName + '"]');
  }

  function setFieldError(input, errorNode, message) {
    if (!input || !errorNode) {
      return;
    }

    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    errorNode.textContent = message;
  }

  function clearFieldError(input, errorNode) {
    if (!input || !errorNode) {
      return;
    }

    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    errorNode.textContent = "";
  }

  function setRegistrationError(fieldName, message) {
    setFieldError(registrationInputs[fieldName], getRegistrationErrorNode(fieldName), message);
  }

  function clearRegistrationError(fieldName) {
    clearFieldError(registrationInputs[fieldName], getRegistrationErrorNode(fieldName));
  }

  function setProfileError(fieldName, message) {
    setFieldError(profileInputs[fieldName], getProfileErrorNode(fieldName), message);
  }

  function clearProfileError(fieldName) {
    clearFieldError(profileInputs[fieldName], getProfileErrorNode(fieldName));
  }

  function clearRegistrationErrors() {
    clearRegistrationError("name");
    clearRegistrationError("phone");
    clearRegistrationError("email");
    showStatus(registrationStatus, "", "");
  }

  function clearProfileErrors() {
    Object.keys(profileInputs).forEach(function (fieldName) {
      clearProfileError(fieldName);
    });
    showStatus(profileStatus, "", "");
  }

  function showStatus(statusNode, message, type) {
    if (!statusNode) {
      return;
    }

    statusNode.textContent = message;
    statusNode.classList.remove("is-success", "is-error");

    if (type) {
      statusNode.classList.add(type);
    }
  }

  function isValidPhone(value) {
    return /^[\d\s()+-]{6,20}$/.test(value);
  }

  function isValidEmail(value, input) {
    if (!value) {
      return false;
    }

    if (input) {
      input.value = value;
      return input.checkValidity();
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function getRegistrationDataFromForm() {
    return {
      name: trimValue(registrationInputs.name),
      phone: trimValue(registrationInputs.phone),
      email: trimValue(registrationInputs.email),
    };
  }

  function getProfileDataFromForm() {
    return {
      lastName: trimValue(profileInputs.lastName),
      firstName: trimValue(profileInputs.firstName),
      middleName: trimValue(profileInputs.middleName),
      birthDate: trimValue(profileInputs.birthDate),
      phone: trimValue(profileInputs.phone),
      city: trimValue(profileInputs.city),
      email: trimValue(profileInputs.email),
    };
  }

  function createProfileDraftFromRegistration(registrationData) {
    return {
      lastName: "",
      firstName: registrationData.name || "",
      middleName: "",
      birthDate: "",
      phone: registrationData.phone || "",
      city: "",
      email: registrationData.email || "",
    };
  }

  function fillRegistrationForm(data) {
    var safeData = data || {};
    registrationInputs.name.value = safeData.name || "";
    registrationInputs.phone.value = safeData.phone || "";
    registrationInputs.email.value = safeData.email || "";
  }

  function fillProfileForm(data) {
    var safeData = data || {};
    Object.keys(profileInputs).forEach(function (fieldName) {
      profileInputs[fieldName].value = safeData[fieldName] || "";
    });
  }

  function revealProfileSection() {
    profileSection.hidden = false;
  }

  function scrollToProfileSection() {
    if (typeof profileSection.scrollIntoView === "function") {
      profileSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function getDisplayValue(value) {
    return value ? value : "—";
  }

  function buildFullName(profileData) {
    var parts = [profileData.lastName, profileData.firstName, profileData.middleName].filter(Boolean);

    if (parts.length) {
      return parts.join(" ");
    }

    return profileData.firstName || "—";
  }

  function isProfileComplete(profileData) {
    return Boolean(
      profileData.lastName &&
        profileData.firstName &&
        profileData.middleName &&
        profileData.birthDate &&
        profileData.phone &&
        profileData.city &&
        profileData.email
    );
  }

  function updateAccountSummary(profileData) {
    var safeData = profileData || {};
    summaryNodes.name.textContent = getDisplayValue(buildFullName(safeData));
    summaryNodes.phone.textContent = getDisplayValue(safeData.phone);
    summaryNodes.email.textContent = getDisplayValue(safeData.email);
    summaryNodes.city.textContent = getDisplayValue(safeData.city);

    if (isProfileComplete(safeData)) {
      accountBadge.textContent = "Профиль заполнен";
      accountBadge.classList.add("is-complete");
    } else {
      accountBadge.textContent = "Профиль требует заполнения";
      accountBadge.classList.remove("is-complete");
    }
  }

  function getFirstInvalidInput(inputsMap) {
    var fieldNames = Object.keys(inputsMap);
    var firstInvalidField = fieldNames.find(function (fieldName) {
      return inputsMap[fieldName].classList.contains("is-invalid");
    });

    return firstInvalidField ? inputsMap[firstInvalidField] : null;
  }

  function validateRegistrationForm() {
    var registrationData = getRegistrationDataFromForm();
    var isValid = true;

    if (!registrationData.name) {
      setRegistrationError("name", "Пожалуйста, укажите имя.");
      isValid = false;
    }

    if (!registrationData.phone && !registrationData.email) {
      setRegistrationError("phone", "Укажите телефон или email для связи.");
      setRegistrationError("email", "Укажите телефон или email для связи.");
      isValid = false;
    }

    if (registrationData.phone && !isValidPhone(registrationData.phone)) {
      setRegistrationError("phone", "Проверьте номер телефона. Используйте цифры и допустимые символы: + ( ) -.");
      isValid = false;
    }

    if (registrationData.email && !isValidEmail(registrationData.email, registrationInputs.email)) {
      setRegistrationError("email", "Укажите корректный адрес электронной почты.");
      isValid = false;
    }

    return isValid;
  }

  function validateProfileForm() {
    var profileData = getProfileDataFromForm();
    var isValid = true;

    Object.keys(profileData).forEach(function (fieldName) {
      if (!profileData[fieldName]) {
        setProfileError(fieldName, "Это поле обязательно для заполнения.");
        isValid = false;
      }
    });

    if (profileData.phone && !isValidPhone(profileData.phone)) {
      setProfileError("phone", "Проверьте номер телефона. Используйте цифры и допустимые символы: + ( ) -.");
      isValid = false;
    }

    if (profileData.email && !isValidEmail(profileData.email, profileInputs.email)) {
      setProfileError("email", "Укажите корректный адрес электронной почты.");
      isValid = false;
    }

    return isValid;
  }

  function handleRegistrationSubmit(event) {
    event.preventDefault();
    clearRegistrationErrors();

    if (!validateRegistrationForm()) {
      showStatus(registrationStatus, "Пожалуйста, исправьте ошибки в форме и попробуйте снова.", "is-error");
      var invalidRegistrationInput = getFirstInvalidInput(registrationInputs);
      if (invalidRegistrationInput) {
        invalidRegistrationInput.focus();
      }
      return;
    }

    var registrationData = getRegistrationDataFromForm();
    var profileDraft = createProfileDraftFromRegistration(registrationData);
    var registrationSaved = writeStorage(storageKeys.registration, registrationData);
    var profileSaved = writeStorage(storageKeys.profile, profileDraft);

    fillRegistrationForm(registrationData);
    fillProfileForm(profileDraft);
    updateAccountSummary(profileDraft);
    revealProfileSection();

    if (!registrationSaved || !profileSaved) {
      showStatus(
        registrationStatus,
        "Регистрация прошла, но браузер не смог сохранить данные локально. Личный кабинет всё равно открыт ниже.",
        "is-error"
      );
    } else {
      showStatus(
        registrationStatus,
        "Спасибо! Регистрация сохранена. Ниже открылся личный кабинет с автоматической подстановкой данных.",
        "is-success"
      );
    }

    showStatus(
      profileStatus,
      "Заполните обязательные поля профиля и сохраните анкету участника.",
      ""
    );

    scrollToProfileSection();
  }

  function handleProfileSubmit(event) {
    event.preventDefault();
    clearProfileErrors();

    if (!validateProfileForm()) {
      showStatus(profileStatus, "Пожалуйста, заполните все обязательные поля и исправьте ошибки.", "is-error");
      var invalidProfileInput = getFirstInvalidInput(profileInputs);
      if (invalidProfileInput) {
        invalidProfileInput.focus();
      }
      return;
    }

    var profileData = getProfileDataFromForm();
    var registrationData = readStorage(storageKeys.registration) || {};

    if (!registrationData.name && profileData.firstName) {
      registrationData.name = profileData.firstName;
    }
    if (!registrationData.phone && profileData.phone) {
      registrationData.phone = profileData.phone;
    }
    if (!registrationData.email && profileData.email) {
      registrationData.email = profileData.email;
    }

    var profileSaved = writeStorage(storageKeys.profile, profileData);
    var registrationSaved = writeStorage(storageKeys.registration, registrationData);

    fillProfileForm(profileData);
    updateAccountSummary(profileData);

    if (!profileSaved || !registrationSaved) {
      showStatus(
        profileStatus,
        "Профиль заполнен, но браузер не смог надёжно сохранить данные локально.",
        "is-error"
      );
      return;
    }

    showStatus(profileStatus, "Профиль успешно сохранён. Данные участника обновлены в личном кабинете.", "is-success");
  }

  function bindRegistrationFieldEvents() {
    registrationInputs.name.addEventListener("input", function () {
      clearRegistrationError("name");
      showStatus(registrationStatus, "", "");
    });

    registrationInputs.phone.addEventListener("input", function () {
      clearRegistrationError("phone");
      if (trimValue(registrationInputs.phone) || trimValue(registrationInputs.email)) {
        clearRegistrationError("email");
      }
      showStatus(registrationStatus, "", "");
    });

    registrationInputs.email.addEventListener("input", function () {
      clearRegistrationError("email");
      if (trimValue(registrationInputs.phone) || trimValue(registrationInputs.email)) {
        clearRegistrationError("phone");
      }
      showStatus(registrationStatus, "", "");
    });
  }

  function bindProfileFieldEvents() {
    Object.keys(profileInputs).forEach(function (fieldName) {
      profileInputs[fieldName].addEventListener("input", function () {
        clearProfileError(fieldName);
        showStatus(profileStatus, "", "");
      });
    });
  }

  function initializeFromStorage() {
    var storedRegistration = readStorage(storageKeys.registration);
    var storedProfile = readStorage(storageKeys.profile);

    if (storedRegistration) {
      fillRegistrationForm(storedRegistration);
    }

    if (storedRegistration || storedProfile) {
      var profileData = storedProfile || createProfileDraftFromRegistration(storedRegistration || {});
      fillProfileForm(profileData);
      updateAccountSummary(profileData);
      revealProfileSection();
    }
  }

  registrationForm.addEventListener("submit", handleRegistrationSubmit);
  profileForm.addEventListener("submit", handleProfileSubmit);

  bindRegistrationFieldEvents();
  bindProfileFieldEvents();
  initializeFromStorage();
})();
