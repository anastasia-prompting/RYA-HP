/* =========================================================
   ЛОГИКА РАЗГРАНИЧЕНИЯ ДОСТУПА, ВЫБОРА ТАРИФА И ДЕМО-ОПЛАТЫ
   1) Определяет статус пользователя по localStorage
   2) Управляет доступом к блокам: гость / зарегистрирован / оплачено
   3) Поддерживает выбор тарифа для страниц, где есть форматы оплаты
   4) Готовит архитектуру для будущего подключения backend и оплаты
   ========================================================= */
(function () {
  var storageKeys = {
    registration: "juliaParticipantRegistration",
    access: "juliaParticipantAccess",
  };

  var accessLevels = {
    guest: 0,
    registered: 1,
    paid: 2,
  };

  var root = document.querySelector("[data-product-access-root]");

  if (!root) {
    return;
  }

  var productId = root.getAttribute("data-product-id");
  var productName = root.getAttribute("data-product-name") || "продукт";
  var statusBadge = root.querySelector("[data-access-status-badge]");
  var statusText = root.querySelector("[data-access-status-text]");
  var paymentStatus = root.querySelector("[data-payment-status]");
  var payButton = root.querySelector("[data-payment-button]");
  var actionRegister = root.querySelector('[data-access-action="register"]');
  var actionCabinet = root.querySelector('[data-access-action="cabinet"]');
  var actionMaterials = root.querySelector('[data-access-action="materials"]');
  var gatedBlocks = root.querySelectorAll("[data-access-min]");
  var planCards = root.querySelectorAll("[data-payment-option]");
  var planButtons = root.querySelectorAll("[data-select-plan]");
  var selectedPlanNameNode = root.querySelector("[data-selected-plan-name]");
  var selectedPlanPriceNode = root.querySelector("[data-selected-plan-price]");
  var selectedPlanPanel = root.querySelector("[data-selected-plan-panel]");

  var defaultText = {
    guestBadge: "Доступ: только описание",
    registeredBadge: "Доступ: структура открыта",
    paidBadge: "Доступ: открыт полностью",
    guestText:
      "Вы не зарегистрированы. Сейчас доступно только краткое описание продукта. Зарегистрируйтесь, чтобы открыть структуру материалов и возможность оплаты.",
    registeredText:
      "Вы зарегистрированы, но доступ к полным материалам пока не оплачен. Сейчас можно просматривать краткое описание и содержание продукта.",
    paidText:
      "Оплата подтверждена в демонстрационном режиме. Вам доступны краткое описание, содержание и полный комплект материалов по этому продукту.",
    guestStatus: "Полный доступ станет доступен после регистрации и оплаты.",
    registeredStatus: "Полный доступ к материалам откроется после оплаты.",
    paidStatus: "Доступ открыт. Можно переходить к полным материалам ниже.",
  };

  function getConfiguredText(attributeName, fallback) {
    return root.getAttribute(attributeName) || fallback;
  }

  var textConfig = {
    guestBadge: getConfiguredText("data-badge-guest", defaultText.guestBadge),
    registeredBadge: getConfiguredText("data-badge-registered", defaultText.registeredBadge),
    paidBadge: getConfiguredText("data-badge-paid", defaultText.paidBadge),
    guestText: getConfiguredText("data-status-guest", defaultText.guestText),
    registeredText: getConfiguredText("data-status-registered", defaultText.registeredText),
    paidText: getConfiguredText("data-status-paid", defaultText.paidText),
    guestStatus: getConfiguredText("data-panel-status-guest", defaultText.guestStatus),
    registeredStatus: getConfiguredText("data-panel-status-registered", defaultText.registeredStatus),
    paidStatus: getConfiguredText("data-panel-status-paid", defaultText.paidStatus),
  };

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function readStorage(key) {
    try {
      return safeParse(window.localStorage.getItem(key));
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

  function getRegistrationData() {
    return readStorage(storageKeys.registration) || null;
  }

  function hasValidRegistration(registration) {
    if (!registration) {
      return false;
    }

    var hasName = Boolean(registration.name && registration.name.trim());
    var hasContact = Boolean(
      (registration.phone && registration.phone.trim()) ||
        (registration.email && registration.email.trim())
    );

    return hasName && hasContact;
  }

  function getAccessMap() {
    return readStorage(storageKeys.access) || {};
  }

  function getProductState() {
    var accessMap = getAccessMap();
    return accessMap[productId] || {};
  }

  function getAccessState() {
    var registration = getRegistrationData();
    var productState = getProductState();

    if (!hasValidRegistration(registration)) {
      return "guest";
    }

    return productState.isPaid ? "paid" : "registered";
  }

  function saveProductState(nextState) {
    var accessMap = getAccessMap();
    var currentState = accessMap[productId] || {};

    accessMap[productId] = Object.assign({}, currentState, nextState, {
      productName: productName,
      updatedAt: new Date().toISOString(),
    });

    return writeStorage(storageKeys.access, accessMap);
  }

  function getPlanDataFromCard(card) {
    if (!card) {
      return null;
    }

    return {
      planId: card.getAttribute("data-plan-id") || "",
      planName: card.getAttribute("data-plan-name") || "",
      planPrice: card.getAttribute("data-plan-price") || "",
      planDescription: card.getAttribute("data-plan-description") || "",
    };
  }

  function getCurrentPlan() {
    var productState = getProductState();

    if (productState.selectedPlanId && productState.selectedPlanName) {
      return {
        planId: productState.selectedPlanId,
        planName: productState.selectedPlanName,
        planPrice: productState.selectedPlanPrice || "",
        planDescription: productState.selectedPlanDescription || "",
      };
    }

    var selectedCard = root.querySelector("[data-payment-option].is-selected");
    return getPlanDataFromCard(selectedCard);
  }

  function updatePlanSummary(plan) {
    if (!selectedPlanPanel) {
      return;
    }

    if (!plan || !plan.planName) {
      selectedPlanPanel.hidden = true;
      if (selectedPlanNameNode) {
        selectedPlanNameNode.textContent = "—";
      }
      if (selectedPlanPriceNode) {
        selectedPlanPriceNode.textContent = "—";
      }
      return;
    }

    selectedPlanPanel.hidden = false;

    if (selectedPlanNameNode) {
      selectedPlanNameNode.textContent = plan.planName;
    }

    if (selectedPlanPriceNode) {
      selectedPlanPriceNode.textContent = plan.planPrice || "Стоимость уточняется";
    }
  }

  function updatePayButtonLabel(plan) {
    if (!payButton) {
      return;
    }

    if (!planCards.length) {
      payButton.textContent = "Оплатить доступ";
      payButton.disabled = false;
      return;
    }

    if (!plan || !plan.planName) {
      payButton.textContent = "Сначала выберите формат";
      payButton.disabled = true;
      return;
    }

    payButton.textContent = plan.planPrice
      ? "Оплатить: " + plan.planPrice
      : "Оплатить доступ";
    payButton.disabled = false;
  }

  function setSelectedPlan(plan) {
    planCards.forEach(function (card) {
      var isSelected = card.getAttribute("data-plan-id") === plan.planId;
      card.classList.toggle("is-selected", isSelected);

      var button = card.querySelector("[data-select-plan]");
      if (button) {
        button.textContent = isSelected ? "Формат выбран" : "Выбрать формат";
        button.setAttribute("aria-pressed", isSelected ? "true" : "false");
      }
    });

    updatePlanSummary(plan);
    updatePayButtonLabel(plan);
    saveProductState({
      selectedPlanId: plan.planId,
      selectedPlanName: plan.planName,
      selectedPlanPrice: plan.planPrice,
      selectedPlanDescription: plan.planDescription,
    });
  }

  function initializePlanSelection() {
    if (!planCards.length) {
      updatePlanSummary(getCurrentPlan());
      updatePayButtonLabel(getCurrentPlan());
      return;
    }

    var storedPlan = getCurrentPlan();
    var matchedCard = null;

    if (storedPlan && storedPlan.planId) {
      matchedCard = Array.prototype.find.call(planCards, function (card) {
        return card.getAttribute("data-plan-id") === storedPlan.planId;
      });
    }

    if (matchedCard && storedPlan) {
      setSelectedPlan(storedPlan);
      return;
    }

    updatePlanSummary(null);
    updatePayButtonLabel(null);
  }

  function showStatus(message, type) {
    if (!paymentStatus) {
      return;
    }

    paymentStatus.textContent = message;
    paymentStatus.classList.remove("is-success", "is-error");

    if (type) {
      paymentStatus.classList.add(type);
    }
  }

  function updateStatusPanel(state) {
    if (statusBadge) {
      statusBadge.classList.remove("is-guest", "is-registered", "is-paid");
      statusBadge.classList.add(
        state === "guest" ? "is-guest" : state === "registered" ? "is-registered" : "is-paid"
      );
    }

    if (state === "guest") {
      if (statusBadge) {
        statusBadge.textContent = textConfig.guestBadge;
      }
      if (statusText) {
        statusText.textContent = textConfig.guestText;
      }
      if (actionRegister) {
        actionRegister.hidden = false;
      }
      if (actionCabinet) {
        actionCabinet.hidden = true;
      }
      if (actionMaterials) {
        actionMaterials.hidden = true;
      }
      if (payButton) {
        payButton.hidden = true;
      }
      showStatus(textConfig.guestStatus, "");
      return;
    }

    if (state === "registered") {
      if (statusBadge) {
        statusBadge.textContent = textConfig.registeredBadge;
      }
      if (statusText) {
        statusText.textContent = textConfig.registeredText;
      }
      if (actionRegister) {
        actionRegister.hidden = true;
      }
      if (actionCabinet) {
        actionCabinet.hidden = false;
      }
      if (actionMaterials) {
        actionMaterials.hidden = true;
      }
      if (payButton) {
        payButton.hidden = false;
      }
      showStatus(textConfig.registeredStatus, "");
      return;
    }

    if (statusBadge) {
      statusBadge.textContent = textConfig.paidBadge;
    }
    if (statusText) {
      statusText.textContent = textConfig.paidText;
    }
    if (actionRegister) {
      actionRegister.hidden = true;
    }
    if (actionCabinet) {
      actionCabinet.hidden = false;
    }
    if (actionMaterials) {
      actionMaterials.hidden = false;
    }
    if (payButton) {
      payButton.hidden = true;
    }
    showStatus(textConfig.paidStatus, "is-success");
  }

  function updateGatedBlocks(state) {
    gatedBlocks.forEach(function (block) {
      var minimumState = block.getAttribute("data-access-min") || "guest";
      var hasAccess = accessLevels[state] >= accessLevels[minimumState];
      block.hidden = !hasAccess;
    });
  }

  function render() {
    var state = getAccessState();
    var currentPlan = getCurrentPlan();

    updateStatusPanel(state);
    updateGatedBlocks(state);

    if (state === "guest") {
      updatePlanSummary(null);
      return;
    }

    updatePlanSummary(currentPlan);

    if (state === "registered") {
      updatePayButtonLabel(currentPlan);
    }
  }

  function startDemoPaymentFlow() {
    var chosenPlan = getCurrentPlan();

    if (planCards.length && (!chosenPlan || !chosenPlan.planName)) {
      showStatus("Сначала выберите подходящий формат доступа, а затем переходите к оплате.", "is-error");
      return;
    }

    if (payButton) {
      payButton.disabled = true;
      payButton.textContent = "Открываем доступ...";
    }

    /*
      В будущем здесь можно вызвать backend, например:
      fetch('/api/payments/create-session', {
        method: 'POST',
        body: JSON.stringify({ productId: productId, planId: chosenPlan ? chosenPlan.planId : null })
      })
      и затем перенаправить пользователя в настоящий платёжный сценарий.
    */
    window.setTimeout(function () {
      var isSaved = saveProductState({
        isPaid: true,
        paidAt: new Date().toISOString(),
        selectedPlanId: chosenPlan ? chosenPlan.planId : "",
        selectedPlanName: chosenPlan ? chosenPlan.planName : "",
        selectedPlanPrice: chosenPlan ? chosenPlan.planPrice : "",
        selectedPlanDescription: chosenPlan ? chosenPlan.planDescription : "",
      });

      if (!isSaved) {
        showStatus(
          "Не удалось сохранить статус оплаты в браузере. Проверьте настройки localStorage и попробуйте снова.",
          "is-error"
        );
        if (payButton) {
          payButton.disabled = false;
          updatePayButtonLabel(chosenPlan);
        }
        return;
      }

      render();
      if (payButton) {
        payButton.disabled = false;
        updatePayButtonLabel(chosenPlan);
      }

      if (chosenPlan && chosenPlan.planName) {
        showStatus(
          "Демо-оплата активирована. Полный доступ открыт для формата «" +
            chosenPlan.planName +
            "».",
          "is-success"
        );
      }
    }, 450);
  }

  planButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var parentCard = button.closest("[data-payment-option]");
      var plan = getPlanDataFromCard(parentCard);

      if (!plan || !plan.planId) {
        return;
      }

      setSelectedPlan(plan);
      showStatus(
        "Формат «" + plan.planName + "» выбран. Теперь можно перейти к демонстрационной оплате.",
        ""
      );
    });
  });

  if (payButton) {
    payButton.addEventListener("click", startDemoPaymentFlow);
  }

  initializePlanSelection();
  render();
})();
